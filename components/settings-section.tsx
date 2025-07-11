"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Trash2, Power, PowerOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { guidelinesService } from "@/lib/supabase/guidelines";
import { GuidelineLite } from "@/types/client";

export function SettingsSection() {
  const [allGuidelines, setAllGuidelines] = React.useState<GuidelineLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState<
    "global" | "conditional" | null
  >(null);

  const [newGuideline, setNewGuideline] = React.useState({
    condition: "",
    guideline: "",
  });

  const [actionLoading, setActionLoading] = React.useState<{
    [key: string]: boolean;
  }>({});

  const { globalGuidelines, conditionalGuidelines } = React.useMemo(() => {
    return allGuidelines.reduce(
      (acc, guideline) => {
        if (guideline.is_global) {
          acc.globalGuidelines.push(guideline);
        } else {
          acc.conditionalGuidelines.push(guideline);
        }
        return acc;
      },
      {
        globalGuidelines: [] as GuidelineLite[],
        conditionalGuidelines: [] as GuidelineLite[],
      }
    );
  }, [allGuidelines]);

  React.useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      setLoading(true);
      setError(null);

      const allGuidelines = await guidelinesService.getAllGuidelines();
      setAllGuidelines(allGuidelines);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load guidelines"
      );
    } finally {
      setLoading(false);
    }
  };

  const setItemLoading = (id: number, loading: boolean) => {
    setActionLoading(prev => ({ ...prev, [id]: loading }));
  };

  const handleAddGuideline = async (isGlobal: boolean) => {
    if (
      !newGuideline.guideline.trim() ||
      (!isGlobal && !newGuideline.condition.trim())
    ) {
      return;
    }

    try {
      setItemLoading(-1, true);

      const guidelineData = {
        condition: isGlobal ? null : newGuideline.condition.trim(),
        guideline: newGuideline.guideline.trim(),
        is_global: isGlobal,
      };

      const response = await fetch("/api/guidelines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(guidelineData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create guideline");
      }

      const { guideline: newGuidelineRecord } = await response.json();

      setAllGuidelines(prev => [newGuidelineRecord, ...prev]);
      setNewGuideline({ condition: "", guideline: "" });
      setShowAddForm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add guideline");
    } finally {
      setItemLoading(-1, false);
    }
  };

  const handleDeleteGuideline = async (id: number) => {
    try {
      setItemLoading(id, true);

      await guidelinesService.deleteGuideline(id);

      setAllGuidelines(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete guideline"
      );
    } finally {
      setItemLoading(id, false);
    }
  };

  const handleToggleGuideline = async (id: number) => {
    try {
      setItemLoading(id, true);

      const updatedGuideline = await guidelinesService.toggleGuideline(id);

      setAllGuidelines(prev =>
        prev.map(g => (g.id === id ? updatedGuideline : g))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to toggle guideline"
      );
    } finally {
      setItemLoading(id, false);
    }
  };

  const renderGuideline = (guideline: GuidelineLite) => {
    const isLoading = actionLoading[guideline.id];
    const isEnabled = !guideline.is_disabled;

    return (
      <div
        key={guideline.id}
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border transition-colors",
          isEnabled ? "bg-background" : "bg-muted/30"
        )}
      >
        <div className="flex-1 min-w-0">
          {!guideline.is_global && (
            <div className="text-sm text-muted-foreground mb-1">
              When: {guideline.condition}
            </div>
          )}
          <div
            className={cn("text-sm", !isEnabled && "opacity-50 line-through")}
          >
            {guideline.guideline}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleGuideline(guideline.id)}
            disabled={isLoading}
            className={cn(
              "h-8 w-8 p-0",
              isEnabled
                ? "text-green-600 hover:text-green-700"
                : "text-gray-400 hover:text-gray-500"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isEnabled ? (
              <Power className="h-3 w-3" />
            ) : (
              <PowerOff className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteGuideline(guideline.id)}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderAddForm = (isGlobal: boolean) => {
    const isLoading = actionLoading[-1];

    return (
      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
        {!isGlobal && (
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Input
              id="condition"
              placeholder="When should this guideline apply?"
              value={newGuideline.condition}
              onChange={e =>
                setNewGuideline(prev => ({
                  ...prev,
                  condition: e.target.value,
                }))
              }
              disabled={isLoading}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="guideline">Guideline</Label>
          <Input
            id="guideline"
            placeholder="What should the agent do?"
            value={newGuideline.guideline}
            onChange={e =>
              setNewGuideline(prev => ({ ...prev, guideline: e.target.value }))
            }
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleAddGuideline(isGlobal)}
            disabled={
              isLoading ||
              !newGuideline.guideline.trim() ||
              (!isGlobal && !newGuideline.condition.trim())
            }
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add Guideline
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowAddForm(null);
              setNewGuideline({ condition: "", guideline: "" });
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full p-6 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading guidelines...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Agent Guidelines</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={loadGuidelines}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        )}

        <div className="space-y-8">
          {/* Global Guidelines */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Global Guidelines</h2>
                <p className="text-sm text-muted-foreground">
                  Apply to all interactions (
                  {globalGuidelines.filter(g => !g.is_disabled).length} active)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm("global")}
                disabled={showAddForm === "global"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Guideline
              </Button>
            </div>

            <div className="space-y-2">
              {showAddForm === "global" && (
                <div className="mt-4">{renderAddForm(true)}</div>
              )}

              {globalGuidelines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No global guidelines yet. Add one to get started.
                </div>
              ) : (
                globalGuidelines.map(guideline => renderGuideline(guideline))
              )}
            </div>
          </Card>

          {/* Conditional Guidelines */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Conditional Guidelines
                </h2>
                <p className="text-sm text-muted-foreground">
                  Apply when specific conditions are met (
                  {conditionalGuidelines.filter(g => !g.is_disabled).length}{" "}
                  active)
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm("conditional")}
                disabled={showAddForm === "conditional"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Guideline
              </Button>
            </div>

            <div className="space-y-2">
              {showAddForm === "conditional" && (
                <div className="mt-4">{renderAddForm(false)}</div>
              )}

              {conditionalGuidelines.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conditional guidelines yet. Add one to get started.
                </div>
              ) : (
                conditionalGuidelines.map(guideline =>
                  renderGuideline(guideline)
                )
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

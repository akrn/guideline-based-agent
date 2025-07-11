# Guideline-based agent

This is a prototype of a conversational agent that modifies its behavior dynamically based on the conversation history and the guidelines stored in the database.

## About the project

### Tech Stack

- Next.js
- Supabase
- OpenAI (for LLM)
- Tailwind CSS
- Radix UI

### How it works

Agent uses guidelines to guide its behavior by dynamically selecting the most relevant guidelines based on the conversation history and modifying the system prompt accordingly.

Guidelines can be added globally or conditionally. Global guidelines are applied to all conversations, while conditional guidelines are applied only when the current conversation state matches the condition. Condition guidelines will be applied only once per conversation, unless the condition is met again for a new reason.

#### Conditional guideline selection process

1. When a new conditional guideline is added, the agent creates an embedding for the guideline and stores it in the database.
2. When a new message is received, the agent creates an embedding for the entire conversation history and then searches for the most relevant guidelines in the database using semantic search returning top-k (k=5 by default) most relevant guidelines based on cosine similarity.
3. The agent then calls LLM to filter out guidelines that are not relevant to the current conversation providing the conversation history and the top-k most relevant guidelines.
4. The agent modifies the system prompt to include the selected guidelines from the previous step and calls the LLM to generate a response for the user.

#### Things to improve and add

- Preprocess guidelines (using LLM?) before storing them in the database
- Include current context into the system prompt so that conditional guidelines can use it (e.g. today's date, user registration date, user plan, etc.)
- Potentially add tags/properties to guidelines that can be used to filter them out based on some criteria before performing semantic search (e.g. tags: "user_plan:pro", "user_plan:free", etc.)
- Extend conditional guidelines by adding an option to call tools based on condition

## Setting up and running the project

### 1. Prerequisites

- Node.js 20+
- Docker (for running supabase locally)
- OpenAI API key

### 2. Running supabase locally

_This can be skipped if you're using a remote Supabase project._

Install and run supabase locally:

```bash
yarn add -D supabase
yarn supabase start
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 # Or your remote supabase project url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

If you're running supabase locally, you can obtain the supabase anon key from the console when you run `supabase start`.

### 4. Running the project

```bash
yarn dev
```

Open your browser and go to http://localhost:3000

### 🔄 Project Awareness & Context
- **Always read `INITIAL.md`** at the start of a new conversation to understand the AutoGen agent system's architecture, goals, and implementation plan.
- **Check `INITIAL_EXAMPLE.md`** for complete reference code before implementing any agent logic.
- **Use consistent naming conventions, file structure, and architecture patterns** as described in `INITIAL.md`.
- **Use venv_linux** (the virtual environment) whenever executing Python commands, including for unit tests.
- **The Vue 3 frontend** (`src/`) is the host project (TaskFlow). The AutoGen agent system is a Python service that integrates with it.

### 🧱 Code Structure & Modularity
- **Never create a file longer than 500 lines of code.** If a file approaches this limit, refactor by splitting it into modules or helper files.
- **Organize code into clearly separated modules**, grouped by feature or responsibility.
  For agents this looks like:
    - `agent.py` - Main agent definition and execution logic
    - `tools.py` - Tool functions used by the agent
    - `prompts.py` - System prompts and selector prompts
- **Use clear, consistent imports** (prefer relative imports within packages).
- **Use python_dotenv and load_env()** for environment variables (API keys, model endpoints).

### 🧪 Testing & Reliability
- **Always create Pytest unit tests for new features** (functions, classes, routes, etc).
- **After updating any logic**, check whether existing unit tests need to be updated. If so, do it.
- **Tests should live in a `/tests` folder** mirroring the main app structure.
  - Include at least:
    - 1 test for expected use
    - 1 edge case
    - 1 failure case

### ✅ Task Completion
- **Mark completed tasks in `TASK.md`** immediately after finishing them.
- Add new sub-tasks or TODOs discovered during development to `TASK.md` under a "Discovered During Work" section.

### 📎 Style & Conventions
- **Use Python** as the primary language for the agent system.
- **Follow PEP8**, use type hints, and format with `black`.
- **Use `pydantic` for data validation** (e.g., `CodeRequest` model for FastAPI input).
- Use **`FastAPI`** for APIs and **`SQLAlchemy`** or **`SQLModel`** for ORM if applicable.
- Write **docstrings for every function** using the Google style:
  ```python
  def selector_func(messages: Sequence[BaseAgentEvent | BaseChatMessage]) -> str | None:
      """
      Determine the next speaker based on the last message source.

      Args:
          messages: Sequence of agent events and chat messages.

      Returns:
          The name of the next agent to speak, or None for default selection.
      """
  ```

### 🤖 AutoGen Agent Conventions
- **Use AutoGen v0.4+ API** (`autogen-agentchat` + `autogen-ext[openai]`).
- **Each agent** has its own file under `agents/`: `code_generator.py`, `code_reviewer.py`, `code_optimizer.py`.
- **Agent names** must be unique and descriptive: `CodeGenerator`, `CodeReviewer`, `CodeOptimizer`.
- **Use `SelectorGroupChat`** for multi-agent coordination — never use `RoundRobinGroupChat` for this project.
- **Termination conditions**: always combine `TextMentionTermination("CODE_FINAL")` with `MaxMessageTermination` as a safety net.
- **Custom `selector_func`** controls agent turn order; fall back to `None` for model-based selection.

### 📚 Documentation & Explainability
- **Update `README.md`** when new features are added, dependencies change, or setup steps are modified.
- **Comment non-obvious code** and ensure everything is understandable to a mid-level developer.
- When writing complex logic, **add an inline `# Reason:` comment** explaining the why, not just the what.

### 🧠 AI Behavior Rules
- **Never assume missing context. Ask questions if uncertain.**
- **Never hallucinate libraries or functions** – only use known, verified Python packages from AutoGen v0.4+ API.
- **Always confirm file paths and module names** exist before referencing them in code or tests.
- **Never delete or overwrite existing code** unless explicitly instructed to or if part of a task from `TASK.md`.

### 🔗 Project Context (TaskFlow Frontend)
- **Frontend stack**: Vue 3 + TypeScript + Naive UI + Pinia + Vue Router (under `src/`).
- **Generated code** should target this stack: `<script setup lang="ts">`, Composition API, Naive UI components.
- **API pattern**: `src/api/` modules use Axios with JWT auth, base path `/api`.
- **Backend** (Spring Boot) is separate — the agent Python service integrates via REST API.
- **Existing AI endpoint**: `POST /api/ai/parse-task` in `src/api/ai.ts`.
- **Do not modify `dist/`** — it is build output.
- **`samples/` directory** contains AutoGen Python examples, unrelated to the Vue frontend.

# INITIAL.md — AutoGen Code Generation Agent System

> Implementation blueprint for a multi-agent system using Microsoft AutoGen (v0.4+).
> Goal: User requirement -> Code generation -> Quality review -> Optimization.
> See `INITIAL_EXAMPLE.md` for the complete runnable reference code.

---

## System Architecture

```
User Input
    ↓
CodeGenerator  ──→  CodeReviewer  ──→  CodeOptimizer  ──→  CODE_FINAL
    ↑                   │ need fix              │ need fix
    └───────────────────┘                       │
    └───────────────────────────────────────────┘
```

- **3 Agents** coordinated via `SelectorGroupChat` with a custom `selector_func`.
- **Termination**: `TextMentionTermination("CODE_FINAL") | MaxMessageTermination(20)`.
- **Integration**: FastAPI service exposing SSE endpoint, consumed by the Vue 3 frontend.

---

## Agent Definitions

### CodeGenerator
- **Role**: Generate code from user requirements; revise code based on review feedback.
- **Output markers**: `【代码生成完成，请审查】` / `【代码已修复，请再次审查】`
- **Triggers**: User input, review feedback requiring changes, optimizer rework request.

### CodeReviewer
- **Role**: Full quality inspection of generated code.
- **Dimensions**: Security, Performance, Maintainability, Code Standards, Correctness, Error Handling.
- **Output markers**: `【审查通过】` or `【需要修改】` + issue list.

### CodeOptimizer
- **Role**: Final optimization on reviewed code, output the definitive version.
- **Focus**: Performance, simplification, TypeScript type safety, Vue 3 / Naive UI best practices.
- **Output marker**: `CODE_FINAL` (triggers termination).

### UserProxy (optional)
- **Role**: Collect user feedback at key decision points.
- **When**: Requirements clarification, review approval, final code sign-off.

---

## Project Structure

```
agent/
├── __init__.py
├── config.py              # Model client config (env vars)
├── agents/
│   ├── __init__.py
│   ├── code_generator.py  # CodeGenerator agent + system prompt
│   ├── code_reviewer.py   # CodeReviewer agent + system prompt
│   └── code_optimizer.py  # CodeOptimizer agent + system prompt
├── prompts.py             # Selector prompt template
├── selector.py            # Custom selector_func logic
├── termination.py         # Combined termination conditions
├── team.py                # SelectorGroupChat factory
├── main.py                # CLI entry point
└── api.py                 # FastAPI SSE endpoint
tests/
├── test_selector.py
├── test_termination.py
├── test_team.py
└── test_api.py
.env                       # OPENAI_API_KEY, OPENAI_BASE_URL, AGENT_MODEL
```

---

## Implementation Steps

### Step 1: Environment Setup

```bash
pip install -U "autogen-agentchat" "autogen-ext[openai]" "fastapi" "uvicorn" "python-dotenv"
```

Create `.env`:
```
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
AGENT_MODEL=gpt-4o
```

### Step 2: config.py

```python
import os
from dotenv import load_dotenv
from autogen_ext.models.openai import OpenAIChatCompletionClient

load_dotenv()

def create_model_client() -> OpenAIChatCompletionClient:
    """
    Create and return the OpenAI-compatible model client.

    Returns:
        OpenAIChatCompletionClient: Configured model client instance.
    """
    return OpenAIChatCompletionClient(
        model=os.getenv("AGENT_MODEL", "gpt-4o"),
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL"),
    )
```

### Step 3: agents/ — One file per agent

Each agent file exports a factory function:

```python
# agents/code_generator.py
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient

GENERATOR_PROMPT = """..."""  # See INITIAL_EXAMPLE.md for full prompt

def create_generator(model_client: OpenAIChatCompletionClient) -> AssistantAgent:
    """
    Create the CodeGenerator agent.

    Args:
        model_client: The LLM client instance.

    Returns:
        AssistantAgent: Configured code generator agent.
    """
    return AssistantAgent(
        name="CodeGenerator",
        description="代码生成专家。根据用户需求生成高质量代码。收到新需求或修改反馈时首先响应。",
        model_client=model_client,
        system_message=GENERATOR_PROMPT,
    )
```

Follow the same pattern for `code_reviewer.py` and `code_optimizer.py`.
Full system prompts are in `INITIAL_EXAMPLE.md`.

### Step 4: selector.py

```python
from typing import Sequence
from autogen_agentchat.messages import BaseAgentEvent, BaseChatMessage

def selector_func(messages: Sequence[BaseAgentEvent | BaseChatMessage]) -> str | None:
    """
    Determine the next speaker based on message history.

    Args:
        messages: Sequence of agent events and chat messages.

    Returns:
        Agent name string for explicit selection, or None for model-based selection.
    """
    if not messages:
        return "CodeGenerator"

    last = messages[-1]
    src = last.source
    content = getattr(last, "content", "")

    if src == "user":
        return "CodeGenerator"
    if src == "CodeGenerator":
        return "CodeReviewer"
    if src == "CodeReviewer":
        if isinstance(content, str) and "审查通过" in content:
            return "CodeOptimizer"
        return "CodeGenerator"
    if src == "CodeOptimizer":
        if isinstance(content, str) and "请 CodeGenerator" in content:
            return "CodeGenerator"
        return None  # CODE_FINAL handled by termination
    return None
```

### Step 5: termination.py

```python
from autogen_agentchat.conditions import TextMentionTermination, MaxMessageTermination

def create_termination():
    """
    Create combined termination condition.

    Returns:
        Combined termination: CODE_FINAL text OR max 20 messages.
    """
    return (
        TextMentionTermination("CODE_FINAL")
        | MaxMessageTermination(max_messages=20)
    )
```

### Step 6: team.py

```python
from autogen_agentchat.teams import SelectorGroupChat

def create_team(agents, model_client, termination, selector_func, selector_prompt):
    """
    Assemble the SelectorGroupChat team.

    Args:
        agents: List of agent instances.
        model_client: LLM client for speaker selection.
        termination: Termination condition.
        selector_func: Custom speaker selection function.
        selector_prompt: Prompt template for the selector.

    Returns:
        SelectorGroupChat: Configured multi-agent team.
    """
    return SelectorGroupChat(
        agents,
        model_client=model_client,
        termination_condition=termination,
        selector_prompt=selector_prompt,
        selector_func=selector_func,
        allow_repeated_speaker=True,
    )
```

### Step 7: main.py

```python
import asyncio
from autogen_agentchat.ui import Console
from config import create_model_client
from agents.code_generator import create_generator
from agents.code_reviewer import create_reviewer
from agents.code_optimizer import create_optimizer
from selector import selector_func
from termination import create_termination
from team import create_team
from prompts import SELECTOR_PROMPT

async def run(task: str):
    """
    Run the agent team on a given task.

    Args:
        task: The user's code generation requirement.
    """
    client = create_model_client()
    agents = [create_generator(client), create_reviewer(client), create_optimizer(client)]
    team = create_team(agents, client, create_termination(), selector_func, SELECTOR_PROMPT)
    result = await Console(team.run_stream(task=task))
    await client.close()
    return result

if __name__ == "__main__":
    asyncio.run(run("请实现一个 Vue 3 的 useDebounce composable"))
```

### Step 8: api.py (FastAPI integration)

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

class CodeRequest(BaseModel):
    requirement: str
    language: str = "typescript"
    framework: str = "vue3"

@app.post("/api/agent/generate")
async def generate_code(request: CodeRequest):
    """
    SSE endpoint for streaming agent output to the frontend.

    Args:
        request: Code generation request with requirement, language, framework.

    Returns:
        StreamingResponse: SSE stream of agent messages.
    """
    task = f"请使用 {request.language} ({request.framework}) 实现：{request.requirement}"
    # ... wire up team and stream
    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

---

## Frontend Integration

Add to `src/api/ai.ts`:

```typescript
export async function generateCodeWithAgent(requirement: string) {
  const response = await fetch('/api/agent/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ requirement, language: 'typescript', framework: 'vue3' }),
  })
  return response.body // ReadableStream for SSE
}
```

---

## TaskFlow Code Generation Conventions

When generating code for the TaskFlow project, agents MUST follow these rules:

1. **Use `<script setup lang="ts">`** — never Options API.
2. **Types**: shared in `src/types/index.ts`, component-local types defined nearby.
3. **API calls**: encapsulated in `src/api/` modules using the Axios instance.
4. **Composables**: reusable logic in `src/composables/` with `use` prefix.
5. **State**: Pinia Setup Store pattern (`defineStore('name', () => { ... })`).
6. **Components**: use Naive UI library — never custom basic components when Naive UI has one.
7. **Styles**: use CSS variables from `src/styles/variables.css`, dark theme, `#00e5ff` accent.
8. **Routes**: register in `src/router/index.ts` with appropriate auth guards.

---

## References

- AutoGen AgentChat: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/
- SelectorGroupChat: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/selector-group-chat.html
- Teams: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html
- INITIAL_EXAMPLE.md: Complete runnable reference code

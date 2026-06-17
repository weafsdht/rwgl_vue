# INITIAL_EXAMPLE.md — AutoGen Code Generation Agent Reference Code

> Complete runnable reference for a multi-agent system using AutoGen (v0.4+).
> Flow: Code generation -> Quality review -> Optimization.
> Do NOT run this file directly — use it as a reference when implementing per INITIAL.md.

---

## Install

```bash
pip install -U "autogen-agentchat" "autogen-ext[openai]"
```

---

## Complete Code

```python
"""
AutoGen Multi-Agent Code Generation System
===========================================
3 agents: CodeGenerator -> CodeReviewer -> CodeOptimizer
Uses SelectorGroupChat with custom selector_func.
Terminates on CODE_FINAL or max 20 messages.
"""

import asyncio
from typing import Sequence

from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.conditions import (
    TextMentionTermination,
    MaxMessageTermination,
)
from autogen_agentchat.messages import BaseAgentEvent, BaseChatMessage
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.ui import Console
from autogen_ext.models.openai import OpenAIChatCompletionClient


# ── 1. Model Client ──────────────────────────
model_client = OpenAIChatCompletionClient(
    model="gpt-4o",
    # api_key="YOUR_API_KEY",
    # base_url="https://api.xxx.com/v1",
)


# ── 2. Agents ────────────────────────────────

code_generator = AssistantAgent(
    name="CodeGenerator",
    description=(
        "代码生成专家。根据用户需求生成高质量的代码。"
        "当收到新的开发需求时，此 Agent 应首先响应。"
        "当收到代码审查反馈或优化建议时，负责修改和重新生成代码。"
    ),
    model_client=model_client,
    system_message="""
你是一个专业的代码生成专家。你的职责是：

1. 根据用户输入的开发需求，生成清晰、可运行的代码。
2. 代码必须包含必要的注释说明。
3. 遵循最佳实践和设计模式。
4. 生成代码后，在末尾添加标记：【代码生成完成，请审查】

注意事项：
- 使用用户指定的编程语言（默认 TypeScript / Vue 3）
- 代码应具有合理的错误处理
- 变量命名要语义化
- 如果需求不明确，做出合理假设并在代码注释中说明

当审查者提出修改意见时，你需要根据反馈修改代码并重新输出。
修改完成后同样添加标记：【代码已修复，请再次审查】
""",
)

code_reviewer = AssistantAgent(
    name="CodeReviewer",
    description=(
        "代码质量审查专家。对生成的代码进行全面的质量检查。"
        "检查内容包括：安全性、性能、可维护性、代码规范。"
    ),
    model_client=model_client,
    system_message="""
你是一个严格的代码质量审查专家。你的职责是对 CodeGenerator 生成的代码进行全面审查。

审查维度：
1. **安全性**：检查是否存在注入漏洞、XSS、敏感信息泄露等安全问题。
2. **性能**：检查是否有性能瓶颈、不必要的计算、内存泄漏风险。
3. **可维护性**：代码结构是否清晰、是否易于扩展和修改。
4. **代码规范**：命名规范、注释完整性、代码格式。
5. **功能正确性**：逻辑是否正确、边界条件是否处理。
6. **错误处理**：异常处理是否完善。

输出格式：
- 如果代码质量合格，回复：【审查通过】+ 简要评价
- 如果代码需要修改，列出具体问题并给出修改建议，回复：【需要修改】+ 问题列表
- 如果只有小问题，可以直接给出修复后的代码片段

审查标准要严格但合理。不要为了找问题而找问题。
""",
)

code_optimizer = AssistantAgent(
    name="CodeOptimizer",
    description=(
        "代码优化和最终确认专家。对审查通过的代码进行最终优化，"
        "输出最终版本并结束流程。"
    ),
    model_client=model_client,
    system_message="""
你是一个代码优化专家。你的职责是对审查通过的代码进行最终优化并输出最终版本。

优化方向：
1. 性能优化：减少不必要的计算、优化算法复杂度。
2. 代码简化：消除冗余代码、合并重复逻辑。
3. 类型安全：确保 TypeScript 类型定义完整准确。
4. 可读性提升：优化代码结构和命名。
5. 最佳实践：应用框架（Vue 3 / Naive UI）的最佳实践。

输出规范：
1. 输出完整的最终版代码（不是片段，是完整文件）。
2. 在代码前添加简要的优化说明。
3. 在输出末尾必须包含标记：CODE_FINAL

如果审查结果为【需要修改】，你应该将审查意见传递给 CodeGenerator 重新生成。
回复格式："请 CodeGenerator 根据以下审查意见修改代码：[审查意见]"
""",
)


# ── 3. Selector Function ─────────────────────

def selector_func(messages: Sequence[BaseAgentEvent | BaseChatMessage]) -> str | None:
    """
    Control agent turn order.

    Args:
        messages: Sequence of agent events and chat messages.

    Returns:
        Agent name for explicit selection, or None for default.
    """
    if not messages:
        return code_generator.name

    last = messages[-1]
    src = last.source
    content = getattr(last, "content", "")

    if src == "user":
        return code_generator.name
    if src == code_generator.name:
        return code_reviewer.name
    if src == code_reviewer.name:
        if isinstance(content, str) and "审查通过" in content:
            return code_optimizer.name
        return code_generator.name
    if src == code_optimizer.name:
        if isinstance(content, str) and "请 CodeGenerator" in content:
            return code_generator.name
        return None
    return None


# ── 4. Termination ───────────────────────────

text_termination = TextMentionTermination("CODE_FINAL")
max_message_termination = MaxMessageTermination(max_messages=20)
termination = text_termination | max_message_termination


# ── 5. Selector Prompt ───────────────────────

selector_prompt = """Select an agent to perform task.

{roles}

Current conversation context:
{history}

Read the above conversation, then select an agent from {participants} to perform the next task.
Workflow: CodeGenerator -> CodeReviewer -> CodeOptimizer
- New requirements go to CodeGenerator first.
- Generated code goes to CodeReviewer.
- Approved code goes to CodeOptimizer.
- Code needing fixes goes back to CodeGenerator.
"""


# ── 6. Team ──────────────────────────────────

team = SelectorGroupChat(
    [code_generator, code_reviewer, code_optimizer],
    model_client=model_client,
    termination_condition=termination,
    selector_prompt=selector_prompt,
    selector_func=selector_func,
    allow_repeated_speaker=True,
)


# ── 7. Run ───────────────────────────────────

async def main():
    """Run the agent team with a sample task."""
    task = "请实现一个 Vue 3 组合式 API 的 useDebounce composable，支持泛型函数防抖，包含 leading 和 trailing 选项。"
    result = await Console(team.run_stream(task=task))
    await model_client.close()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Key API Quick Reference

### AssistantAgent
| Parameter | Description |
|-----------|-------------|
| `name` | Unique agent ID, used by selector |
| `description` | Role description for SelectorGroupChat |
| `model_client` | LLM client instance |
| `system_message` | Behavior and output format instructions |
| `tools` | List of Python callables the agent can use |
| `reflect_on_tool_use` | Summarize tool output in natural language |

### SelectorGroupChat
| Parameter | Description |
|-----------|-------------|
| `participants` | List of agents |
| `model_client` | LLM for speaker selection |
| `termination_condition` | When to stop (supports `\|` and `&`) |
| `selector_prompt` | Template with `{roles}`, `{history}`, `{participants}` |
| `selector_func` | Custom function overriding model selection |
| `allow_repeated_speaker` | Allow same agent to speak consecutively |

### Termination Conditions
| Class | Trigger |
|-------|---------|
| `TextMentionTermination` | Specific text in response |
| `MaxMessageTermination` | Message count limit |
| `TokenUsageTermination` | Token usage limit |
| `TimeoutTermination` | Time limit |
| `ExternalTermination` | External manual stop |

---

## References

- AutoGen AgentChat: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/
- SelectorGroupChat: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/selector-group-chat.html
- Teams: https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/teams.html

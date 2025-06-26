---
## 🧩 File Breakdown

### `agent.py`
- Constructs the agent using structured prompts.
- Handles all logic required to reason through tasks.
- Consumes the output of `parse_query.py` to build the agent’s **system prompt**.
- Uses tools defined in `tools.py` as callable actions within the agent loop.
---

### `load_model.py`

- Abstracts model loading and configuration.
- Can include logic for tracing the **agent's reasoning state** over time (e.g., logging or visualization).
- Ensures consistent reuse of the model across different parts of the pipeline.

---

### `main.py`

- Script to run the full system end-to-end.
- Useful for testing input prompts and observing agent behavior.
- Likely calls `parse_query.py` → `agent.py` to simulate full flow.

---

### `parse_query.py`

- Transforms a user’s raw natural language prompt into:
  - **Intent**: The user's goal.
  - **Constraints**: Any time, logic, or resource limits the agent should respect.
- Outputs this structure in a format compatible with `agent.py`.

---

### `tools.py`

- Contains predefined tools the agent can call during its action steps.
- Examples: calendar lookups, file reads, API calls, etc.
- These tools are registered and referenced in the ReAct framework or custom agent setup.

---

### `routes.py` (optional)

- If the project is used as a backend service or API:
  - Defines API endpoints for receiving prompts, triggering the agent, and returning results.
  - Useful for integration with frontend apps, CLI tools, or workflows.

---

## 🚀 Workflow Overview

1. **User Prompt** → `parse_query.py`  
   Extracts goal + constraints.

2. **Structured Prompt** → `agent.py`  
   Builds agent using ReAct or other framework.

3. **Agent Reasoning** → Executes using tools from `tools.py`.

4. **Output Returned** → via `main.py` or `routes.py`.

---

## 🛠 Requirements

- Python 3.11+
- `openai`, `python-dotenv`, `fastapi` (if using `routes.py`), etc.

You can install requirements with:

```bash
pip install -r requirements.txt
```

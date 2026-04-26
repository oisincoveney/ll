---
description: Show the top beads ready task with full detail
disable-model-invocation: true
allowed-tools: Bash(bd *)
---

Run `bd ready` to list available work, then `bd show` on the highest-priority item. Summarize the issue, its dependencies, and the acceptance criteria in under 150 words. Do not claim the task — the user will run `bd update <id> --claim` themselves if they want to proceed.

---
name: commands
description: Canonical build/test/lint commands for this project
---

# Commands

```
dev:       vite dev
build:     vite build
test:      vitest run
typecheck: svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
lint:      svelte-check --tsconfig ./tsconfig.json
format:    prettier --write .
```

Use these exact commands. Do not guess alternatives like `docker compose up`, `npm start`, etc.

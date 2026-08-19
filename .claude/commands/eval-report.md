# /eval-report

Run the eval-driven verification report (stellar-agentic-framework Phase 5):

1. `cd contracts/wordle && cargo test` — CONTRACT EVALS
2. `cd frontend && npm run typecheck && npm run build` — FRONTEND EVALS
3. Verify README/deployment.json/.env.example exist — DOCS EVALS
4. Emit the STELLAR CODING HARNESS :: EVAL REPORT table

Append the report to `data/logs/<date>-@ops.md`.
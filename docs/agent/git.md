# Git Workflow

- Use branches prefixed with `codex/` unless the user asks otherwise.
- Do not commit code/config/runtime changes if lint, typecheck, or build fails.
- Documentation-only commits do not require full app validation by default; verify changed docs with focused review and reference searches instead.
- Keep commits focused and use conventional prefixes such as `feat:`, `fix:`, `docs:`, or `chore:`.
- Split app/code changes and documentation-only updates into separate commits by default.
  - Commit app/code first with the relevant implementation prefix, such as `feat:` or `fix:`.
  - Commit docs-only updates separately with `docs:`.
  - Only combine docs and app/code in one commit when the user explicitly asks for one combined commit or when the docs are inseparable generated artifacts for that exact code change.
- For non-trivial commits, include a commit body after the subject.
  - Subject: imperative mood, 50-72 characters when practical, no trailing period.
  - Body: summarize what changed and why, grouped by concern when useful.
  - Mention behavior changes, validation-impacting changes, and follow-up notes when relevant.
  - Avoid vague subjects like `update`, `changes`, or `fix stuff`.
- Before committing, review `git diff --cached --stat` and verify the staged files match the intended commit boundary.

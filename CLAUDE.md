# CLAUDE.md

Claude Code must read [`AGENTS.md`](AGENTS.md) before changing this repository. `AGENTS.md` is the
authoritative operational guide for package management, architecture, generated code, testing,
formatting, and verification.

Do not treat this file as a snapshot of versions or framework flags. Read executable configs and
the relevant source files, then use the [documentation index](docs/README.md) to find the focused
guide for the task.

Claude-specific reminders:

- preserve unrelated changes in the working tree;
- use npm under Node.js 24;
- edit OpenAPI sources and regenerate `packages/api/codegen/` instead of editing generated files;
- keep Server Components as the default and make client boundaries as narrow as practical;
- report the exact checks run and any checks skipped or blocked.

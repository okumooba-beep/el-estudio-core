# Claude Code Protocol

## Purpose

Standardize how Claude Code works inside El Estudio to minimize token usage, avoid unnecessary work and preserve architectural integrity.

---

## Philosophy

Claude Code is an implementer.

It does not redesign architecture.

It executes one sprint at a time.

The smallest safe change is preferred.

---

## Core Principles

- One sprint = one objective.
- One module = one sprint.
- Stay inside the requested scope.
- Never improve unrelated code.
- Never refactor on your own.
- Prefer modifying existing code over creating new files.
- Ask before expanding the scope.
- Stop immediately after completing the sprint.

---

## Token Economy

Default behavior:

- Do not use Task.
- Do not use Explore.
- Do not use subagents.
- Do not inspect the whole repository.
- Read only the files required.
- Never search for unrelated improvements.

If additional context is required:

Stop.

Report exactly which file is needed and why.

Wait for approval.

---

## Verification

Do not automatically execute:

- tests
- lint
- architecture verification
- full repository validation

Run them only when explicitly requested by the sprint.

---

## Output

Always finish with:

Files modified

What changed

Anything intentionally left untouched

Stop.

Never continue with another task.

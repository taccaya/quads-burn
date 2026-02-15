# AGENTS

Shared rules for AI agents working in this repository.

## Skill Loading (Required)

- Before any React Native / Expo implementation, review skills in this order:
1. `vercel-react-native-skills`
2. `vercel-react-best-practices`
- Use `vercel-react-native-skills` as the default implementation guidance for React Native / Expo tasks.
- Follow KISS (Keep It Simple, Stupid) at all times in both design and implementation.

## Development Operations (Required)

- Start every new ticket in Plan mode.
- Plan mode must include:
1. Requirement definition
2. Impact analysis (changed files and scope of impact)
3. Effort estimate (small/medium/large + rationale)
- Create a working branch before implementation.
  - Recommended: `codex/<topic>`
  - Do not implement directly on `main` or in detached HEAD.
- Start implementation only after user approval of the Plan mode output.

## Task Execution Flow (Required)

1. Create a working branch (example: `codex/<topic>`).
2. Define implementation scope in Plan mode and proceed only after user approval.
3. If UI changes are included, run a Claude UI/UX review with `claude -p` and apply required improvements.

```bash
claude -p "You are a senior UI/UX designer. Analyze {{summary of the current change and affected areas}} and propose UX-focused improvements." \
--model claude-opus-4-6 \
--timeout 600000
```

4. Conduct a code review of the implementation and address all findings.
5. Commit in small steps, strictly following `1 commit = 1 logical change`.
6. Always ask the user: `Are there any changes already merged ahead of this work?`
7. If there are merged changes, use `git-worktree-main-sync` and rebase onto `origin/main`.
8. Default command flow: `git fetch origin --prune` then `git rebase origin/main`.
9. On conflict, identify files with `git diff --name-only --diff-filter=U`, resolve, then run `git rebase --continue`.
10. After resolution, verify no markers remain with `rg -n '^(<<<<<<<|=======|>>>>>>>)' .`.
11. After sync is complete, ask the user: `Do you want me to proceed from commit to PR release notes creation?`
12. Before release, run `pnpm run build` (or equivalent) and confirm there are no build errors. If errors exist, fix and rerun.
13. Write the PR body in the release-note format defined below.

## Commit / PR Rules (Recommended)

- Use `type(scope): summary` for commit messages.
  - Example: `feat(ai): include comment history in context`
- Allowed `type` values: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- Keep `summary` imperative and within 72 characters.
- Enforce `1 commit = 1 logical change`.
- PR title should generally match the commit `summary`.
- PR body must be written in clear English, ready to use as release notes.
- Put `Testing` and `Notes` after the release-note sections.
- Attach screenshots when UI changes are included.
- If DB/env/migration impact exists, clearly describe it in `Notes`.
- In AI-agent reports and PR bodies, reference files by filename only (no paths).
  - Example: `TaskDetailPanel.tsx`

## PR Body Template (Required)

```md
## Title
YYYY/MM/DD Change summary and N more

## Lead
The release on YYYY/MM/DD includes <count> item(s) in <category>.

## Category
<New Feature / Improvement / Accessibility / Bug Fix / Deprecation / Other>

## Heading
<Around 20 characters, no period>

## Body
1. What changed (facts): What was changed, on which screen, and where.
2. Why (background): What problem existed and why this was needed.
3. User impact: What users can now do, and what they can no longer do.

## Testing
- Verification performed

## Notes
- Impact scope, migration steps, known caveats
```

## Release Notes Policy

- Write from the user perspective, focusing on what became possible or no longer possible.
- Add concise background explaining why the change was needed.
- Describe screen/interaction changes, not internal implementation details.
- Avoid vague wording; use explicit verbs like `add`, `change`, `fix`, and `control`.
- Always document operational impact and important cautions.
- Avoid the word `forbidden`; use `controlled`, `limited`, or `not available`.

Category usage:

- New Feature: background -> what is now possible
- Improvement: concrete UI/interaction change -> background -> what is now possible
- Accessibility: what was added and where
- Bug Fix: specific bug, specific screen, specific behavior fixed
- Deprecation: what is no longer available and why
- Other: concrete changes that do not fit above categories

Heading/body writing rules:

- Title format: `YYYY/MM/DD + summary + count` (no period)
- Heading: concise, around 20 characters, no period
- Body order: `1. facts 2. background 3. user impact`
- For Bug Fix category, omit heading when needed and use bullet points for multiple fixes

## Project Conventions

- Keep native dependencies in `apps/mobile/package.json` to ensure autolinking.
- Use one dependency version across the monorepo.
- Import UI primitives through `apps/mobile/src/design-system` to isolate framework/package changes.

# Process Setup

## Purpose

This project will follow a structured software engineering process before coding.
The goal is to turn the existing fund-raising workflow into a clear, testable,
mobile-first web application plan.

## Working Modes

- Communication: concise by default to save tokens.
- Scope control: use `ponytail lite` during planning to challenge unnecessary scope.
- Implementation: use `ponytail full` when coding starts.
- Spreadsheet access: use Google Sheets only for specific evidence reads, not broad dumps.
- Source of truth: keep decisions in local Markdown artifacts under `docs/ai-native/`.

## Planned Skill Sequence

1. `grill-my-idea`
2. `idea-to-intent`
3. `intent-to-prd`
4. `clarify-prd`
5. `project-constitution`
6. `prd-to-architecture`
7. `architecture-to-issues`
8. `issue-to-prompt`
9. `run-the-loop`
10. `test-the-app`
11. `review-the-code`
12. `demo-ready`

## Supporting Skills And Tools

- `google-drive:google-sheets`: read verified spreadsheet data.
- `traceability-matrix`: connect requirements, issues, tests, and demo evidence.
- `red-team-my-app`: review privacy, financial, and security risks.
- `ui-ux-pro-max`: support mobile-first UX design when the product direction is stable.

## Current Guardrails

- Do not start coding before requirements are clarified.
- Do not edit source spreadsheets unless explicitly requested.
- Treat buyer names, phone numbers, addresses, map links, payment proof, and financial data as sensitive.
- Prioritize mobile workflows over desktop table convenience.
- Use real spreadsheet structure as evidence, but avoid exposing sensitive data in final artifacts unless needed.

## GitHub Working Agreement

- Every completed logical change must be committed before the task handoff. A
  read-only task with no file changes does not require a commit.
- Do not develop directly on `main`. Start each planning unit or implementation
  issue from the latest `main` on a dedicated `agent/<short-description>`
  branch.
- One independently assignable issue belongs to one branch and one primary
  owner/agent. Parallel branches are allowed only when their scope and file
  ownership do not conflict and their dependencies are explicit.
- Stage only files that belong to the change. Existing unrelated user changes
  must not be included silently.
- Run the relevant checks before committing. Push the branch and open a draft
  pull request for owner review; merge only after applicable constitution
  quality gates pass.
- Use concise commits that describe one logical change. Scope changes outside
  the approved MVP require project-owner approval before implementation.

## Next Step

Start `project-constitution` from the approved PRD and resolved clarification
log. Save the reviewed result as `docs/ai-native/14-project-constitution.md`
before starting architecture.

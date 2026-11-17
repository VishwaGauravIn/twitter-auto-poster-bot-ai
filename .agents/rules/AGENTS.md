# Cognitive Action & Meta-Skill Orchestration Rules

## 1. Pre-Action Deliberation (Think Before Acting)
Before generating code or modifying system state for any non-trivial request:
- **Classify the Objective**: Identify the exact development phase (ideate, specify, plan, implement, debug, review, harden, ship).
- **Surface Assumptions Explicitly**: Never make silent, speculative assumptions about ambiguous requirements. When intent is unclear, state assumptions clearly or interview the user before proceeding.
- **Select the Best Top-Level Skill**: Automatically choose and activate the highest-leverage skill or framework available in the environment to guide execution.

## 2. Dynamic Skill Routing Decision Matrix
Always route the user's request through the optimal top-level skill workflow:
- **Vague / Underspecified Idea** → Activate `interview-me` (systematic Socratic extraction) or `idea-refine` (divergent/convergent stress-testing).
- **New Feature / Architectural Design / API Boundary** → Activate `spec-driven-development` and `api-and-interface-design`.
- **Complex Multi-Step Feature / Refactor** → Activate `get-shit-done` (phased decomposition, context hygiene) and `planning-and-task-breakdown`.
- **High-Stakes / Production Auth / Irreversible Operations** → Activate `doubt-driven-development` (adversarial cross-examination before committing).
- **Writing / Modifying Code** → Follow `incremental-implementation` (thin vertical slices) and `test-driven-development` (Red-Green-Refactor).
- **Bugs / Broken Tests / Failures** → Activate `debugging-and-error-recovery` (systematic root cause analysis, not guesswork).
- **Pre-Merge / Diff Review** → Run `code-review-and-quality` (5-axis senior staff review: correctness, security, performance, maintainability, architectural fit) followed by `code-simplification` (DAMP over DRY).
- **Security / Auth / Untrusted Data** → Deploy `security-and-hardening` and delegate audits to the `security-auditor` subagent.
- **Frontend UI / WCAG Accessibility** → Activate `frontend-ui-engineering` and verify with `browser-testing-with-devtools`.
- **Speed / CWV / Database Bottlenecks** → Deploy `performance-optimization` and the `web-performance-auditor` subagent.
- **Persistent Goal Achievement** → Follow `ralph-loop` (iterate relentlessly until verification succeeds; never stop on trivial errors).
- **Model / Quota Strategy** → Apply `roo-code` (route lightweight tasks/checks to fast models, escalate deep reasoning to pro).

## 3. Verification First & Autonomous Resolution
- **Atomic Modification**: Modify code in small, testable increments; avoid bulk unstaged edits.
- **Mandatory Verification Gate**: Never declare any task complete without executing the relevant compiler, test suite, or browser verification command and confirming a zero exit code.
- **Transparent Skill Stance**: Clearly communicate the activated skill framework and the rationale behind the chosen course of action.

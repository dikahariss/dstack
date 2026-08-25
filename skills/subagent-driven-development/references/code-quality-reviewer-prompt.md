# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Agent tool (general-purpose):
  Use the review template from /requesting-code-review

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)
- Did this diff introduce a comment that narrates the code instead of recording a why? Quote each one with its `file:line` — Minor severity, cheap to fix and expensive to leave.
- Does any issue in this review ask for an explanatory comment? Never ask for one — code that needs prose above it to be understood is fixed by a rename, a smaller function, or a test that shows the behavior. Say that instead.

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment

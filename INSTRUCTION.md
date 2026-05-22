# AIASM — AI Agent Skills Manager

## Overview
AIASM is a skill manager that lets you discover and install new skills at runtime. Use it when a task requires a capability you don't currently have a skill for.

---

## When to Use AIASM

Before attempting a complex or unfamiliar task, check if a relevant skill exists. Specifically:
- If no loaded skill covers the user's request
- If you are unsure how to handle a file type, API, or domain-specific task
- If a task fails and a skill might provide better guidance

---

## Commands

### 1. Search for a skill
```bash
npx aiasm search "<keyword>"
```
- Returns up to 10 matching skills with `name`, `description`, and `source`
- Use a short, specific keyword (e.g. `"excel"`, `"web scraping"`, `"stripe api"`)
- If the first search returns nothing useful, retry with a different keyword before giving up

### 2. Install a skill
```bash
npx aiasm install <name> <source>
```
- Installs the skill locally and makes it immediately available
- Use the exact `name` and `source` values returned from the search result
- After installation, use skill tool to read the skill's `.md` file before proceeding with the task

---

## Workflow

Follow this sequence every time:

1. **SEARCH** — `npx aiasm search "<keyword>"`
2. **EVALUATE** — Read the name and description of results; pick the best match
3. **INSTALL** — `npx aiasm install <name> <source>`
4. **READ** — View the installed skill's `.md` file
5. **EXECUTE** — Follow the skill's instructions to complete the task

---

## Rules

- **Always search before concluding a skill doesn't exist.** Don't assume — query first.
- **Never install a skill without reading its description first.** Verify it matches the task.
- **After installing, always read the full skill `.md` before writing any code or creating files.** Skills encode environment-specific constraints you won't find in training data.
- **Prefer a specific keyword over a vague one.** `"pdf merge"` is better than `"file"`.
- **If multiple skills look relevant**, install the most specific one first. Fall back to broader ones only if it doesn't cover the task.
- **Do not re-install a skill** that is already available in the current session.

---

## Fallback — When No Skill Is Found

If search returns no useful results:
1. Retry with a shorter or more generic keyword
2. Try a synonym (e.g. `"spreadsheet"` instead of `"excel"`)
3. If still nothing, proceed with your best general knowledge and notify the user that no matching skill was found

---

## Example

**User request:** "Merge these two Excel files into one"

```bash
# Step 1: Search
npx aiasm search "xlsx merge"

# Step 2: Review results, pick best match
# → name: xlsx-merge, source: aiasm/xlsx-merge

# Step 3: Install
npx aiasm install xlsx-merge aiasm/xlsx-merge

# Step 4: Use skill tools to read the .md file and understand how to use it

# Step 5: Follow its instructions to complete the task
```

---

## Key Principle

Skill descriptions are routing triggers — they tell you *whether* to use a skill.
The installed `.md` file is the authoritative guide — it tells you *how* to use it.
Always read the `.md` before executing.

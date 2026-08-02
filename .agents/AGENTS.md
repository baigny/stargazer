# Git Branching & Automated Pull Request Workflow

All autonomous developer agents working on this repository must strictly adhere to the following git workflow:

## 1. Do NOT Push Directly to Protected Branches
- You are strictly forbidden from committing or pushing directly to `main` or any other protected branch.

## 2. Work on Feature Branches
- Before making any code changes, create and check out a dedicated branch named:
  `wt/t_<task_id>_fix` (replace `<task_id>` with the current Kanban task ID you are working on).
- Implement, test, and commit all your changes on this feature branch.

## 3. Push and Submit a Pull Request
- Push your feature branch to the remote origin.
- Once pushed, use the GitHub REST API to automatically create a Pull Request from your branch to `main`.
- You can perform this using `curl` and the authenticated `GITHUB_TOKEN` environment variable:
  ```bash
  curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/nicolasnkGH/stargazer/pulls \
    -d "{\"title\":\"Fix: Resolve Kanban Task <task_id>\",\"head\":\"wt/t_<task_id>_fix\",\"base\":\"main\",\"body\":\"This PR resolves task <task_id>. Please review and merge.\"}"
  ```
- Post the link of the created Pull Request as a comment on the Kanban card, and then call `kanban_complete`.

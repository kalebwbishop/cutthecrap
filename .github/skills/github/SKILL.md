---
name: github
description: >
  Reference for using the GitHub CLI (gh) to manage repositories, pull requests,
  issues, releases, Actions workflows, secrets, and the GitHub API from the terminal.
  Use for topics related to gh, github cli, pull request, issue, workflow, release,
  gist, gh api, gh pr, gh issue, gh run, gh repo.
---

# GitHub CLI (`gh`) Skill

> Reference for using the GitHub CLI to manage repositories, pull requests, issues, releases, Actions workflows, and more — directly from the terminal.
> Full manual: https://cli.github.com/manual/

## Authentication

```bash
gh auth login                    # Interactive login (browser or token)
gh auth login --hostname HOST    # GitHub Enterprise
gh auth status                   # Show current auth state
gh auth switch                   # Switch between accounts
gh auth token                    # Print current token
gh auth logout                   # Log out
gh auth refresh                  # Refresh stored credentials
gh auth setup-git                # Configure git to use gh as credential helper
```

Environment variables: `GITHUB_TOKEN`, `GH_TOKEN`, `GH_ENTERPRISE_TOKEN`, `GH_HOST`.

---

## Repositories

```bash
gh repo create                           # Interactive create
gh repo create my-app --public --clone   # Create and clone
gh repo clone OWNER/REPO                 # Clone a repo
gh repo fork OWNER/REPO                  # Fork (auto-creates remote)
gh repo view                             # View current repo info
gh repo view OWNER/REPO --web           # Open in browser
gh repo list OWNER                       # List repos for user/org
gh repo edit --visibility public         # Edit repo settings
gh repo sync                             # Sync fork with upstream
gh repo rename NEW-NAME                  # Rename current repo
gh repo archive OWNER/REPO              # Archive a repo
gh repo unarchive OWNER/REPO            # Unarchive
gh repo delete OWNER/REPO --yes         # Delete (requires confirmation)
gh repo set-default OWNER/REPO          # Set default repo for gh commands
```

---

## Pull Requests

```bash
# Create
gh pr create                             # Interactive
gh pr create --fill                      # Auto-fill from commits
gh pr create --title "T" --body "B"      # With flags
gh pr create --draft                     # Draft PR
gh pr create --base main --head feature  # Specify branches
gh pr create --web                       # Open creation page in browser

# List & status
gh pr list                               # Open PRs (default 30)
gh pr list --state closed --assignee me  # Filter by state/assignee
gh pr list --label bug --limit 50        # Filter by label
gh pr status                             # PRs relevant to you

# View & diff
gh pr view 123                           # View PR details
gh pr view 123 --web                     # Open in browser
gh pr view                               # View PR for current branch
gh pr diff 123                           # Show PR diff

# Checkout & review
gh pr checkout 123                       # Check out PR branch locally
gh pr checks 123                         # View CI check status
gh pr review 123 --approve               # Approve
gh pr review 123 --request-changes -b "Fix X"  # Request changes
gh pr review 123 --comment -b "LGTM"    # Comment review

# Merge & manage
gh pr merge 123                          # Interactive merge
gh pr merge 123 --squash --delete-branch # Squash merge + delete branch
gh pr merge 123 --rebase                 # Rebase merge
gh pr merge 123 --auto                   # Enable auto-merge
gh pr close 123                          # Close without merging
gh pr reopen 123                         # Reopen closed PR
gh pr ready 123                          # Mark as ready for review
gh pr edit 123 --title "New title"       # Edit PR metadata
gh pr update-branch 123                  # Update branch from base
gh pr lock 123                           # Lock conversation
gh pr revert 123                         # Create a revert PR
```

---

## Issues

```bash
# Create
gh issue create                              # Interactive
gh issue create --title "T" --body "B"       # With flags
gh issue create --label bug,urgent           # With labels
gh issue create --assignee @me               # Assign to self
gh issue create --web                        # Open in browser

# List & status
gh issue list                                # Open issues (default 30)
gh issue list --state closed --label bug     # Filter
gh issue list --assignee me --milestone v2   # By assignee/milestone
gh issue status                              # Issues relevant to you

# View & manage
gh issue view 42                             # View issue
gh issue view 42 --web                       # Open in browser
gh issue comment 42 --body "Note"            # Add comment
gh issue edit 42 --add-label enhancement     # Edit labels
gh issue close 42                            # Close
gh issue reopen 42                           # Reopen
gh issue delete 42                           # Delete
gh issue pin 42                              # Pin issue
gh issue unpin 42                            # Unpin
gh issue lock 42                             # Lock conversation
gh issue transfer 42 OWNER/OTHER-REPO       # Transfer to another repo
gh issue develop 42 --checkout               # Create branch for issue
```

---

## GitHub Actions — Workflows & Runs

```bash
# Workflows
gh workflow list                         # List workflows
gh workflow view ci.yml                  # View workflow details
gh workflow run ci.yml                   # Manually trigger workflow
gh workflow run ci.yml -f key=value      # Trigger with inputs
gh workflow enable ci.yml                # Enable disabled workflow
gh workflow disable ci.yml               # Disable workflow

# Runs
gh run list                              # Recent workflow runs
gh run list --workflow ci.yml            # Runs for specific workflow
gh run list --branch main --status failure  # Filter by branch/status
gh run view 12345                        # View run details
gh run view 12345 --log                  # View full logs
gh run view 12345 --log-failed           # View only failed step logs
gh run watch 12345                       # Live-watch a run
gh run rerun 12345                       # Re-run entire workflow
gh run rerun 12345 --failed              # Re-run only failed jobs
gh run cancel 12345                      # Cancel in-progress run
gh run download 12345                    # Download run artifacts
gh run delete 12345                      # Delete a run

# Actions cache
gh cache list                            # List caches
gh cache delete KEY                      # Delete a cache entry
```

---

## Releases

```bash
gh release create v1.0.0                        # Create release (interactive)
gh release create v1.0.0 --generate-notes       # Auto-generate release notes
gh release create v1.0.0 --draft --prerelease   # Draft pre-release
gh release create v1.0.0 ./dist/*.tar.gz        # Upload assets
gh release list                                  # List releases
gh release view v1.0.0                           # View release details
gh release download v1.0.0                       # Download all assets
gh release download v1.0.0 -p "*.tar.gz"        # Download by pattern
gh release edit v1.0.0 --draft=false             # Publish a draft
gh release delete v1.0.0 --yes                   # Delete release
gh release upload v1.0.0 ./file.zip              # Upload asset to existing release
```

---

## Gists

```bash
gh gist create file.txt                  # Create public gist
gh gist create --public file.txt         # Explicit public
gh gist create -d "Description" f.py     # With description
gh gist list                             # List your gists
gh gist view GIST_ID                     # View gist content
gh gist edit GIST_ID                     # Edit gist
gh gist clone GIST_ID                    # Clone gist locally
gh gist delete GIST_ID                   # Delete gist
```

---

## Search

```bash
gh search repos "machine learning" --language python --stars ">1000"
gh search issues "bug" --repo OWNER/REPO --state open
gh search prs "fix" --author me --state merged
gh search commits "refactor" --repo OWNER/REPO
gh search code "handleAuth" --repo OWNER/REPO --language typescript
```

> **PowerShell note:** Use `--% --` before queries containing `-` to avoid flag parsing:
> `gh --% search issues -- "my query -label:bug"`

---

## GitHub API (Direct)

```bash
# REST
gh api repos/{owner}/{repo}/releases                    # GET (default)
gh api repos/{owner}/{repo}/issues/1/comments -f body="Hi"  # POST with fields
gh api -X PATCH repos/{owner}/{repo} -f name="new-name"     # PATCH
gh api repos/{owner}/{repo}/issues --jq '.[].title'         # jq filtering
gh api repos/{owner}/{repo}/issues --paginate               # Auto-paginate

# GraphQL
gh api graphql -f query='{ viewer { login } }'
gh api graphql -F owner='{owner}' -F name='{repo}' -f query='
  query($name: String!, $owner: String!) {
    repository(owner: $owner, name: $name) {
      releases(last: 3) { nodes { tagName } }
    }
  }
'
```

Placeholders `{owner}`, `{repo}`, `{branch}` auto-resolve from current directory.

---

## Projects (v2)

```bash
gh project list                          # List projects
gh project view 1                        # View project details
gh project create --title "Sprint 5"     # Create project
gh project item-list 1                   # List items in project
gh project item-add 1 --url ISSUE_URL    # Add issue/PR to project
gh project item-create 1 --title "Task"  # Create draft item
gh project field-list 1                  # List custom fields
gh project edit 1 --title "New name"     # Edit project
gh project close 1                       # Close project
gh project delete 1                      # Delete project
```

---

## Labels

```bash
gh label list                            # List repo labels
gh label create "priority:high" --color FF0000 --description "Urgent"
gh label edit "bug" --name "defect"      # Rename label
gh label delete "wontfix" --yes          # Delete label
gh label clone SOURCE-OWNER/SOURCE-REPO  # Clone labels from another repo
```

---

## Secrets & Variables

```bash
# Secrets
gh secret set MY_SECRET                  # Set (prompts for value)
gh secret set MY_SECRET < file.txt       # Set from file
gh secret set MY_SECRET --env production # Environment secret
gh secret list                           # List secrets
gh secret delete MY_SECRET               # Delete

# Variables
gh variable set MY_VAR --body "value"
gh variable get MY_VAR
gh variable list
gh variable delete MY_VAR
```

---

## SSH & GPG Keys

```bash
gh ssh-key list                          # List SSH keys
gh ssh-key add ~/.ssh/id_ed25519.pub     # Add SSH key
gh ssh-key delete KEY_ID                 # Delete SSH key
gh gpg-key list                          # List GPG keys
gh gpg-key add public.gpg               # Add GPG key
gh gpg-key delete KEY_ID                 # Delete GPG key
```

---

## Aliases & Extensions

```bash
# Aliases
gh alias set pv 'pr view'               # Create alias
gh alias list                            # List aliases
gh alias delete pv                       # Delete alias

# Extensions
gh extension search QUERY                # Search extensions
gh extension install OWNER/gh-EXTENSION  # Install extension
gh extension list                        # List installed
gh extension upgrade --all               # Upgrade all
gh extension remove gh-EXTENSION         # Remove extension
```

---

## Configuration

```bash
gh config set editor vim                 # Set preferred editor
gh config set git_protocol ssh           # Use SSH for git operations
gh config get editor                     # Read a setting
gh config list                           # List all settings
gh config clear-cache                    # Clear API cache
```

---

## Useful Patterns

```bash
# Open current repo in browser
gh browse

# Open a specific file in browser
gh browse src/main.ts

# View cross-repo notifications & mentions
gh status

# Target a different repo without cd-ing
gh pr list -R OWNER/REPO

# JSON output for scripting
gh pr list --json number,title,author --jq '.[] | "\(.number): \(.title)"'

# Create PR and immediately request review
gh pr create --fill --reviewer user1,user2

# Squash-merge current branch PR and clean up
gh pr merge --squash --delete-branch

# Watch CI and auto-merge when green
gh pr merge --auto --squash && gh run watch
```

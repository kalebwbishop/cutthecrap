---
name: playwright-cli
description: Automates browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, or extract information from web pages.
allowed-tools: Bash(npx playwright-cli:*), PowerShell(npx playwright-cli:*)
---

# Browser Automation with playwright-cli

## Quick start

```bash
# open new browser
npx playwright-cli open
# navigate to a page
npx playwright-cli goto https://playwright.dev
# interact with the page using refs from the snapshot
npx playwright-cli click e15
npx playwright-cli type "page.click"
npx playwright-cli press Enter
# take a screenshot (rarely used, as snapshot is more common)
npx playwright-cli screenshot
# close the browser
npx playwright-cli close
```

## Commands

### Core

```bash
npx playwright-cli open
# open and navigate right away
npx playwright-cli open https://example.com/
npx playwright-cli goto https://playwright.dev
npx playwright-cli type "search query"
npx playwright-cli click e3
npx playwright-cli dblclick e7
npx playwright-cli fill e5 "user@example.com"
npx playwright-cli drag e2 e8
npx playwright-cli hover e4
npx playwright-cli select e9 "option-value"
npx playwright-cli upload ./document.pdf
npx playwright-cli check e12
npx playwright-cli uncheck e12
npx playwright-cli snapshot
npx playwright-cli snapshot --filename=after-click.yaml
npx playwright-cli eval "document.title"
npx playwright-cli eval "el => el.textContent" e5
npx playwright-cli dialog-accept
npx playwright-cli dialog-accept "confirmation text"
npx playwright-cli dialog-dismiss
npx playwright-cli resize 1920 1080
npx playwright-cli close
```

### Navigation

```bash
npx playwright-cli go-back
npx playwright-cli go-forward
npx playwright-cli reload
```

### Keyboard

```bash
npx playwright-cli press Enter
npx playwright-cli press ArrowDown
npx playwright-cli keydown Shift
npx playwright-cli keyup Shift
```

### Mouse

```bash
npx playwright-cli mousemove 150 300
npx playwright-cli mousedown
npx playwright-cli mousedown right
npx playwright-cli mouseup
npx playwright-cli mouseup right
npx playwright-cli mousewheel 0 100
```

### Save as

```bash
npx playwright-cli screenshot
npx playwright-cli screenshot e5
npx playwright-cli screenshot --filename=page.png
npx playwright-cli pdf --filename=page.pdf
```

### Tabs

```bash
npx playwright-cli tab-list
npx playwright-cli tab-new
npx playwright-cli tab-new https://example.com/page
npx playwright-cli tab-close
npx playwright-cli tab-close 2
npx playwright-cli tab-select 0
```

### Storage

```bash
npx playwright-cli state-save
npx playwright-cli state-save auth.json
npx playwright-cli state-load auth.json

# Cookies
npx playwright-cli cookie-list
npx playwright-cli cookie-list --domain=example.com
npx playwright-cli cookie-get session_id
npx playwright-cli cookie-set session_id abc123
npx playwright-cli cookie-set session_id abc123 --domain=example.com --httpOnly --secure
npx playwright-cli cookie-delete session_id
npx playwright-cli cookie-clear

# LocalStorage
npx playwright-cli localstorage-list
npx playwright-cli localstorage-get theme
npx playwright-cli localstorage-set theme dark
npx playwright-cli localstorage-delete theme
npx playwright-cli localstorage-clear

# SessionStorage
npx playwright-cli sessionstorage-list
npx playwright-cli sessionstorage-get step
npx playwright-cli sessionstorage-set step 3
npx playwright-cli sessionstorage-delete step
npx playwright-cli sessionstorage-clear
```

### Network

```bash
npx playwright-cli route "**/*.jpg" --status=404
npx playwright-cli route "https://api.example.com/**" --body='{"mock": true}'
npx playwright-cli route-list
npx playwright-cli unroute "**/*.jpg"
npx playwright-cli unroute
```

### DevTools

```bash
npx playwright-cli console
npx playwright-cli console warning
npx playwright-cli network
npx playwright-cli run-code "async page => await page.context().grantPermissions(['geolocation'])"
npx playwright-cli tracing-start
npx playwright-cli tracing-stop
npx playwright-cli video-start
npx playwright-cli video-stop video.webm
```

## Open parameters

```bash
# Use specific browser when creating session
npx playwright-cli open --browser=chrome
npx playwright-cli open --browser=firefox
npx playwright-cli open --browser=webkit
npx playwright-cli open --browser=msedge
# Connect to browser via extension
npx playwright-cli open --extension

# Use persistent profile (by default profile is in-memory)
npx playwright-cli open --persistent
# Use persistent profile with custom directory
npx playwright-cli open --profile=/path/to/profile

# Start with config file
npx playwright-cli open --config=my-config.json

# Close the browser
npx playwright-cli close
# Delete user data for the default session
npx playwright-cli delete-data
```

## Snapshots

After each command, playwright-cli provides a snapshot of the current browser state.

```bash
> npx playwright-cli goto https://example.com
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.playwright-cli/page-2026-02-14T19-22-42-679Z.yml)
```

You can also take a snapshot on demand using `npx playwright-cli snapshot` command.

If `--filename` is not provided, a new snapshot file is created with a timestamp. Default to automatic file naming, use `--filename=` when artifact is a part of the workflow result.

## Browser Sessions

```bash
# create new browser session named "mysession" with persistent profile
npx playwright-cli -s=mysession open example.com --persistent
# same with manually specified profile directory (use when requested explicitly)
npx playwright-cli -s=mysession open example.com --profile=/path/to/profile
npx playwright-cli -s=mysession click e6
npx playwright-cli -s=mysession close  # stop a named browser
npx playwright-cli -s=mysession delete-data  # delete user data for persistent session

npx playwright-cli list
# Close all browsers
npx playwright-cli close-all
# Forcefully kill all browser processes
npx playwright-cli kill-all
```

## Example: Form submission

```bash
npx playwright-cli open https://example.com/form
npx playwright-cli snapshot

npx playwright-cli fill e1 "user@example.com"
npx playwright-cli fill e2 "password123"
npx playwright-cli click e3
npx playwright-cli snapshot
npx playwright-cli close
```

## Example: Multi-tab workflow

```bash
npx playwright-cli open https://example.com
npx playwright-cli tab-new https://example.com/other
npx playwright-cli tab-list
npx playwright-cli tab-select 0
npx playwright-cli snapshot
npx playwright-cli close
```

## Example: Debugging with DevTools

```bash
npx playwright-cli open https://example.com
npx playwright-cli click e4
npx playwright-cli fill e7 "test"
npx playwright-cli console
npx playwright-cli network
npx playwright-cli close
```

```bash
npx playwright-cli open https://example.com
npx playwright-cli tracing-start
npx playwright-cli click e4
npx playwright-cli fill e7 "test"
npx playwright-cli tracing-stop
npx playwright-cli close
```
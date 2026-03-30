---
name: mailinator
description: >
  Interact with Mailinator disposable email service for email testing and automation.
  Use for topics related to mailinator, disposable email, inbox, email testing, verification email,
  extract links, smtp log, email automation, mcp server, check inbox, test email delivery.
---

# Mailinator CLI & MCP Server

> Node.js tool for CLI and AI-integrated access to Mailinator's disposable email service.
> Enables automated email testing, workflow verification, and email content extraction.
> Repository: https://github.com/manybrain/mailinator-cli

## What is Mailinator?

Mailinator is a free, public, disposable email service. Every email address at @mailinator.com automatically exists — no signup required. Choose any inbox name (up to 50 characters) and receive emails instantly. Perfect for testing, automation, and workflows requiring temporary email addresses.

## Installation

```bash
# Global installation
npm install -g mailinator-cli

# Or use with npx (no install)
npx mailinator-cli inbox test public
```

## CLI Commands

**List Inbox:**
```bash
# Public domain (no authentication)
mailinator-cli inbox testuser public

# Private domain (requires API token)
mailinator-cli inbox myinbox private

# Wildcard search (requires API token)
mailinator-cli inbox test* private
```

**Retrieve Email:**
```bash
# By reference number (from inbox listing)
mailinator-cli email 1

# With specific format
mailinator-cli email 1 summary
mailinator-cli email 1 links
mailinator-cli email 2 smtplog

# By message ID directly
mailinator-cli email testuser-1234567890-abc text
```

**Verbose Mode:**
```bash
mailinator-cli --verbose inbox testuser public
mailinator-cli -v email 1 full
```

## Email Formats

When retrieving an email, use the `format` parameter:

| Format | Description |
|---|---|
| `summary` | Key fields only (from, to, subject, time, ID) |
| `text` | Formatted text with headers (default) |
| `textplain` | Plain text body only |
| `texthtml` | HTML body only |
| `full` | Complete email as JSON |
| `raw` | Raw MIME content |
| `headers` | SMTP headers as structured data |
| `smtplog` | Delivery timeline with SMTP transaction log |
| `links` | Array of URLs found in email |
| `linksfull` | URLs with anchor text |

## MCP Server

### Starting the Server

```bash
# Default (127.0.0.1:8080)
mailinator-cli --start-mcp-server

# Custom host/port
mailinator-cli --start-mcp-server --host=0.0.0.0 --port=3000

# With API token for private domains
export MAILINATOR_API_KEY=your_token_here
mailinator-cli --start-mcp-server
```

**Health Check:** `GET http://127.0.0.1:8080/health`

### MCP Tools

#### `list_inbox`

Lists all emails in a Mailinator inbox.

**Parameters:**
- `inbox_name` (required): Inbox to query (max 50 chars, alphanumeric with dots). Supports wildcards: `*` or `prefix*` with API token.
- `domain` (optional): `"public"`, `"private"`, or custom domain (auto-detected if omitted).

**Returns:**
```json
{
  "inbox_name": "testuser",
  "domain": "public",
  "messages": [
    {
      "number": 1,
      "id": "testuser-1234567890-abc",
      "from": "noreply@example.com",
      "subject": "Welcome!",
      "time": 1770915725000,
      "seconds_ago": 120
    }
  ],
  "count": 1
}
```

#### `get_email`

Retrieves a specific email with optional formatting.

**Parameters:**
- `message_id` (required): Message ID from `list_inbox` results.
- `domain` (optional): Domain (auto-detected from cache if omitted).
- `format` (optional): Output format (default: `"text"`). See Email Formats table above.

### MCP Resources

Read-only URI-based access:

- `mailinator://inbox/{domain}/{inbox_name}` — Inbox listing
- `mailinator://email/{domain}/{message_id}` — Email content

### Claude Desktop Configuration

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mailinator": {
      "command": "node",
      "args": ["/path/to/mailinator-cli/bin/index.js", "--start-mcp-server"],
      "env": {
        "MAILINATOR_API_KEY": "your_token_here"
      }
    }
  }
}
```

Or connect to a running server:

```json
{
  "mcpServers": {
    "mailinator": {
      "url": "http://127.0.0.1:8080/mcp"
    }
  }
}
```

## Authentication

Public domain (@mailinator.com) requires **no authentication**. For private/custom domains and advanced features (wildcards, SMTP logs), configure an API token.

**Get Token:** https://www.mailinator.com/v4/private/team_settings.jsp

**Configuration (in priority order):**

1. **Environment Variable:**
   ```bash
   export MAILINATOR_API_KEY=your_token_here
   ```

2. **Config File** (`~/.config/mailinator/config.json`):
   ```json
   { "apiKey": "your_token_here" }
   ```

3. **Environment File** (`.env`):
   ```
   MAILINATOR_API_KEY=your_token_here
   ```

## Validation Rules

- **Inbox Names:** Max 50 chars, alphanumeric + dots, no leading/trailing dots
- **Wildcards:** Only `*` or `prefix*`, only in private domains, requires API token
- **Domains:** `"public"`, `"private"`, or valid custom domain names

## Error Handling

- **Exit 0:** Success or non-fatal config warning
- **Exit 1:** Validation error (invalid input)
- **Exit 2:** API error (authentication, network, server)
- **Exit 3:** Cache error (run inbox command first)

## Caching

- Inbox results stored at `~/.config/mailinator/inbox-cache.json`
- After listing an inbox, retrieve emails by number (1, 2, 3…)
- Domain auto-detected for cached emails
- Cache persists across CLI invocations until next inbox query

## Requirements

- **Runtime:** Node.js ≥ 18.0.0
- **Internet Access:** Required for Mailinator API
- **API Token:** Optional (required for private domains and wildcards)

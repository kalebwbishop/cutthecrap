# Multi-Environment Setup Guide

This app supports three environments on a single VM:

| Branch | Domain | Compose Project | Deploy Path |
|--------|--------|-----------------|-------------|
| `main` | `cutthecrap.deploy-box.com` | `cutthecrap` | `/opt/cutthecrap` |
| `dev` | `ctc-dev.deploy-box.com` | `cutthecrap-dev` | `/opt/cutthecrap-dev` |
| `test` | `ctc-test.deploy-box.com` | `cutthecrap-test` | `/opt/cutthecrap-test` |

## Prerequisites

### 1. GitHub Environments

Create three GitHub environments in **Settings → Environments**:

- **`main`** (may already exist)
- **`dev`** (may already exist)
- **`test`** ← new

Each environment needs these **variables**:

| Variable | Description |
|----------|-------------|
| `AZURE_CLIENT_ID` | OIDC service principal app (client) ID |
| `AZURE_TENANT_ID` | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |

> The `dev` and `test` environments can share the same OIDC credentials if they use the same Azure subscription. `main` may use different credentials for production isolation.

### 2. Azure Key Vault Secrets

All environments share the same Key Vault (`kv-kalebwbishop-apps`). The following secrets must exist with the `ctc-` prefix:

| Secret | Description |
|--------|-------------|
| `ctc-domain-name` | Base domain: `cutthecrap.deploy-box.com` |
| `ctc-acr-login-server` | ACR registry hostname |
| `ctc-acr-username` | ACR push/pull username |
| `ctc-acr-password` | ACR push/pull password |
| `ctc-workos-api-key` | WorkOS API key |
| `ctc-workos-client-id` | WorkOS client ID |
| `ctc-deploy-box-client-id` | Deploy Box OAuth client ID |
| `ctc-deploy-box-client-secret` | Deploy Box OAuth client secret |
| `ctc-chatgpt-api-base` | Azure Function proxy base URL |
| `ctc-tls-fullchain` | TLS certificate (base64-encoded) |
| `ctc-tls-privkey` | TLS private key (base64-encoded) |

The domain for each environment is computed automatically from the branch name:
- `main` → `cutthecrap.deploy-box.com`
- `dev` → `ctc-dev.deploy-box.com`
- `test` → `ctc-test.deploy-box.com`

### 3. WorkOS Configuration

Add the following redirect URIs in the [WorkOS Dashboard](https://dashboard.workos.com):

- `https://cutthecrap.deploy-box.com/api/v1/auth/callback`
- `https://ctc-dev.deploy-box.com/api/v1/auth/callback`
- `https://ctc-test.deploy-box.com/api/v1/auth/callback`

### 4. DNS

Ensure these DNS records exist (A or CNAME pointing to the VM):

- `cutthecrap.deploy-box.com`
- `ctc-dev.deploy-box.com`
- `ctc-test.deploy-box.com`

> If using the wildcard cert (`*.deploy-box.com`), a wildcard DNS record covers all subdomains.

### 5. Proxy Nginx

Copy `nginx/proxy-cutthecrap.conf` into the shared proxy-nginx configuration directory and reload:

```bash
docker exec proxy-nginx nginx -s reload
```

This adds three `server` blocks routing each subdomain to the correct Docker network aliases.

### 6. TLS Certificate

The existing wildcard certificate (`*.deploy-box.com`) already covers all subdomains. No additional cert work is needed.

## How It Works

Each environment runs as a separate Docker Compose project on the shared `proxy-net` network:

```
proxy-nginx (shared)
├── cutthecrap.deploy-box.com      → ctc-backend / ctc-frontend
├── ctc-dev.deploy-box.com          → ctc-dev-backend / ctc-dev-frontend
└── ctc-test.deploy-box.com         → ctc-test-backend / ctc-test-frontend
```

Each compose project has its own:
- **Postgres database** (isolated volume per project)
- **Backend container** (with env-specific CORS, domain, DB connection)
- **Frontend container** (built with env-specific `EXPO_PUBLIC_API_BASE`)

## Deploying

Push to the corresponding branch to trigger deployment:

```bash
git push origin dev     # deploys to ctc-dev.deploy-box.com
git push origin test    # deploys to ctc-test.deploy-box.com
git push origin main    # deploys to cutthecrap.deploy-box.com
```

The CD pipeline automatically:
1. Builds images with env-specific frontend config
2. Tags images with `dev-latest`, `test-latest`, or `latest`
3. Deploys to the correct path with isolated compose project
4. Runs database migrations against the correct database

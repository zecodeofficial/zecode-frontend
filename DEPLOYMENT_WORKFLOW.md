# Deployment Workflow

## Branch Structure

| Branch | URL | Purpose |
|--------|-----|---------|
| `beta` | `zecode-frontend-beta.vercel.app` | Staging/Testing |
| `main` | `zecode-frontend.vercel.app` | Production |

## Workflow

### 1. Make Changes on Beta
```bash
git checkout beta
# Make your changes
git add .
git commit -m "your message"
git push origin beta
```

### 2. Test on Beta Site
- Wait for Vercel deployment (1-2 minutes)
- Visit: https://zecode-frontend-git-beta-zecodeofficial.vercel.app
- Or the alias you set up in Vercel Dashboard

### 3. Promote to Production
Once tested, merge beta to main:
```bash
git checkout main
git merge beta
git push origin main
```

## Vercel Dashboard Setup (One-time)

To get a clean beta URL like `beta.zecode-frontend.vercel.app`:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select **zecode-frontend** project
3. Go to **Settings** → **Domains**
4. Add domain: `zecode-frontend-beta.vercel.app` 
5. Set **Git Branch**: `beta`

Or use the auto-generated URL for beta branch:
`https://zecode-frontend-git-beta-zecodeofficial.vercel.app`

## Quick Commands

### Switch to beta for development:
```bash
git checkout beta
```

### Switch to main:
```bash
git checkout main
```

### Sync beta with main (after hotfixes to main):
```bash
git checkout beta
git merge main
git push origin beta
```

### Check current branch:
```bash
git branch
```

## Current URLs

- **Production**: https://zecode-frontend.vercel.app
- **Beta**: https://zecode-frontend-git-beta-zecodeofficial.vercel.app

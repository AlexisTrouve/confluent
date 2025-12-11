# Security Policy

## Sensitive Information

**IMPORTANT**: This repository contains code that requires API keys from third-party services (Anthropic, OpenAI).

### Environment Variables

**NEVER commit the `.env` file to version control.**

The `.env` file contains sensitive credentials:
- `ANTHROPIC_API_KEY` - Your Anthropic Claude API key
- `OPENAI_API_KEY` - Your OpenAI GPT API key

These keys provide access to paid services and **must remain private**.

### Setup Instructions

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual API keys:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

3. Verify `.env` is in `.gitignore`:
   ```bash
   cat .gitignore | grep .env
   # Should show: .env
   ```

### If You Accidentally Committed API Keys

If you accidentally committed a file containing API keys:

1. **Immediately revoke** the exposed keys:
   - Anthropic: https://console.anthropic.com/settings/keys
   - OpenAI: https://platform.openai.com/api-keys

2. Generate new API keys from the respective platforms

3. Update your `.env` file with the new keys

4. Remove the sensitive file from Git history:
   ```bash
   # Remove file from history (dangerous - use with caution)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (only if repository is private or you're sure)
   git push origin --force --all
   ```

### Best Practices

- **Never** hardcode API keys in source code
- **Never** commit `.env` files
- Use `.env.example` as a template (without real keys)
- Rotate API keys regularly
- Use separate keys for development and production
- Monitor API usage for unexpected activity

## Reporting Security Issues

If you discover a security vulnerability in this project, please email the maintainer directly rather than opening a public issue.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

## Dependencies

This project uses third-party npm packages. Run `npm audit` regularly to check for known vulnerabilities:

```bash
cd ConfluentTranslator
npm audit
npm audit fix  # Apply automatic fixes if available
```

## API Rate Limits

Be aware of API rate limits and costs:

- **Anthropic Claude**: Pay-per-use (check pricing at https://www.anthropic.com/pricing)
- **OpenAI GPT**: Pay-per-use (check pricing at https://openai.com/pricing)

Monitor your usage to avoid unexpected bills.

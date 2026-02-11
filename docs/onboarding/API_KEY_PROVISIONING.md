# API Key Provisioning Guide

This guide walks through obtaining and configuring an Anthropic API key for your Knowledge Commons agent.

---

## Why You Need an API Key

Your Knowledge Commons agent uses Claude (by Anthropic) to understand and respond to questions about your vault content. The API key authenticates your agent and tracks usage for billing.

**Cost Estimate:** Most small-to-medium nodes use $10-30/month in API costs. High-traffic nodes may use $50-100/month.

---

## Step 1: Create an Anthropic Account

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click **Sign Up**
3. Use your organization email (e.g., `admin@your-community.org`)
4. Verify your email address

> **Tip:** Use an email tied to your organization, not a personal email. This helps with team handoffs later.

---

## Step 2: Add Billing Information

1. Navigate to **Settings > Billing**
2. Click **Add Payment Method**
3. Enter credit card details
4. Set up your billing address

You won't be charged until you start using the API.

---

## Step 3: Set a Spending Limit (Recommended)

To prevent unexpected costs:

1. Go to **Settings > Limits**
2. Set **Monthly Spend Limit** to your budget
   - Suggested starting limits:
     - Small community (< 100 queries/day): **$25/month**
     - Medium community (100-500 queries/day): **$50/month**
     - Large community (500+ queries/day): **$100/month**
3. Optionally set up **Usage Alerts** at 50% and 80% of limit

> **Note:** When you hit your limit, your agent will stop responding until the next billing cycle. Plan accordingly.

---

## Step 4: Create an API Key

1. Navigate to **API Keys** in the left sidebar
2. Click **Create Key**
3. Enter a descriptive name:
   - Format: `[org]-[bioregion]-[environment]`
   - Example: `colorado-water-plateau-prod`
4. Click **Create**
5. **Copy the key immediately** — it won't be shown again!

Store the key securely:
- Use a password manager (1Password, Bitwarden, etc.)
- Never commit the key to a public GitHub repository
- Share keys only through secure channels (not email)

---

## Step 5: Configure Your Agent

### Option A: Managed Hosting (OpenCivics runs your agent)

Send your API key to the OpenCivics team through a secure channel:

1. Use [onetimesecret.com](https://onetimesecret.com) to create a one-time link
2. Send the link to `ops@opencivics.org`
3. We'll configure your agent and delete the key from our records

### Option B: Self-Hosted

Add the key to your environment:

```bash
# .env file (never commit this!)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Or in your Coolify service configuration
Environment Variables:
  ANTHROPIC_API_KEY = sk-ant-your-key-here
```

---

## Step 6: Verify It Works

Test your agent with a simple query:

```bash
curl -X POST https://your-agent.opencivics.org/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What knowledge is in this vault?"}'
```

You should receive a response within 2-5 seconds.

---

## Security Best Practices

### DO:
- ✅ Use a unique API key per environment (dev, staging, prod)
- ✅ Rotate keys every 6-12 months
- ✅ Set spending limits appropriate to your usage
- ✅ Monitor usage weekly during the first month
- ✅ Delete unused keys

### DON'T:
- ❌ Share keys over email or Slack
- ❌ Commit keys to version control
- ❌ Use the same key for multiple applications
- ❌ Give keys to untrusted parties
- ❌ Leave spending limits at "unlimited"

---

## Troubleshooting

### "Invalid API Key" Error

1. Verify the key is copied correctly (starts with `sk-ant-`)
2. Check the key hasn't been deleted in the Anthropic console
3. Ensure there are no extra spaces or newlines

### "Rate Limited" Error

1. Check your monthly limit hasn't been reached
2. Wait 60 seconds and retry
3. Consider upgrading your tier if this happens frequently

### "Insufficient Credits" Error

1. Add a payment method in the billing settings
2. Check for failed payment attempts
3. Contact Anthropic support if issues persist

---

## Rotating Keys

To rotate your API key (recommended every 6-12 months):

1. Create a new key in the Anthropic console
2. Update your agent configuration with the new key
3. Verify the agent works with the new key
4. Delete the old key from the Anthropic console

> **Tip:** Create the new key before deleting the old one to avoid downtime.

---

## Questions?

- **Billing questions:** billing@anthropic.com
- **Technical support:** support@anthropic.com
- **OpenCivics help:** ops@opencivics.org

---

*Guide Version: 1.0 | Last Updated: 2026-02*

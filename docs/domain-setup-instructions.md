# Domain Setup Instructions — squashladder.in → Vercel

> **Goal:** Point the domain `squashladder.in` (purchased on GoDaddy) to the Vercel project `squash-ladder-platform` so the live site is accessible at `https://squashladder.in`.
>
> **Time required:** 5–10 minutes (plus 5–30 min DNS propagation)
> **Prerequisites:** GoDaddy account access, Vercel account access

---

## Current State

- **Domain:** `squashladder.in` (purchased on GoDaddy, registered Sep 16, 2026)
- **Vercel project:** `anuroopquestion7-gmailcoms-projects/squash-ladder-platform`
- **Domain already added to Vercel:** ✅ Yes (via `vercel domains add`)
- **DNS configured:** ❌ No — this is what needs to be done

---

## What Needs to Be Done

### STEP 1: Open GoDaddy Domain Manager

1. Open Chrome browser
2. Go to: https://dcc.godaddy.com/domains/
3. If prompted to log in, use GoDaddy account credentials
4. Find `squashladder.in` in the domains list
5. Click on the domain name to open **DNS Management**

### STEP 2: Change Nameservers to Vercel DNS

1. Scroll down to the **"Nameservers"** section
2. Click the **"Change"** button next to the current nameservers
3. Select **"Enter my own nameservers (advanced)"**
4. Enter the following two nameservers exactly:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Click **"Save"**
6. Confirm any verification prompts (GoDaddy may require 2FA)

### STEP 3: Wait for DNS Propagation

1. DNS propagation typically takes **5–30 minutes**
2. You can check propagation status at: https://www.whatsmydns.net/#NS/squashladder.in
3. When propagation is complete, nameservers should show `ns1.vercel-dns.com` and `ns2.vercel-dns.com` globally

### STEP 4: Verify in Vercel

1. Open a new tab
2. Go to: https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform/settings/domains
3. Look for `squashladder.in` in the domains list
4. Status should change from "Pending" to "Verified" (Vercel auto-detects the DNS change)
5. If it stays pending for more than 30 minutes, click the **"Verify"** button manually

### STEP 5: Deploy the Latest Build

1. Once domain is verified, go back to the terminal
2. Run:
   ```
   cd C:/Users/anuro/CascadeProjects/2026-Sep-Squash-Ladder
   vercel deploy --prod --force
   ```
3. Wait for deployment to complete — URL should now show `squashladder.in`

### STEP 6: Test the Live Site

1. Open a browser tab
2. Go to: https://squashladder.in
3. Verify:
   - Home page loads with city explorer and ladder rankings
   - No SSL certificate errors
   - All 4 cities visible (Calicut, Delhi, Dublin, Secunderabad/Hyderabad)
4. Click into a city → club → verify ladder rankings load

---

## Troubleshooting

### Issue: "Domain not verified" after 30 minutes

**Fix:**
1. Go to https://www.whatsmydns.net/#NS/squashladder.in
2. Check if nameservers show `ns1.vercel-dns.com` and `ns2.vercel-dns.com`
3. If they show GoDaddy's nameservers instead, the change didn't save — redo STEP 2

### Issue: SSL certificate error

**Fix:**
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Click the `...` next to `squashladder.in`
3. Select **"Refresh"** or **"Re-verify"**
4. Wait 5 minutes for SSL to provision

### Issue: www.squashladder.in doesn't work

**Fix:**
1. In Vercel Domains settings, add `www.squashladder.in` as an additional domain
2. Set it to redirect (301) to `squashladder.in`
3. In GoDaddy DNS, add a CNAME record: `www` → `cname.vercel-dns.com`

---

## Final State (When Done)

| Check | Expected Result |
|---|---|
| https://squashladder.in loads | ✅ Home page with city explorer |
| SSL certificate valid | ✅ No browser warnings |
| Vercel domain status | ✅ "Verified" |
| Nameservers | ✅ `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Future deploys auto-update domain | ✅ Yes, no new URLs needed |

---

## Quick Reference

- **GoDaddy domain manager:** https://dcc.godaddy.com/domains/
- **Vercel project settings:** https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform/settings/domains
- **DNS propagation checker:** https://www.whatsmydns.net/#NS/squashladder.in
- **Vercel nameservers:** `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

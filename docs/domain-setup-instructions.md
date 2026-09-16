# Domain Setup Instructions — squashladder.in → Vercel

> **Goal:** Point the domain `squashladder.in` (purchased on Namecheap) to the Vercel project `squash-ladder-platform` so the live site is accessible at `https://squashladder.in`.
>
> **Time required:** 5–10 minutes (plus 5–30 min DNS propagation)
> **Prerequisites:** Namecheap account access (already logged in or credentials available), Vercel account access

---

## Current State

- **Domain:** `squashladder.in` (purchased on Namecheap, registered Sep 16, 2026)
- **Vercel project:** `anuroopquestion7-gmailcoms-projects/squash-ladder-platform`
- **Domain already added to Vercel:** ✅ Yes (via `vercel domains add`)
- **DNS configured:** ❌ No — this is what needs to be done
- **Current production URL (temporary):** https://squash-ladder-platform-l1xt0dazh.vercel.app

---

## What Needs to Be Done

### STEP 1: Open Namecheap Domain List

1. Open Chrome browser
2. Go to: https://ap.www.namecheap.com/domains/domainlist/
3. If prompted to log in, use the Namecheap account credentials
4. Find `squashladder.in` in the domain list
5. Click the **"Manage"** button next to `squashladder.in`

### STEP 2: Change Nameservers to Vercel DNS

1. On the domain management page, look for the **"Nameservers"** section (usually near the top)
2. Current setting is likely "Namecheap BasicDNS" or "Namecheap Web Hosting DNS"
3. Change the dropdown to **"Custom DNS"**
4. Enter the following two nameservers exactly:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
5. Click the **green checkmark / Save** button next to the nameservers field
6. Wait for the confirmation message: "Domain information updated successfully"

### STEP 3: Wait for DNS Propagation

1. DNS propagation typically takes **5–30 minutes**
2. You can check propagation status at: https://www.whatsmydns.net/#A/squashladder.in
3. When propagation is complete, the A record should show `76.76.21.21` globally

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
3. Wait for deployment to complete (should show `squashladder.app` or the `.in` domain)

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
1. Go to https://www.whatsmydns.net/#A/squashladder.in
2. Check if the A record shows `76.76.21.21`
3. If it shows Namecheap's default IPs instead, the nameserver change didn't save — redo STEP 2
4. If it shows a mix of old and new, wait longer (up to 48 hours in rare cases)

### Issue: "Too many redirects" or SSL error

**Fix:**
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Click the `...` next to `squashladder.in`
3. Select **"Refresh"** or **"Re-verify"**
4. If SSL issue persists, ensure `Force HTTPS` is enabled in Vercel settings

### Issue: Old Vercel URL shows instead of domain

**Fix:**
1. Clear browser cache (Ctrl+Shift+Delete → clear cached images and files)
2. Try in an incognito/private window
3. Run `vercel deploy --prod --force` to ensure latest build is deployed

### Issue: www.squashladder.in doesn't work

**Fix:**
1. In Vercel Domains settings, add `www.squashladder.in` as an additional domain
2. Set it to redirect to `squashladder.in` (301 redirect)
3. Or add a CNAME record at Namecheap: `www` → `cname.vercel-dns.com`

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

- **Namecheap domain list:** https://ap.www.namecheap.com/domains/domainlist/
- **Vercel project settings:** https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform/settings/domains
- **DNS propagation checker:** https://www.whatsmydns.net/#A/squashladder.in
- **Vercel nameservers:** `ns1.vercel-dns.com`, `ns2.vercel-dns.com`
- **Fallback A record:** `76.76.21.21`

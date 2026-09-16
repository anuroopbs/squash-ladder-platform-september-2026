# Complete Domain & Deployment Setup — squashladler.in

> **Goal:** Point `squashladder.in` (purchased on **GoDaddy**) to the Vercel project so the site is live at `https://squashladder.in`, and all future deploys auto-update this domain.
>
> **Time:** 5–10 min + 5–30 min DNS propagation
> **Prerequisites:** GoDaddy account access, Vercel account access

---

## Current State

- **Domain:** `squashladder.in` (GoDaddy, registered Sep 16, 2026)
- **Vercel project:** `anuroopquestion7-gmailcoms-projects/squash-ladder-platform`
- **Domain added to Vercel:** ✅ Already done
- **DNS configured:** ❌ Need to do this
- **Old temporary URL:** https://squash-ladder-platform-l1xt0dazh.vercel.app

---

## STEP 1: Open GoDaddy Domain Manager

1. Open Chrome browser
2. Go to: https://dcc.godaddy.com/domains/
3. If prompted, log in with GoDaddy credentials
4. Find `squashladder.in` in the list
5. Click on the domain name to open **DNS Management**

---

## STEP 2: Change Nameservers to Vercel DNS

1. Scroll down to the **"Nameservers"** section
2. Click the **"Change"** button next to current nameservers
3. Select **"Enter my own nameservers (advanced)"**
4. Enter EXACTLY:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Click **"Save"**
6. Confirm any 2FA/verification prompts
7. Wait for confirmation: "Domain information updated successfully"

---

## STEP 3: Wait for DNS Propagation

1. Wait **5–30 minutes**
2. Check propagation at: https://www.whatsmydns.net/#NS/squashladder.in
3. When complete, nameservers show `ns1.vercel-dns.com` and `ns2.vercel-dns.com` globally

---

## STEP 4: Verify in Vercel

1. Go to: https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform/settings/domains
2. Find `squashladder.in`
3. Status should auto-change from "Pending" to "Verified"
4. If pending after 30 min, click **"Verify"** manually

---

## STEP 5: Deploy the Latest Build

1. Open terminal
2. Run:
```
cd C:/Users/anuro/CascadeProjects/2026-Sep-Squash-Ladder
vercel deploy --prod --force
```
3. Wait for completion — should show `squashladder.in` as production URL

---

## STEP 6: Test the Live Site

1. Go to: https://squashladder.in
2. Verify:
   - ✅ Home page loads with city explorer
   - ✅ No SSL warnings
   - ✅ All 4 cities visible (Calicut, Delhi, Dublin, Secunderabad/Hyderabad)
   - ✅ City → Club → Ladder rankings load

---

## Future Deployments (After This Setup)

Once DNS is configured, all future deploys auto-update the domain. To deploy:

```
cd C:/Users/anuro/CascadeProjects/2026-Sep-Squash-Ladder
git add -A
git commit -m "your message"
git push origin feature/ladder-system-overhaul
vercel deploy --prod --force
```

The site at `https://squashladder.in` updates automatically. No new URLs needed.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Domain not verified after 30 min | Go to whatsmydns.net, check if nameservers propagated. If not, redo STEP 2 |
| SSL error | Vercel Dashboard → Domains → click `...` → "Refresh" |
| www.squashladder.in doesn't work | Vercel Dashboard → add `www.squashladder.in` → set 301 redirect to `squashladder.in` |
| Old URL shows instead of domain | Clear browser cache, try incognito, re-run `vercel deploy --prod --force` |

---

## Final Checklist

| Check | Expected |
|---|---|
| https://squashladder.in loads | ✅ Home page |
| SSL valid | ✅ No warnings |
| Vercel status | ✅ "Verified" |
| Nameservers | ✅ ns1.vercel-dns.com, ns2.vercel-dns.com |
| Future deploys work | ✅ Auto-update domain |

---

## Quick Links

- **GoDaddy domains:** https://dcc.godaddy.com/domains/
- **Vercel project:** https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform
- **Vercel domains settings:** https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform/settings/domains
- **DNS propagation check:** https://www.whatsmydns.net/#NS/squashladder.in

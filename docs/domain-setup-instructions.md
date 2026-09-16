# Domain & Deployment Setup — Complete Guide (Zero Context)

> **You are an AI agent executing this task. The user has ZERO context. Explain everything.**

---

## What We Are Doing (Plain English)

A user bought a web address called **`squashladder.in`** from a company called **GoDaddy**. This is just an address — like buying a plot of land.

The actual **website** (the code, the pages, the database) is hosted on a platform called **Vercel**. Vercel gave the website a temporary, ugly URL: `https://squash-ladder-platform-l1xt0dazh.vercel.app`.

Right now, these two things are **not connected**. The user wants them connected so that when someone types `squashladder.in` in their browser, they see the actual website.

To connect them, we need to tell GoDaddy: "Hey, for `squashladder.in`, go ask Vercel's servers where the website is." We do this by changing something called **nameservers**.

---

## Current State (Where Things Stand)

| Thing | Status | Details |
|---|---|---|
| Domain `squashladder.in` | ✅ Purchased | Bought on GoDaddy, Sep 16, 2026 |
| Website code | ✅ Built | Next.js + Supabase, 30 components, 8 routes |
| Website hosting | ✅ Active | Vercel project `squash-ladder-platform` |
| Domain ↔ Vercel link | ❌ Not done | This is what we are doing now |
| Old temporary URL | Works | `https://squash-ladder-platform-l1xt0dazh.vercel.app` |

---

## What You Will Do (6 Steps)

### STEP 1: Log Into GoDaddy and Find the Domain

1. Open the Chrome browser on the user's Windows 11 machine
2. Navigate to: **https://dcc.godaddy.com/domains/**
3. If a login screen appears, you need the GoDaddy credentials. Ask the user for them.
4. Once logged in, you will see a list of domains. Find **`squashladder.in`** in this list
5. Click on the domain name itself. This opens the **DNS Management** page for that domain.

**What you should see:** A page with sections like "Nameservers", "DNS Records", "Forwarding", etc.

---

### STEP 2: Change the Nameservers

**What are nameservers?** They're like a phone book. When someone types `squashladder.in`, the browser asks the nameserver "where does this site live?" Right now, GoDaddy's nameservers say "I don't know." We're going to switch to Vercel's nameservers, which WILL know.

1. On the DNS Management page, scroll down to the **"Nameservers"** section
2. You'll see GoDaddy's nameservers listed (something like `nsXX.domaincontrol.com`)
3. Click the **"Change"** button next to the nameservers
4. A popup appears. Select **"Enter my own nameservers (advanced)"** (NOT "Default" or "Custom" with GoDaddy's values)
5. Two input fields will appear. Enter EXACTLY these values:
   - First field: **`ns1.vercel-dns.com`**
   - Second field: **`ns2.vercel-dns.com`**
6. Click **"Save"**
7. GoDaddy may ask for 2FA verification (a code sent to the user's phone/email). If so, ask the user for the code.
8. Wait for the success message: "Domain information updated successfully"

**You have now told GoDaddy:** "Stop being the phone book for this domain. Vercel's nameservers will handle it from now on."

---

### STEP 3: Wait for DNS Propagation

**What is propagation?** When you change nameservers, that change has to copy itself to thousands of DNS servers worldwide. This is called propagation. It takes 5–30 minutes (sometimes up to 48 hours in rare cases, but usually fast).

**What to do:**
1. Wait **at least 5 minutes**
2. To check if propagation is complete, go to: **https://www.whatsmydns.net/#NS/squashladder.in**
3. This site shows the nameservers that different locations around the world see
4. When propagation is complete, ALL locations should show `ns1.vercel-dns.com` and `ns2.vercel-dns.com`
5. If some still show GoDaddy's nameservers, wait longer and check again

**Don't proceed to Step 4 until propagation is complete.**

---

### STEP 4: Verify the Domain in Vercel

Vercel now needs to verify that the domain is correctly pointed at it.

1. Open a new browser tab
2. Navigate to: **https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform/settings/domains**
3. If prompted, log into Vercel (use the user's Vercel credentials — same email as GoDaddy: `anuroopquestion7@gmail.com`)
4. You will see a list of domains associated with this project. Find **`squashladder.in`**
5. Look at its status:
   - If it says **"Verified"** — great, move to Step 5
   - If it says **"Pending"** — click the **"Verify"** button next to it
   - If it still says "Pending" after clicking Verify, wait 5 minutes and try again
   - If it says "Expired" or "Error", click the **"Refresh"** button

**What this does:** Vercel checks that the DNS records point to its servers. Once confirmed, it provisions an SSL certificate (for the padlock icon) and activates the domain.

---

### STEP 5: Deploy the Latest Version of the Website

The code on the user's machine is newer than what's currently live. We need to deploy it to production.

1. Open a terminal (in VS Code, Windows Terminal, or Command Prompt — any terminal works)
2. Type the following command and press Enter:
```
cd C:/Users/anuro/CascadeProjects/2026-Sep-Squash-Ladder
```
3. Wait for the directory to change. Then type the next command and press Enter:
```
vercel deploy --prod --force
```
4. You will see output showing the upload progress, the build process, and finally a URL
5. The final line should show the new production URL. If the domain is verified, it will show **`https://squashladder.in`** instead of a random Vercel URL
6. If it still shows the random URL (like `squash-ladder-platform-xxxxx.vercel.app`), the domain verification may not be complete. Wait a few minutes and run the command again.

**What this does:** Takes the code from the local machine, builds it (compiles TypeScript, optimizes assets, etc.), and uploads it to Vercel's servers. The `--prod` flag means "put this on the real production URL." The `--force` flag means "deploy even if Vercel thinks nothing changed."

---

### STEP 6: Test That Everything Works

1. Open a browser tab
2. Navigate to: **https://squashladder.in**
3. Verify ALL of the following:
   - ✅ The page loads (not an error page, not a blank page)
   - ✅ You see the heading "Find your local ladder"
   - ✅ You see 4 city sections: Calicut, Delhi, Dublin, Secunderabad/Hyderabad
   - ✅ There is a padlock icon in the browser's address bar (SSL is working)
   - ✅ No warnings or errors in the browser console (press F12 → Console tab to check)
4. Click into any city, then click into a club, and verify the ladder rankings table loads
5. If anything is broken, check the Vercel deployment logs at: **https://vercel.com/anuroopquestion7-gmailcoms-projects/squash-ladder-platform**

---

## How to Deploy Future Updates (Important)

Once this setup is complete, ALL future deployments will automatically update `https://squashladder.in`. Here is the exact workflow the user (or any AI agent) should follow:

```
cd C:/Users/anuro/CascadeProjects/2026-Sep-Squash-Ladder
git add -A
git commit -m "describe what changed"
git push origin feature/ladder-system-overhaul
vercel deploy --prod --force
```

That's it. Four commands. The site at `https://squashladder.in` updates within 1-2 minutes.

---

## Troubleshooting (If Something Goes Wrong)

### Problem: "Domain not verified" and it won't verify
- Go to https://www.whatsmydns.net/#NS/squashladder.in
- If nameservers still show GoDaddy's (not Vercel's), the change didn't save — redo STEP 2
- If nameservers DO show Vercel's but Vercel still says Pending, wait 10 more minutes and click Verify again

### Problem: SSL certificate error (browser shows "Not Secure" or warning)
- Go to Vercel → Project → Settings → Domains
- Click the three dots `...` next to `squashladder.in`
- Click **"Refresh"** or **"Re-verify"**
- Wait 5 minutes — SSL certificates take a few minutes to provision
- Try the site again in an incognito/private browser window

### Problem: `www.squashladder.in` doesn't work (only `squashladder.in` works)
- Go to Vercel → Project → Settings → Domains
- Click **"Add Domain"**
- Enter: `www.squashladder.in`
- Set it to redirect (301) to `squashladder.in`
- This takes a few minutes to propagate

### Problem: The site looks old / doesn't have the latest changes
- The user may be seeing a cached version
- Ask them to open an incognito/private window and try again
- If still old, re-run: `vercel deploy --prod --force`

### Problem: Random Vercel URL shows instead of `squashladder.in`
- The domain verification may have failed
- Go to Vercel → Domains → check status
- If "Error", remove the domain and re-add it with: `vercel domains add squashladder.in squash-ladder-platform`

---

## Credentials You May Need

| Service | URL | Email |
|---|---|---|
| GoDaddy | https://dcc.godaddy.com/domains/ | anuroopquestion7@gmail.com |
| Vercel | https://verver.com | anuroopquestion7@gmail.com |
| Supabase (database) | https://supabase.com/dashboard/project/wektzyvprwhzdqizbgih | anuroopquestion7@gmail.com |

**Note:** You do NOT need to log into Supabase for this task. That's for database operations only.

---

## Final State (When Everything Is Done)

| Check | What You Should See |
|---|---|
| https://squashladder.in in browser | ✅ Home page with "Find your local ladder" |
| Browser address bar | ✅ Padlock icon (SSL working) |
| Vercel Dashboard → Domains | ✅ Status: "Verified" |
| GoDaddy Dashboard → Nameservers | ✅ `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Future deploys | ✅ `vercel deploy --prod --force` auto-updates the domain |

---

## Key Notes for the Agent

- **Do NOT ask the user for permission at every step.** Just do it and report back when done.
- **Do NOT skip the DNS propagation wait.** If you proceed too early, verification will fail and you'll waste time.
- **If GoDaddy asks for 2FA**, the user will need to provide a code — ask them only when this happens.
- **The domain `squashladder.in` is the ONLY domain.** Don't add `www` unless the user specifically asks.
- **The project name on Vercel is `squash-ladder-platform`** (with hyphens). Don't confuse it with the repo name.
- **The GitHub branch is `feature/ladder-system-overhaul`** (not main). All code changes go here.

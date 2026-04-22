# Deployment Guide — Expansion Navigator

This guide walks you through getting the tool live on the internet so you can send the panel a working URL. Total time: about 20 minutes the first time.

You'll do this once. After that, the URL just works.

---

## What you'll have at the end

- A live URL like `expansion-navigator-yourname.vercel.app`
- The panel can open it, fill in any account, click any button, and everything works
- They never see anything technical
- Your Anthropic API key stays hidden on Vercel's server, never exposed to anyone

---

## Step 1 — Get an Anthropic API key (5 minutes)

1. Go to **console.anthropic.com**
2. Sign up or log in
3. Click **Plans & Billing** in the left sidebar
4. Click **Buy credits** and add **$5** (this is the smallest amount and will be plenty)
   - Use prepaid credits, NOT auto-recharge — this guarantees you can never be over-billed
5. Click **API Keys** in the left sidebar
6. Click **Create Key**
7. Name it something like "Expansion Navigator"
8. **Copy the key** — it starts with `sk-ant-...`. You'll only see it once.
9. Paste it somewhere safe for now (a note app). You'll need it in Step 4.

---

## Step 2 — Push the code to GitHub (5 minutes)

1. Download all the files I created (they're in the `expansion-navigator` folder)
2. Go to **github.com**, log in
3. Click **New repository**
4. Name it `expansion-navigator` (or anything you want)
5. Set it to **Public** (Vercel works best with public repos for free accounts)
6. Don't add any starter files — leave everything unchecked
7. Click **Create repository**

GitHub will show you a page with commands to push code. The simplest way:

**If you have GitHub Desktop installed:**
- Open GitHub Desktop
- File → Add Local Repository → choose the `expansion-navigator` folder
- It will offer to publish — click Publish, point it at the new repo

**If you use the command line:**
```bash
cd expansion-navigator
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/expansion-navigator.git
git push -u origin main
```

When you're done, refresh your GitHub repo page and you should see all the files there.

---

## Step 3 — Connect to Vercel (5 minutes)

1. Go to **vercel.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub** (easiest — it links your accounts)
4. Authorize Vercel to access your GitHub
5. On the Vercel dashboard, click **Add New** → **Project**
6. You'll see a list of your GitHub repos. Find `expansion-navigator` and click **Import**
7. Vercel will auto-detect it's a Vite project. Don't change any of the build settings.
8. **Before clicking Deploy**, scroll down to **Environment Variables**. This is the important part — see Step 4.

---

## Step 4 — Add your API key as an environment variable (2 minutes)

This is the step that hides your key on Vercel's server so the tool can use it without exposing it to anyone.

Still on the import page from Step 3:

1. Find the **Environment Variables** section
2. In the **Name** field, type exactly: `ANTHROPIC_API_KEY`
   - Capitalization matters. Copy-paste this if you're not sure.
3. In the **Value** field, paste the API key you saved in Step 1 (starts with `sk-ant-`)
4. Click **Add**
5. Now click **Deploy** at the bottom

Vercel will spend about 1-2 minutes building. Sit tight.

---

## Step 5 — Test it (3 minutes)

1. When Vercel finishes, it'll show you a "Congratulations" page with a URL
2. Click **Continue to Dashboard**, then click your project
3. At the top, you'll see your URL — something like `expansion-navigator-abc123.vercel.app`
4. Click it. The Welcome screen should load.
5. Click **Start**, fill in some test data, score some dimensions, and hit **Run pressure test**
6. If you see real Claude output (not an error), **you're done**. The tool is live.

If you see an error like "Server is not configured":
- Go back to Vercel → your project → Settings → Environment Variables
- Make sure `ANTHROPIC_API_KEY` is there and the value starts with `sk-ant-`
- Then go to **Deployments** → click the latest one → click the **...** menu → **Redeploy**

---

## Step 6 — Send the panel your URL

That's it. Send them the Vercel URL. They open it, everything works.

If you want a cleaner URL, Vercel lets you customize it:
- Go to your project → Settings → Domains
- You can change the subdomain to something like `expansion-navigator-paul.vercel.app`

---

## After your interview

If you want to stop the tool from running (so it can't accumulate any cost):

**Option A — Disable the project**
- Vercel → Settings → Advanced → Pause Project

**Option B — Delete the API key**
- console.anthropic.com → API Keys → delete the key
- The tool will stop working but the website will still load (just the AI buttons will error)

**Option C — Just leave it**
- Cost is negligible. $5 of credits will last you years if no one uses it.

---

## Troubleshooting

**"Build failed" on Vercel**
Check that all files were pushed to GitHub. The `package.json`, `vite.config.js`, and the `src/` folder need to be present.

**The site loads but the AI buttons return errors**
Check the environment variable is set correctly: Settings → Environment Variables → confirm `ANTHROPIC_API_KEY` exists and the value is correct. After fixing, you must redeploy (Deployments → click latest → ... → Redeploy).

**You see your API key somewhere in the browser**
You shouldn't. The whole point of the Vercel function is that the key stays on the server. If you see it in the browser, something has been changed in the code — revert to the original `api/claude.js`.

---

## What if something breaks the day before the interview?

Keep your local copy. If the live URL ever goes down, you can:
1. Run `npm install` then `npm run dev` locally
2. Open `localhost:5173` in your browser
3. The tool works locally too — though without the API key you'd need to handle that separately

But honestly, once Vercel is set up, it's extremely reliable. It'll just work.

# 幫我選午餐 — Web App Setup Guide

No coding experience needed. Follow each step in order.

---

## Step 1 — Install Node.js

1. Go to https://nodejs.org
2. Click the big green **"LTS"** button to download
3. Run the installer, click Next → Next → Install (keep all defaults)
4. When finished, open a new **Command Prompt** (search "cmd" in Start menu)
5. Type `node --version` and press Enter — you should see something like `v20.x.x`

---

## Step 2 — Get a Google Places API Key

1. Go to https://console.cloud.google.com and sign in with a Google account
2. Click **"Select a project"** → **"New Project"** → name it anything → **Create**
3. In the left menu go to **APIs & Services → Library**
4. Search for **"Places API"** and click **Enable**
5. Go to **APIs & Services → Credentials**
6. Click **+ Create Credentials → API Key**
7. Copy the key (looks like `AIzaSy...`)

---

## Step 3 — Add the API key to the project

1. Open the folder `meal-picker` in File Explorer
2. Find the file called `.env.local`
   - If you can't see it, open File Explorer → View → tick "Hidden items"
3. Open it with Notepad
4. Replace `YOUR_GOOGLE_PLACES_API_KEY_HERE` with your actual key
5. Save and close

It should look like:
```
GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXX
```

---

## Step 4 — Install and run the app

1. Open **Command Prompt**
2. Navigate to the meal-picker folder by typing (adjust path if needed):
   ```
   cd "C:\Users\YourName\Desktop\AI Testing\projecttest\meal-picker"
   ```
3. Install dependencies (only needed once):
   ```
   npm install
   ```
4. Start the app:
   ```
   npm run dev
   ```
5. Open your browser and go to: **http://localhost:3000**

You should see the app! 🎉

---

## Step 5 — Use it on your phone

While `npm run dev` is running on your computer:

1. Make sure your phone is on the **same Wi-Fi** as your computer
2. Find your computer's local IP address:
   - Open Command Prompt and type `ipconfig`
   - Look for **IPv4 Address** (something like `192.168.1.x`)
3. On your phone browser, go to: `http://192.168.1.x:3000`

---

## To stop the app

Press **Ctrl + C** in the Command Prompt window.

## To start again next time

Just repeat Step 4 (no need to `npm install` again):
```
npm run dev
```

---

## Optional: Deploy to the internet (free)

To access it from anywhere without your computer running:

1. Go to https://vercel.com and sign up (free, use GitHub login)
2. Upload this folder or connect your GitHub repo
3. In Vercel's settings, add your environment variable:
   - Name: `GOOGLE_PLACES_API_KEY`
   - Value: your API key
4. Deploy — Vercel gives you a public URL like `https://meal-picker-xxx.vercel.app`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "node is not recognized" | Restart Command Prompt after installing Node.js |
| "Cannot find module" | Run `npm install` again |
| App loads but no restaurants found | Check the API key in `.env.local` |
| Location permission denied | Click the lock icon in your browser address bar and allow location |
| "API key not configured" error | Make sure `.env.local` has the key and you restarted `npm run dev` |

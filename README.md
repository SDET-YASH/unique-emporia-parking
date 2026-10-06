# Unique EMPORIA - Parking Management System

A simple static website for managing Unique EMPORIA society parking allocations. Deploys automatically to GitHub Pages via GitHub Actions.

## Features

- Public view with search and filters
- Admin panel to add, edit, and delete records
- Publish changes directly to GitHub (optional)
- Download / import JSON as a fallback

## Folder Structure

```
parking-management/
├── index.html              # Public parking list
├── admin.html              # Admin panel
├── css/style.css
├── js/app.js
├── js/admin.js
├── data/parking.json       # All parking records
├── .github/workflows/deploy.yml
└── README.md
```

## Setup (5 minutes)

### 1. Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it e.g. `parking-management`
3. Set visibility to **Public** (required for free GitHub Pages)
4. Do **not** add README, .gitignore, or license

### 2. Upload these files

Upload the entire `parking-management` folder contents to your repo (drag & drop on GitHub, or use git):

```bash
git init
git add .
git commit -m "Initial parking management site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/parking-management.git
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to **Settings → Pages**
2. Under **Build and deployment**, set Source to **GitHub Actions**
3. After the first push, the workflow runs automatically
4. Your site will be live at: `https://YOUR-USERNAME.github.io/parking-management/`

## Admin Panel

- URL: `https://YOUR-USERNAME.github.io/parking-management/admin.html`
- Default password: `admin123` (change it in Admin → GitHub Publish Settings)

### Option A: Publish via GitHub (recommended)

1. Create a [GitHub Personal Access Token](https://github.com/settings/tokens) with **Contents: Read and write** scope
2. In Admin → GitHub Publish Settings, enter:
   - GitHub Username
   - Repository Name
   - Branch (`main`)
   - Your token
3. Click **Save Settings**
4. Add/edit records, then click **Publish to GitHub**
5. GitHub Actions redeploys the site in ~1 minute

### Option B: Manual update (no token)

1. Add/edit records in the admin panel
2. Click **Download JSON**
3. Replace `data/parking.json` in your repo with the downloaded file
4. Commit and push — GitHub Actions will redeploy

## Editing Data Directly on GitHub

You can also edit `data/parking.json` directly on github.com. Any push to `main` triggers a redeploy.

## Security Notes

- Change the default admin password immediately
- The GitHub token is stored only in your browser's localStorage
- For a society site, avoid putting sensitive data in a public repo if contact numbers should stay private — consider making the repo private and using GitHub Enterprise Pages, or remove phone numbers from the public view

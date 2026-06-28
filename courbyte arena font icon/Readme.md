Here's a clear, ready‑to‑use **README.md** file for your project.  
Save it as `README.md` in the root of your `Backend` folder before pushing to GitHub.

```markdown
# Courbyte Icons

Your own icon library, on your own CDN – built with Supabase + GitHub Actions.  
Combine thousands of open‑source icons with your custom logos (background removal included) and deliver them as a lightweight webfont kit.

---

## ✨ Features

- **Pool open‑source icons** – Automatically fetches, cleans, and stores SVGs from Feather, Lucide, Heroicons, Tabler, Phosphor, and more.
- **Custom logo upload** – Remove backgrounds with AI (`rembg`), convert to SVG, and add them to your private kit.
- **On‑demand font generation** – Generate a webfont (WOFF2, WOFF, CSS) from any selection of icons.
- **Your own CDN link** – Kits are served from Supabase Storage, ready to embed with a single `<link>` tag.
- **White‑label ready** – Use your own CSS prefix (default `ca`) and custom domain later.

---

## 🧱 Tech Stack (100% free)

| Component          | Technology                         |
|--------------------|------------------------------------|
| Icon database      | Supabase (PostgreSQL)              |
| Storage & CDN      | Supabase Storage                   |
| Kit generator      | GitHub Actions                     |
| Background removal | `rembg` (Python) – triggered via Action |
| Font generation    | `svgtofont` (Node.js)              |
| Frontend (coming)  | Vercel / Cloudflare Pages          |

---

## 📁 Project structure


Courbyte arena font icon/
├── sync-icons.mjs         # Pulls icons from GitHub → Supabase
├── build-kit.mjs          # Local kit generation (for testing)
├── CONTRIBUTING.md
├── readme.md
├── scripts/
│   └── ci-generate-kit.js # CI script used by GitHub Actions
├── .github/
│   └── workflows/
│       └── generate-kit.yml
└── .env                   # Not committed (holds secrets)
```

---

## 🚀 Quick start (local development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Courbyte/courbyte_arena_font_icons.git

   cd your-repo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file with:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GITHUB_TOKEN=your-github-token (optional, for higher rate limits)
   ```

4. **Pool icons from GitHub** (Feather, Lucide, etc.)
   ```bash
   node sync-icons.mjs
   ```

5. **Build a test kit locally**
   ```bash
   node build-kit.mjs
   ```
   The generated font and CSS will be in `dist-kit/`.

---

## ☁️ Live kit generation (via API)

1. **Add secrets to GitHub**  
   In your repo → Settings → Secrets → Actions, add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Trigger a kit build**
   ```bash
   curl -X POST \
     -H "Accept: application/vnd.github+json" \
     -H "Authorization: Bearer YOUR_GH_TOKEN" \
     -H "X-GitHub-Api-Version: 2022-11-28" \
     -H "Content-Type: application/json" \
     -d '{"event_type":"build-kit","client_payload":{"userId":"test123","icons":["star","trash","user"]}}' \
     https://api.github.com/repos/OWNER/REPO/dispatches
   ```

3. **Get the CSS URL**  
   After the GitHub Action completes, the kit will be available in your Supabase Storage bucket `kits` under `test123/ca-icons.css`.

---

## 🧪 Using the generated icon font

```html
<link rel="stylesheet" href="https://your-project.supabase.co/storage/v1/object/public/kits/test123/ca-icons.css">
<i class="ca ca-star"></i>
<i class="ca ca-trash"></i>
```

---

## 🔮 Roadmap

- [ ] Frontend dashboard to select icons and manage kits
- [ ] Custom logo upload with automatic background removal
- [ ] Custom domain support (`cdn.yourdomain.com`)
- [ ] Figma / Sketch plugin
- [ ] Paid Pro / Enterprise tiers

---

## 📜 License

MIT – see `LICENSE` file for details.

---

Made with  by [Azakaye courage / Courbyte]
```

---

This README gives anyone (including your future self) a complete overview of what the project does, how to run it, and what’s coming next.  


version 1.0
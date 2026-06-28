
## `CONTRIBUTING.md`

```markdown
# Contributing to Courbyte arena Icons

Thank you for your interest in contributing!  
Courbyte Icons is an open‑source icon platform (MIT‑licensed). We welcome improvements that help the community build faster, cleaner icon libraries.

---

## 🧭 What can be contributed?

✅ **Allowed contributions:**
- Adding new **open‑source icon repositories** to the automated pooling script (`sync-icons.mjs`).  
- Improving **SVG normalisation** (SVGO settings) for better consistency and smaller files.  
- Enhancing the **font generation pipeline** (`build-kit.mjs`, `scripts/ci-generate-kit.js`).  
- **Documentation**, examples, or tutorials.  
- Bug fixes, test coverage, or code quality improvements.  
- Tooling for design applications (Figma, Sketch plugins, CLIs, etc.).

❌ **Not allowed:**
- Uploading **personal logos**, copyrighted images, or brand assets to the public icon pool.  
  (Custom logos are processed privately through our Pro service and are never stored in this repository.)  
- Adding icons that do not have a **compatible open‑source license** (e.g., CC0, MIT, SIL OFL).  
- Breaking existing public APIs or generated output without prior discussion.

---

## 📁 Project structure

```
.
├── sync-icons.mjs          # Pulls icons from GitHub → Supabase
├── build-kit.mjs           # Local kit generator (for testing)
├── scripts/
│   └── ci-generate-kit.js   # Used by GitHub Actions to build kits on demand
├── .github/
│   └── workflows/
│       └── generate-kit.yml # CI workflow triggered by repository_dispatch
└── .env.example            # Template for local development (do NOT commit real .env)
```

---

## 🛠️ Development setup

1. **Fork** the repository and **clone** your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up a **Supabase** project (free tier) for testing.
4. Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Optional) `GITHUB_TOKEN` for higher API rate limits
5. Run the icon sync to populate your local DB:
   ```bash
   node sync-icons.mjs
   ```
6. Build a test kit:
   ```bash
   node build-kit.mjs
   ```
7. Make your changes, test thoroughly, and follow the pull request process below.

---

## 🚦 Pull Request Process

1. **Create a branch** from `main` (e.g., `feat/add-heroicons-solid` or `fix/svg-cleanup`).
2. **Make your changes**, ensuring they are well‑tested.
3. **Update documentation** if necessary (README, CONTRIBUTING, or inline comments).
4. **Commit** with clear messages.
5. **Push** to your fork.
6. **Open a pull request** (PR) against the original repository’s `main` branch.
7. In the PR description, explain **what** you changed and **why**.
8. A maintainer will review your PR. We may ask for revisions.
9. Once approved, your contribution will be merged. 🎉

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the same **MIT License** that covers this project.

---

## 💬 Questions?

If you’re unsure about something, open an **issue** first to discuss your idea before coding.  
We’re friendly and happy to help!

---

Thank you for making Courbyte arena  Icons better for everyone!
```
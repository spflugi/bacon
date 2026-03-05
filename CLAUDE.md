# Bacon — CLAUDE.md

Desktop requirements and specification manager for AI-assisted development.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Desktop:** Tauri v2
- **State:** Zustand v5
- **DB:** SQLite via `@tauri-apps/plugin-sql`
- **UI primitives:** Radix UI + shadcn-style components in `src/components/ui/`
- **Icons:** lucide-react

## Project structure

```
src/
  main.tsx              # Entry point, imports globals.css
  globals.css           # Tailwind v4 @theme block, dark theme
  types/index.ts        # Shared TypeScript types
  lib/
    db.ts               # SQLite init + all migrations (runs on startup)
    export.ts           # Export logic (clipboard)
  store/
    projectStore.ts     # Zustand store: project CRUD + DB calls
    specStore.ts        # Zustand store: spec CRUD + DB calls
  components/
    ui/                 # Reusable primitives (button, badge, input, etc.)
    projects/           # ProjectForm, Sidebar
    specs/              # SpecList, SpecDetail, SpecEditor, SpecFilters, SpecBadges
    views/              # DashboardView, SpecsView, ExportView
src-tauri/
  src/lib.rs            # Rust entry point
  tauri.conf.json       # Tauri config (productName, version, bundle targets)
  Cargo.toml            # Rust dependencies + app version
```

## Data model

| Table | Key columns |
|---|---|
| `projects` | id, name, description, prefix, created_at, updated_at |
| `specifications` | id, spec_id, project_id, type, category, title, description, acceptance_criteria, status, priority, tags (JSON), version, notes, created_at, updated_at |
| `spec_links` | id, source_id, target_id, link_type, notes |
| `spec_history` | id, spec_id, snapshot (JSON), changed_at, change_summary |

All migrations live in `src/lib/db.ts:migrate()`. Add new migrations there — never modify existing ones.

Spec ID format: `FR-{PREFIX}-001` (functional) or `NFR-{PREFIX}-001` (non-functional), auto-incremented per project+type.

## Development commands

```bash
npm run tauri dev    # run app with hot reload
npm run build        # frontend build only
npx tsc --noEmit     # type check only
```

## Windows / Git Bash linker issue

Git's `link.exe` (`C:\Program Files\Git\usr\bin\link.exe`) shadows MSVC's linker. Fix: create `src-tauri/.cargo/config.toml` (gitignored) with:

```toml
[target.x86_64-pc-windows-msvc]
linker = "C:/Program Files/Microsoft Visual Studio/<version>/Professional/VC/Tools/MSVC/<toolset>/bin/Hostx64/x64/link.exe"
```

The CI pipeline overrides this via `CARGO_TARGET_X86_64_PC_WINDOWS_MSVC_LINKER=link.exe`.

## Releasing

1. Run `.\bump-version.ps1 -Bump patch|minor|major` — updates version in `package.json`, `tauri.conf.json`, and `Cargo.toml`, then commits.
2. After merging to `develop`, tag and push:
   ```bash
   git tag v<version>
   git push origin v<version>
   ```
3. Pushing the tag triggers the **Deploy** workflow (`.github/workflows/deploy.yml`), which builds the NSIS installer and publishes a GitHub Release.

## CI workflows

| File | Trigger | Purpose |
|---|---|---|
| `.github/workflows/build.yml` | Push/PR to `develop` or `feature/**` | Type-check + build verification (Ubuntu) |
| `.github/workflows/deploy.yml` | Push of `v*.*.*` tag or manual dispatch | Release build + GitHub Release + installer artifact (Windows) |

## Conventions

- All DB access goes through Zustand stores — no direct DB calls from components.
- UI components in `src/components/ui/` follow shadcn patterns (CVA + Radix).
- Dark theme is the only supported theme; don't add light-mode variants.
- The SQLite file (`bacon.db`) lives in the Tauri app data dir and is gitignored.

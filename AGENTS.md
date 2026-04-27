# Repository Guidelines

## Project Structure & Module Organization
This workspace is split by concern:

- `api/`: native PHP REST endpoints plus one-off schema and data migration scripts such as `alter_*.php`, `setup_*.php`, and `inject_permissions.php`.
- `web-poc/`: Vite + React frontend. Main entry points live in `src/main.jsx`, `src/App.jsx`, and `src/pages/`.
- `hydromart_sales_schema.sql`: base MySQL schema to import before first run.
- `SYSTEM_DOCUMENTATION.md`, `PROJECT_PLAN.md`, `MASTER_DATA_STANDARDS.md`: project memory, roadmap, and UI/data standards.

Keep new backend endpoints in `api/` with snake_case filenames, and keep React pages/components under `web-poc/src/` with PascalCase component names.

## Build, Test, and Development Commands
- `cd web-poc && npm install`: install frontend dependencies.
- `cd web-poc && npm run dev`: start the Vite dev server.
- `cd web-poc && npm run build`: create the production bundle in `web-poc/dist/`.
- `cd web-poc && npm run lint`: run the ESLint checks used by this repo.
- `php -S localhost:8000 -t api`: serve the PHP API locally when Apache/XAMPP is not being used.
- `mysql -u <user> -p < hydromart_sales_schema.sql`: load the baseline schema.

## Coding Style & Naming Conventions
Match the existing style in each area:

- React/JSX: ES modules, functional components, PascalCase components, camelCase helpers/state, and 2-space indentation.
- PHP: procedural endpoint files, snake_case request/database fields, and prepared statements through PDO.
- Database/API contracts should stay in `snake_case` (`company_id`, `replacement_date`), even if older frontend code still contains some camelCase remnants.

Use `npm run lint` before submitting frontend changes. Do not introduce mock-data imports back into the live flow.

## Testing Guidelines
There is no automated test suite in this workspace today. Minimum validation is:

- run `npm run lint`;
- smoke-test login, list pages, and any edited endpoint;
- verify RBAC behavior with at least one restricted user and one elevated user.

When changing schema, prefer additive `api/alter_*.php` scripts over destructive edits to live tables.

## Commit & Pull Request Guidelines
Git history is not available in this workspace, so use short imperative commits with a clear scope, for example `api: add installation transfer audit log` or `web-poc: fix login connection state`.

PRs should include a concise summary, affected paths, database/config changes, manual test notes, and screenshots for UI work. Call out any required updates to `api/config.php` or `web-poc/.env` explicitly.

## Security & Configuration Tips
Keep database credentials in `api/config.php` environment-specific, and keep `web-poc/.env` aligned with the correct `VITE_API_URL`. Do not commit production secrets or hard-coded hostnames.

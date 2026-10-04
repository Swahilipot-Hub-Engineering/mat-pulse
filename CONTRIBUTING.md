# Contributing to Mat-Pulse

Thank you for your interest in contributing to **Mat-Pulse**! Every contribution—whether
reporting a bug, improving documentation, adding new Mombasa transit routes, or writing
backend GTFS code—helps make public transit better for commuters across coastal Kenya.

## Quick reference

| | |
| :--- | :--- |
| **Branch from / PR into** | `staging` |
| **Commit style** | `feat(scope): description` ([Conventional Commits](https://www.conventionalcommits.org)) |
| **Before pushing** | `npm run typecheck` and `npm test` must pass |
| **Maintainer** | [@jkose002](https://github.com/jkose002) |
| **Mentors** | [@Swahilipot-Hub-Engineering/mentors](https://github.com/orgs/Swahilipot-Hub-Engineering/teams/mentors) |

## Contribution steps

1. **Find an issue to work on:**
   Browse open issues, particularly those labeled
   [`good first issue`](https://github.com/Swahilipot-Hub-Engineering/mat-pulse/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).
   Comment to claim the issue, and wait to be assigned before starting work.

2. **Branch from `staging`:**
   ```bash
   git checkout staging
   git pull origin staging
   git checkout -b feat/add-likoni-stage-updates
   ```

3. **Develop & Test:**
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```

4. **Submit a Pull Request:**
   Target `staging` as the base branch. Fill in the pull request template completely.

## Code Standards

- **Language:** TypeScript 5.7+ in strict mode. Use ES Modules with `.js` extensions for relative imports.
- **GTFS Standards:** All transit models must comply with GTFS Schedule and GTFS-Realtime v2.0 specs.
- **Testing:** Add or update unit/integration tests in `tests/` for any logic changes.

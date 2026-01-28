# Nostressia Frontend

## Overview
The Nostressia frontend is a production-ready React application built with Vite and Tailwind CSS. It delivers the user and admin experiences while relying on a shared, consistent authentication contract with the backend API.

## Tech Stack
- React 19 + React Router
- Vite
- Tailwind CSS
- Axios
- Vitest + React Testing Library

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a local environment file:
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables
| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL for the backend API (e.g., `https://api.example.com`). |
| `VITE_INTERNAL_USER` | Internal access username gate for non-public environments. |
| `VITE_INTERNAL_PASS` | Internal access password gate for non-public environments. |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for push notifications. |

## Available Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest once. |
| `npm run test:watch` | Run Vitest in watch mode. |
| `npm run test:coverage` | Run Vitest with coverage. |

## Testing Guide
### Unit + Component Tests
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

## Project Structure
```
src/
  api/           # Axios client and API adapters
  components/    # Shared UI components
  layouts/       # Layout wrappers (auth-aware)
  pages/         # Route-level UI
  router/        # Router configuration + guards
  services/      # API service layer
  utils/         # Reusable helpers (auth storage, notifications, etc.)
  __tests__/     # Vitest test suites
```

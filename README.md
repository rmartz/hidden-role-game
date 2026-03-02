# Secret Villain Game - Monorepo

This is a monorepo containing both the backend server and React frontend for the Secret Villain Game.

## Project Structure

```
secret-villain-game/
├── backend/           # Node.js Express API server
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── ui/                # React frontend
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
└── package.json       # Root monorepo config
```

## Getting Started

### Install Dependencies

```bash
npm install
```

This will install dependencies for both backend and frontend workspaces.

### Development

Run all workspaces in development mode:

```bash
npm run dev
```

Or run individual workspaces:

```bash
npm run backend:dev
npm run ui:dev
```

### Building

Build all workspaces:

```bash
npm run build
```

Or build specific workspaces:

```bash
npm run backend:build
npm run ui:build
```

### Testing

Run tests for all workspaces:

```bash
npm test
```

Or run tests for specific workspace:

```bash
npm run backend:test
```

### Backend Only

Start the backend server:

```bash
npm run backend:dev      # Development mode with hot reload
npm run backend:start    # Production mode
npm run backend:build    # Build TypeScript
npm run backend:test     # Run tests
```

### Frontend Only

Start the frontend dev server:

```bash
npm run ui:dev          # Development mode
npm run ui:build        # Build for production
npm run ui:preview      # Preview production build
```

## Backend Configuration

- **Framework**: Express.js
- **Language**: TypeScript
- **Port**: 3000
- **Test Framework**: Node.js built-in test runner

## Frontend Configuration

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Test Framework**: Vitest
- **Dev Port**: 5173

## Deploying

Each workspace is independently deployable:

- **Backend**: Deploy `backend/dist/` or run with `npm run backend:start`
- **Frontend**: Deploy `ui/dist/` to any static hosting service

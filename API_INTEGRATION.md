# API Integration Guide

This monorepo uses **OpenAPI** for API contracts between the backend and frontend, with automatic client generation.

## Architecture

### Backend (OpenAPI Definition)

The backend uses **tsoa** decorators to automatically generate an OpenAPI specification:

1. **Controllers** are decorated with `@tsoa` decorators (`@Controller`, `@Get`, `@Post`, etc.)
2. Building the backend with `npm run backend:build` generates `backend/dist/openapi.yaml`
3. The spec describes all endpoints, request/response types, and status codes

### Frontend (Generated Client)

The frontend automatically generates a typed API client from the OpenAPI spec:

1. `npm --workspace=@secret-villain/ui run generate:client` regenerates `ui/src/api/generated/` using **openapi-typescript-codegen**
2. `ui/src/api/client.ts` wraps the generated service methods for app-level usage
3. Generated files are intentionally not source-tracked

## Workflow

### When You Add/Change an API Endpoint

1. **Update the Backend**

   ```typescript
   // backend/src/server/controllers/GameController.ts

   @Post("my-endpoint")
   @Response<MyResponseType>(200, "Success")
   async myEndpoint(@Body() body: MyRequestType): Promise<MyResponseType> {
     // implementation
   }
   ```

2. **Generate the Updated Spec**

   ```bash
   npm run backend:build  # Compiles TypeScript and generates openapi.yaml
   ```

3. **Generate Frontend Client**

   ```bash
   npm --workspace=@secret-villain/ui run generate:client  # Generates client from openapi.yaml
   ```

4. **Use in Frontend with Type Safety**
   ```typescript
   // ui/src/main.tsx
   const response = await api.myEndpoint(requestData);
   // Full TypeScript autocomplete and type checking!
   ```

## Files

### Backend

- `backend/tsoa.json` - tsoa configuration for spec generation
- `backend/src/server/controllers/GameController.ts` - Controller with @tsoa decorators
- `backend/dist/openapi.yaml` - **Generated** OpenAPI specification

### Frontend

- `ui/src/api/generated/` - **Generated** API client from OpenAPI spec (not tracked in git)
- `ui/src/api/client.ts` - Thin wrapper around generated client
- `ui/src/api/index.ts` - API exports
- `ui/package.json` - `generate:client` script

## One-Step Generation

You can regenerate everything with:

```bash
# From root
npm run backend:build && npm --workspace=@secret-villain/ui run generate:client

# Or individually
npm run backend:build
npm --workspace=@secret-villain/ui run generate:client
```

## Adding New Endpoints

1. Add a new method to `GameController` with @tsoa decorators
2. Document request/response types in decorators
3. Run `npm run backend:build` and `npm --workspace=@secret-villain/ui run generate:client`
4. The frontend now has fully typed access to the new endpoint

## Benefits

✅ **Single Source of Truth** - OpenAPI spec is the contract  
✅ **Type Safety** - Full TypeScript on both sides  
✅ **Autocomplete** - IDE suggestions in frontend code  
✅ **Documentation** - OpenAPI spec serves as API documentation  
✅ **Zero Runtime Magic** - No code generation at runtime, just types  
✅ **Changes Propagate** - Update backend → regenerate types → frontend gets updated types

## Testing

The backend includes tests that work with the tsoa-decorated controllers. Tests use a test setup that manually registers routes:

```bash
npm run backend:test
```

All 7 tests pass (6 game controller tests + 1 stub test).

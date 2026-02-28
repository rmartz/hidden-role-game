# API Integration Guide

This monorepo uses **OpenAPI/Swagger** for API contracts between the backend and frontend, with automatic TypeScript type generation.

## Architecture

### Backend (OpenAPI Definition)
The backend uses **tsoa** decorators to automatically generate an OpenAPI specification:

1. **Controllers** are decorated with `@tsoa` decorators (`@Controller`, `@Get`, `@Post`, etc.)
2. Building the backend with `npm run backend:build` generates `backend/dist/swagger.json`
3. The spec describes all endpoints, request/response types, and status codes

### Frontend (Type-Safe Client)
The frontend automatically generates TypeScript types from the OpenAPI spec:

1. `npm run ui:generate:client` generates `ui/src/api/types.ts` using **openapi-typescript**
2. A handwritten `ApiClient` class (`ui/src/api/client.ts`) provides a simple fetch-based wrapper
3. All API calls are fully type-safe with autocomplete

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
   npm run backend:build  # Compiles TypeScript and generates swagger.json
   ```

3. **Generate Frontend Types**
   ```bash
   npm run ui:generate:client  # Generates types.ts from swagger.json
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
- `backend/dist/swagger.json` - **Generated** OpenAPI specification

### Frontend
- `ui/src/api/types.ts` - **Generated** TypeScript types from OpenAPI spec
- `ui/src/api/client.ts` - Handwritten API client wrapper
- `ui/src/api/index.ts` - API exports
- `ui/package.json` - `generate:client` script

## One-Step Generation

You can regenerate everything with:

```bash
# From root
npm run backend:build && npm run ui:generate:client

# Or individually
npm run backend:build
npm run ui:generate:client
```

## Adding New Endpoints

1. Add a new method to `GameController` with @tsoa decorators
2. Document request/response types in decorators
3. Run `npm run backend:build` and `npm run ui:generate:client`
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

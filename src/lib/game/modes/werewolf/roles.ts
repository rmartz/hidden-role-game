// This file is a compatibility shim. All role definitions have been moved to
// src/lib/game/modes/werewolf/roles/index.ts (the roles/ directory).
// This file re-exports everything so imports of "@/lib/game/modes/werewolf/roles"
// continue to work regardless of whether bundler resolves to roles.ts or roles/index.ts.
export * from "./roles/index";

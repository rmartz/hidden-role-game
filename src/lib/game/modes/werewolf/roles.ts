// Compatibility re-export barrel. The roles module has been split into per-role
// files under roles/. This shim allows callers that imported "./roles" directly
// to continue working without changes.
export * from "./roles/index";

// Empty mock for browser-only modules (TipTap, ProseMirror, etc.)
// These get pulled into the bundle via barrel exports but are never
// called at runtime in the mobile app.
module.exports = {};

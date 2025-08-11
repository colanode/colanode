# Colanode postinstall script

This directory contains the **postinstall script** that automatically copies and distributes emoji and icon assets to the appropriate **Colanode** applications after each dependency installation. It ensures that the latest emojis, icons, fonts, and images are always present in both the desktop and web applications without requiring manual intervention.

## What It Does

The script copies different types of assets to different Colanode apps based on their specific needs:

**Desktop Application (`apps/desktop/assets/`)**:

- **Full databases**: `emojis.db` and `icons.db` (with SVG BLOBs) for offline capability
- **SVG sprites**: `emojis.svg` and `icons.svg` for efficient rendering
- **Fonts**: Custom fonts like `neotrax.otf`
- **Images**: Application logos and icons in various formats (.png, .ico, .icns)

**Web Application (`apps/web/public/assets/`)**:

- **Minimal databases**: `emojis.min.db` and `icons.min.db` (renamed to `emojis.db` and `icons.db`) without SVG BLOBs for faster loading
- **SVG sprites**: `emojis.svg` and `icons.svg` for rendering (since SVG data isn't in the minimal databases)
- **Fonts**: Custom fonts like `neotrax.otf`
- **Images**: Web-specific logo files in PNG format

## Why This Approach?

The primary purpose of this script is to maintain updated assets across applications without committing thousands of individual files to version control. Given that there are roughly 3,500 emoji files and 4,800 icon files, storing them directly in each app's repository would significantly bloat the codebase and produce large diffs whenever assets are updated.

**Key Benefits**:

- **Desktop apps** get full databases with embedded SVG data for offline functionality
- **Web apps** get minimal databases + separate SVG sprites for optimal loading performance and browser compatibility
- **Version control** remains clean by avoiding thousands of individual asset files
- **Consistent updates** across all applications when assets are regenerated
- **Flexible deployment** strategies for different application types

The asset directories (`apps/desktop/assets/` and `apps/web/public/assets/`) are therefore ignored by Git, as they are automatically populated during the build process.

For more information about how these assets are generated, check:

- [Emoji generation script](../emojis)
- [Icon generation script](../icons)

## Usage

While it's normally triggered by the monorepo's `postinstall` hook, you can manually invoke it if you'd like:

```bash
tsx scripts/src/postinstall/index.ts
```

# Colanode scripts

This folder contains a collection of one-time or utility scripts that support the Colanode application. These scripts are not part of the main application runtime; rather, they are used to generate assets, seed data, or perform other setup tasks.

## Overview

- **Emoji Generator (`/src/emojis`)** - Generates emoji files and metadata used in Colanode app.

- **Icons Generator (`/src/icons`)** - Generates icon files and metadata used in Colanode app.

- **Seed Script (`/src/seed`)** - Automatically creates dummy data for testing or local development. This includes:
  - Creating user accounts
  - Generating sample workspaces
  - Populating these workspaces with example content like pages, databases, and messages

- **Postinstall Script (`/src/postinstall`)** - a script that runs immediately after you install dependencies (via `npm install`).

## Usage

Each script can be run independently by calling the corresponding npm script in the root of `scripts` directory (as defined in the `package.json`):

- **Generate Emojis:**
  ```bash
  npm run generate:emojis
  ```
- **Generate Icons:**
  ```bash
  npm run generate:icons
  ```
- **Seed Data:**
  ```bash
  npm run seed
  ```

The `postinstall` script typically runs automatically after each `npm install`, but you can also manually run it if needed:

```bash
tsx scripts/src/postinstall/index.ts
```

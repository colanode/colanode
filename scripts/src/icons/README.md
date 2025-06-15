# Colanode icon generator script

This directory contains a script that automatically downloads, processes, and stores various icon sets for **Colanode**. These icons are used across the Colanode platform where users assign them as icons for their entries: channels, pages, databases, records, folders, etc.

By consolidating icons from [Remix Icon](https://github.com/Remix-Design/RemixIcon) and [Simple Icons](https://github.com/simple-icons/simple-icons), we provide a robust collection of icons—both general-purpose (Remix Icon) and brand-specific (Simple Icons)—for an optimal user experience.

## How It Works

1. **Download Required Repositories**

   - **Remix Icon** (from GitHub tag `v4.6.0`): Provides an extensive set of general-purpose icons, each organized into categories (e.g., "System," "User Interface," etc.).
   - **Simple Icons** (from GitHub tag `v14.13.0`): Provides icons for popular brands, making it easy to visually represent external services or technologies.

2. **Extract & Organize Files**  
   The script:

   - Unzips the downloaded archives into a temporary working directory (`src/icons/temp`).
   - For **Remix Icon**, it reads a `tags.json` file (inside the unzipped folder) to identify additional icon tags and categories.
   - For **Simple Icons 14 or earlier**, it reads a `_data/simple-icons.json` file to gather icon metadata (such as official title and slug).
   - For **Simple Icons 15 or later**, it reads a `data/simple-icons.json` file to gather icon metadata.

3. **Process & Generate**

   The script creates two database files and an SVG sprite:

   **Full Database (`icons.db`)**:

   - Initializes or updates an `icons.db` SQLite database in `../assets/icons/`.
   - Creates (or reuses) the following tables:
     - **categories** (stores category info like name, display order, etc.)
     - **icons** (stores each icon's core data, such as code, name, tags, etc.)
     - **icon_svgs** (stores each icon's SVG image as a BLOB)
     - **icon_search** (FTS table for search queries across icon names, tags, etc.)
   - Stores each icon's SVG data as a BLOB in the `icon_svgs` table.

   **Minimal Database (`icons.min.db`)**:

   - Creates a lightweight version of the database without storing SVG data as BLOBs.
   - Contains the same tables as the full database, except:
     - No `icon_svgs` table (SVG data is available via the sprite instead)
   - Used in web app for icon listing and search, because of some browser limitations on using the full database.

   **SVG Sprite (`icons.svg`)**:

   - Generates a comprehensive SVG sprite containing all icons as symbols.
   - Each icon is accessible via its unique icon ID as a symbol reference.
   - Used in web app for icon rendering, because of some browser limitations on using the full database.

   **Additional Processing**:

   - Organizes icons into categories (e.g., "System" categories from Remix Icon and a "Logos" category for all Simple Icons).
   - Merges any existing data so as not to overwrite or lose previously assigned IDs. This ensures icons already in use retain consistent IDs in the Colanode app.
   - Maintains a full-text search (`icon_search`) table for easy querying by name or tags.

4. **Clean Up**
   - Removes temporary files and directories once all icons have been inserted into the database.
   - Leaves you with updated `icons.db`, `icons.min.db`, and `icons.svg` files containing all icon data and assets.

## Usage

1. **Install Dependencies** (from the root of the monorepo):

   ```bash
   npm install
   ```

2. **Generate Icons** (from the `scripts` directory):

   ```bash
   npm run generate:icons
   ```

Once the script completes, you'll have:

- A full `icons.db` file with all icon metadata and SVG data as BLOBs
- A minimal `icons.min.db` file with metadata only (no SVG BLOBs)
- An `icons.svg` sprite file containing all icon graphics as symbols

## Notes on Licensing

While **Colanode** is open source under its own [license terms](../../../LICENSE) in the root of the monorepo, the icons downloaded from **Remix Icon** and **Simple Icons** are subject to their respective licenses. Please review their repositories for details:

- [Remix Icon](https://github.com/Remix-Design/RemixIcon)
- [Simple Icons](https://github.com/simple-icons/simple-icons)

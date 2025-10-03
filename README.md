# HiveDB

Lightweight, file-based JSON database with typed schemas and simple CRUD.

-   Data is stored under a single root folder (see PATHS) as JSON files per collection.
-   ESM-first (TypeScript module=NodeNext), explicit .js extensions.
-   Strongly-typed schemas and documents.

Links to source:

-   Core: [src/hiveDB.ts](c:\Users\Admin\Desktop\HiveDB\src\hiveDB.ts), [src/database/database.ts](c:\Users\Admin\Desktop\HiveDB\src\database\database.ts), [src/collection/collection.ts](c:\Users\Admin\Desktop\HiveDB\src\collection\collection.ts)
-   Types: [src/types/index.ts](c:\Users\Admin\Desktop\HiveDB\src\types\index.ts)
-   Errors: [src/errors.ts](c:\Users\Admin\Desktop\HiveDB\src\errors.ts)
-   Paths/constants: [src/constants.ts](c:\Users\Admin\Desktop\HiveDB\src\constants.ts)
-   Dev link script: [scripts/stage-link.cjs](c:\Users\Admin\Desktop\HiveDB\scripts\stage-link.cjs)
-   Runtime flow diagram: [md/RuntimeFlow.md](c:\Users\Admin\Desktop\HiveDB\md\RuntimeFlow.md)

## Installation

Build the library:

-   Windows (VS Code terminal):
    -   npm install
    -   npm run build

Use locally (recommended for development):

-   In repo: npm run link:local
-   In consumer project: npm link hivedb

Install packed tarball globally (only dist is installed):

-   In repo: npm run pack:global
-   In consumer project: npm link hivedb

Alternatively, use a file dependency in a consumer:

-   "dependencies": { "hivedb": "file:C:/Users/Admin/Desktop/HiveDB" }

## Quick start

```ts
import { HiveDB } from "hivedb";

// Create or get a database
const db = HiveDB.createDatabase("newdb");

// Define a schema (typed)
const userSchema = HiveDB.createSchema({
    name: { type: "string", required: true },
    password: { type: "string", required: true },
    bio: { type: "string" },
    email: { type: "string" },
});

// Create a collection
const users = db.createCollection("users", userSchema);

// Create a document
const adam = await users.create({
    name: "Adam Ajibade",
    password: "secret",
    email: "adam@example.com",
});

// Queries
const found = await users.findById(adam._id);
const one = await users.findOne({ name: "Adam Ajibade" });
const many = await users.findMany({ email: "adam@example.com" });

// Updates
await users.updateById(adam._id, { bio: "Hello!" });
await users.updateOne({ name: "Adam Ajibade" }, { email: "new@mail.com" });
await users.updateMany({ bio: undefined as any }, { bio: "N/A" });

// Deletes
await users.deleteOne({ email: "new@mail.com" });
await users.deleteMany({ name: "Someone" });
```

More complete example: [src/demo.ts](c:\Users\Admin\Desktop\HiveDB\src\demo.ts)

## How it works

-   Databases

    -   Created via [`HiveDB.createDatabase`](c:\Users\Admin\Desktop\HiveDB\src\hiveDB.ts) and stored under PATHS.allDatabesesFolder as folders.
    -   Each database persists its collections metadata in a per-db JSON file (e.g., data-folder/collections/<db>-collections.json).

-   Collections

    -   Created via [`Database.createCollection`](c:\Users\Admin\Desktop\HiveDB\src\database\database.ts). Each collection is a JSON file in the database folder.
    -   Documents are kept in memory and persisted to disk on mutating operations.

-   Types

    -   Define schemas with [`HiveDB.createSchema`](c:\Users\Admin\Desktop\HiveDB\src\hiveDB.ts).
    -   Available types: `Schema`, `FieldType<S>`, `Document<S>` from [src/types/index.ts](c:\Users\Admin\Desktop\HiveDB\src\types\index.ts).

-   Errors

    -   See [`HiveError`](c:\Users\Admin\Desktop\HiveDB\src\errors.ts) and [`HiveErrorCode`](c:\Users\Admin\Desktop\HiveDB\src\errors.ts).

-   IO helpers

    -   Folder/file safety wrappers in [src/utils/io.ts](c:\Users\Admin\Desktop\HiveDB\src\utils\io.ts).

-   Runtime flow
    -   See sequence diagram: [md/RuntimeFlow.md](c:\Users\Admin\Desktop\HiveDB\md\RuntimeFlow.md)

## Data root and paths

All file paths are anchored to the package root by [src/constants.ts](c:\Users\Admin\Desktop\HiveDB\src\constants.ts):

-   hives/ — per-database folders and collection JSON files
-   data-folder/databases-info.json — list of known databases
-   data-folder/collections/<db>-collections.json — per-db collection metadata

Override the root with an env var:

-   PowerShell (per session): `$env:HIVEDB_ROOT = "C:\Users\Admin\Desktop\HiveDB"`
-   CMD (per session): `set HIVEDB_ROOT=C:\Users\Admin\Desktop\HiveDB`

## ESM and TypeScript

-   tsconfig uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` ([tsconfig.json](c:\Users\Admin\Desktop\HiveDB\tsconfig.json)).
-   All relative imports include the .js extension in source (TypeScript rewrites to .js in dist).
-   Consumers should also be ESM or use a bundler.

## Development workflow

-   One-time link:
    -   In repo: `npm run link:local` (stages .publish/hivedb and runs `npm link`)
    -   In consumer: `npm link hivedb`
-   Live updates:
    -   In repo: `npm run build:watch` (add this script) to recompile on change
    -   The staged package symlinks dist, so rebuilds are reflected automatically.

Helpful scripts:

-   `build` — compile to dist
-   `link:local` — stage minimal package and link globally ([scripts/stage-link.cjs](c:\Users\Admin\Desktop\HiveDB\scripts\stage-link.cjs))
-   `pack:global` — pack and install the tarball globally (dist-only)
-   `unlink:global` — remove global link

## Project structure

```
src/
  collection/
    collection.ts
    collectionHelper.ts
    collectionFindMethods.ts
    collectionDeleteMethods.ts
    collectionUpdateMethods.ts
  database/
    database.ts
    databaseHelper.ts
    databaseCallbacks.ts
  utils/
    io.ts
    exist.ts
    index.ts
  types/
    index.ts
  errors.ts
  hiveDB.ts
  constants.ts
  index.ts
hives/                     # data (per database)
data-folder/               # metadata
dist/                      # compiled output
```

## License

MIT

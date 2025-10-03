# HiveDB

Lightweight, file-based JSON database with typed schemas and simple CRUD.

-   ESM-first (TypeScript: module=NodeNext), explicit .js extensions in source.
-   Strongly-typed schemas and documents via generics.
-   Data stored under a single root (hives and metadata) controlled by PATHS.

Key files:

-   Core: [src/hiveDB.ts](c:\Users\Admin\Desktop\HiveDB\src\hiveDB.ts), [src/database/database.ts](c:\Users\Admin\Desktop\HiveDB\src\database\database.ts), [src/collection/collection.ts](c:\Users\Admin\Desktop\HiveDB\src\collection\collection.ts)
-   Types: [src/types/index.ts](c:\Users\Admin\Desktop\HiveDB\src\types\index.ts)
-   Errors: [src/errors.ts](c:\Users\Admin\Desktop\HiveDB\src\errors.ts)
-   Paths/constants: [src/constants.ts](c:\Users\Admin\Desktop\HiveDB\src\constants.ts)
-   Dev link script: [scripts/stage-link.cjs](c:\Users\Admin\Desktop\HiveDB\scripts\stage-link.cjs)
<!-- -   Runtime flow diagram: [md/RuntimeFlow.md](c:\Users\Admin\Desktop\HiveDB\md\RuntimeFlow.md) -->

## Installation

Build:

-   npm install
-   npm run build

Use locally (recommended for development):

-   In repo: npm run link:local
-   In consumer project: npm link hivedb

Install packed tarball globally (installs only dist):

-   In repo: npm run pack:global
-   In consumer project: npm link hivedb

Alternative (file dependency):

-   Add to consumer package.json: "hivedb": "file:C:/Users/Admin/Desktop/HiveDB"
-   npm install

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

// Create
const adam = await users.create({
    name: "Adam Ajibade",
    password: "",
    email: "adam@example.com",
});

// Read
const found = await users.findById(adam._id);
const one = await users.findOne({ name: "Adam Ajibade" });
const many = await users.findMany({ email: "adam@example.com" });

// Update
await users.updateById(adam._id, { bio: "Hello!" });
await users.updateOne({ name: "Adam Ajibade" }, { email: "new@mail.com" });
await users.updateMany({ bio: undefined as any }, { bio: "N/A" });

// Delete
await users.deleteOne({ email: "new@mail.com" });
await users.deleteMany({ name: "Someone" });
```

## API overview

-   HiveDB ([src/hiveDB.ts](c:\Users\Admin\Desktop\HiveDB\src\hiveDB.ts))
    -   createDatabase(name): Database
    -   createSchema<S extends Schema>(schema: S): S
-   Database ([src/database/database.ts](c:\Users\Admin\Desktop\HiveDB\src\database\database.ts))
    -   createCollection<S>(name, schema): Collection<S>
    -   deleteCollection(name)
    -   deleteDatabase()
-   Collection ([src/collection/collection.ts](c:\Users\Admin\Desktop\HiveDB\src\collection\collection.ts))
    -   create(document)
    -   findById(id), findOne(query), findMany(query?)
    -   updateById(id, update), updateOne(query, update), updateMany(query, update)
    -   deleteById(id), deleteOne(query), deleteMany(query)
    -   deleteCollection()

Types:

-   Schema, FieldType<S>, Document<S> from [src/types/index.ts](c:\Users\Admin\Desktop\HiveDB\src\types\index.ts)
-   Errors via HiveError, HiveErrorCode in [src/errors.ts](c:\Users\Admin\Desktop\HiveDB\src\errors.ts)

## Data root and paths

Paths are centralized in [src/constants.ts](c:\Users\Admin\Desktop\HiveDB\src\constants.ts):

-   hives/ — per-database folders and collection JSON files
-   hivedb-metadata/databases-info.json — list of databases
-   hivedb-metadata/collections/<db>-collections.json — per-db collection metadata

Override the root with an env var:

-   PowerShell: $env:HIVEDB_ROOT = "C:\Users\Admin\Desktop\HiveDB"
-   CMD: set HIVEDB_ROOT=C:\Users\Admin\Desktop\HiveDB

By default, the root resolves to the package install directory.

## ESM and TypeScript

-   tsconfig: "module": "NodeNext", "moduleResolution": "NodeNext" ([tsconfig.json](c:\Users\Admin\Desktop\HiveDB\tsconfig.json))
-   All relative imports in src include .js extension so runtime ESM works after build.
-   Consumers should use ESM or a bundler.

## Development workflow

-   One-time link:
    -   In repo: npm run link:local (stages .publish/hivedb and runs npm link)
    -   In consumer: npm link hivedb
-   Rebuild on changes:
    -   Run: npx tsc -w -p tsconfig.json
    -   The staged package links dist, so rebuilds reflect automatically.

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
hives/                      # data (per database)
hivedb-metadata/            # metadata
dist/                       # compiled output
scripts/stage-link.cjs      # local link staging script
```

## License

MIT

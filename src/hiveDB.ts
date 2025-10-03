import Database from "./database/database.js";
import fsSync from "fs";
import fs from "fs/promises";
import { handleFileIO, handleFolderIO } from "./utils/io.js";
import path from "path";
import { HiveError, HiveErrorCode } from "./errors.js";
import { checkFolderOrFileExistSync } from "./utils/exist.js";
import { PATHS } from "./constants.js";
import { Schema } from "./types/index.js";

const HiveDB = {
    databases: [] as Database[],
    processDatabasesName: new Set<string>(), // To avoid creating database twice in a process

    async saveDatabasesInfoToFile(name: string) {
        // Save all databases info to a json file
        const datasetsInfo = JSON.stringify(
            this.databases?.map((db) => ({
                name: db.name,
            })) || "[]",
            null,
            2
        );

        await handleFileIO(
            `Error saving database info during "${name}" database operation`,
            async () => {
                await fs.writeFile(PATHS.databaseInfoPath, datasetsInfo);
            }
        );
    },

    createHivesFolder() {
        const isFolderExist = checkFolderOrFileExistSync(
            PATHS.allDatabesesFolder
        );
        if (!isFolderExist)
            handleFolderIO(
                `Error creating hiveDB hives folder during`,

                async () => {
                    fsSync.mkdirSync(PATHS.allDatabesesFolder, {
                        recursive: true,
                    });
                }
            );
    },

    loadDatabasesInfoFromFile() {
        const isFolderExist = checkFolderOrFileExistSync(
            PATHS.hiveDBDataFolder
        );
        if (!isFolderExist)
            handleFolderIO(
                `Error creating hiveDB data folder during`,
                async () => {
                    // Create hivedb-metadata folder if it doesn't exist
                    fsSync.mkdirSync(
                        path.join(PATHS.hiveDBDataFolder, "collections"),
                        { recursive: true }
                    );
                    // Create hives (databases folder) folder if it doesn't exist
                    fsSync.mkdirSync(PATHS.allDatabesesFolder, {
                        recursive: true,
                    });
                }
            );

        if (checkFolderOrFileExistSync(PATHS.databaseInfoPath)) {
            const data = fsSync.readFileSync(PATHS.databaseInfoPath, "utf8");
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    this.databases = parsed.map((db: { name: string }) => {
                        const d = new Database(db.name);
                        d.init();
                        return d;
                    });
                    console.log(this.databases.length, "databases loaded.");
                    //   this.databases.forEach((db) => db.init());
                }
            } catch {
                this.databases = [];
            }
        }
    },

    createDatabase(name: string) {
        // To avoid creating database twice in a process
        if (this.processDatabasesName.has(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_DATABASE_EXISTS,
                `Database with name "${name}" already exists.`
            );
        }

        const newDatabase = new Database(name);
        newDatabase.init();

        // Check if the database already exists before adding it to the in-memory databases array.
        // databases might already be loaded from disk; skip duplicates instead of creating them again.
        // Do not throw here, createdatabase is also used to return an existing database.

        if (!this.databases.find((db) => db.name === name)) {
            this.databases.push(newDatabase);
            this.processDatabasesName.add(name);

            this.saveDatabasesInfoToFile(name);
        }

        return newDatabase;
    },

    //To provide type safety when defining schema
    createSchema<S extends Schema>(schema: S) {
        return schema;
    },
};

HiveDB.createHivesFolder();
HiveDB.loadDatabasesInfoFromFile();

export default HiveDB;

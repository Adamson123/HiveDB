import Database from "./database/database.js";
import fsSync from "fs";
import fs from "fs/promises";
import { handleFileIO, handleFolderIO } from "./utils/io.js";
import path from "path";
import { HiveError, HiveErrorCode } from "./errors.js";
import { checkFolderOrFileExistSync } from "./utils/exist.js";
import { fileURLToPath } from "url"; // ADD

// Resolve package root (dist -> package root at runtime), allow env override
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");
const HIVE_ROOT =
    process.env.HIVEDB_ROOT && process.env.HIVEDB_ROOT.trim()
        ? path.resolve(process.env.HIVEDB_ROOT)
        : PACKAGE_ROOT;

const HiveDB = {
    databases: [] as Database[],
    allDatabesesFolder: path.join(HIVE_ROOT, "hives"),
    hiveDB_data_folder: path.join(HIVE_ROOT, "data-folder"),
    databaseInfoPath: path.join(
        HIVE_ROOT,
        "data-folder",
        "databases-info.json"
    ),
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
                await fs.writeFile(this.databaseInfoPath, datasetsInfo);
            }
        );
    },

    createHivesFolder() {
        const isFolderExist = checkFolderOrFileExistSync(
            HiveDB.allDatabesesFolder
        );
        if (!isFolderExist)
            handleFolderIO(
                `Error creating hiveDB hives folder during`,

                async () => {
                    fsSync.mkdirSync(HiveDB.allDatabesesFolder, {
                        recursive: true,
                    });
                }
            );
    },
    loadDatabasesInfoFromFile() {
        const isFolderExist = checkFolderOrFileExistSync(
            HiveDB.hiveDB_data_folder
        );
        if (!isFolderExist)
            handleFolderIO(
                `Error creating hiveDB data folder during`,
                async () => {
                    fsSync.mkdirSync(HiveDB.hiveDB_data_folder, {
                        recursive: true,
                    });
                    fsSync.mkdirSync(
                        path.join(HiveDB.hiveDB_data_folder, "collections"),
                        { recursive: true }
                    );
                    fsSync.mkdirSync(HiveDB.allDatabesesFolder, {
                        recursive: true,
                    });
                }
            );

        if (fsSync.existsSync(this.databaseInfoPath)) {
            const data = fsSync.readFileSync(this.databaseInfoPath, "utf8");
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) {
                    this.databases = parsed.map(
                        (db: { name: string }) => new Database(db.name)
                    );
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

        // Avoid creating database with same name in a process
        if (this.databases.find((db) => db.name === name)) {
            throw new Error(`Database with name "${name}" already exists.`);
        }

        this.databases.push(newDatabase);
        this.processDatabasesName.add(name);

        this.saveDatabasesInfoToFile(name);

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

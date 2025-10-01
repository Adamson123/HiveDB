import Database from "./database/database";
import fsSync from "fs";
import fs from "fs/promises";
import { handleFileIO, handleFolderIO } from "./utils/io";
import path from "path";
import { HiveError, HiveErrorCode } from "./errors";
import { checkFolderOrFileExistSync } from "./utils/exist";

const HiveDB = {
    databases: [] as Database[],
    hiveDB_data_folder: "./data-folder",
    databaseInfoPath: path.join("data-folder", "databases-info.json"),
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

    loadDatabasesInfoFromFile() {
        const isFolderExist = checkFolderOrFileExistSync(
            HiveDB.hiveDB_data_folder
        );
        if (!isFolderExist)
            handleFolderIO(
                `Error creating hiveDB data folder during`,
                async () => {
                    fsSync.mkdirSync(HiveDB.hiveDB_data_folder);
                    fsSync.mkdirSync(
                        path.join(HiveDB.hiveDB_data_folder, "collections")
                    );
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

        this.saveDatabasesInfoToFile(this.name);

        return newDatabase;
    },
};

HiveDB.loadDatabasesInfoFromFile();

export default HiveDB;

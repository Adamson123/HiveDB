import fs from "fs/promises";
import fsSync from "fs";
import { HiveError, HiveErrorCode } from "../errors";
import { validateName } from "../utils";
import {
    checkFolderOrFileExist,
    checkFolderOrFileExistSync,
} from "../utils/exist";
import { handleFileIO, handleFileIOSync } from "../utils/io";
import Database from "./database";
import DatabaseCallbacks from "./databaseCallbacks";

export default class DatabaseHelper {
    database: Database;
    private callbacks: DatabaseCallbacks;

    constructor(database: Database) {
        this.database = database;
        this.callbacks = new DatabaseCallbacks(database);
    }

    validateDatabaseName(name: string) {
        if (validateName(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_INVALID_DATABASE_NAME,
                `Database name '${name}' is invalid.`
            );
        }
    }

    // Synchronous version of saveCollectionsInfoToFile
    saveCollectionsInfoToFileSync() {
        this.callbacks.saveCollectionsInfoToFileFunc((collectionsInfo) => {
            handleFileIO(
                `Error saving collections info during "${this.database.name}" database operation`,
                () => {
                    fsSync.writeFileSync(
                        this.database.collectionsInfoPath,
                        collectionsInfo
                    );
                }
            );
        });
    }

    // Asynchronous version of saveCollectionsInfoToFile
    async saveCollectionsInfoToFile() {
        this.callbacks.saveCollectionsInfoToFileFunc(
            async (collectionsInfo) => {
                await handleFileIO(
                    `Error saving collections info during "${this.database.name}" database operation`,
                    async () => {
                        await fs.writeFile(
                            this.database.collectionsInfoPath,
                            collectionsInfo
                        );
                    }
                );
            }
        );
    }

    //TODO
    getCollectionsInfoFromFile() {
        const isCollectionsInfoFileExist = checkFolderOrFileExistSync(
            this.database.collectionsInfoPath
        );

        if (isCollectionsInfoFileExist) {
            const data = handleFileIOSync(
                `Error getting collections info during "${this.database.name}" database operation`,
                () => {
                    return fsSync.readFileSync(
                        this.database.collectionsInfoPath,
                        "utf8"
                    );
                }
            );
            try {
                return JSON.parse(data);
            } catch {
                return [];
            }
        }

        return [];
    }
}

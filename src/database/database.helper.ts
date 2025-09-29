import fs from "fs/promises";
import { HiveError, HiveErrorCode } from "../errors";
import { validateName } from "../utils";
import { checkFolderOrFileExist } from "../utils/exist";
import { handleFileIO, handleFolderIO } from "../utils/io";
import Database from "./Database";
import HiveDB from "../hiveDB";

export default class DatabaseHelper {
    database: Database;

    constructor(database: Database) {
        this.database = database;
    }

    validateDatabaseName(name: string) {
        if (validateName(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_INVALID_DATABASE_NAME,
                `Database name '${name}' is invalid.`
            );
        }
    }

    async saveCollectionsInfoToFile() {
        //Save collections info to a json file
        const collectionsInfo = JSON.stringify(
            this.database.collections?.map((col) => ({
                name: col.name,
                schema: col.schema,
            })) || "[]",
            null,
            2
        );
        await handleFileIO(
            `Error saving collections info during "${this.database.name}" database operation`,
            async () => {
                fs.writeFile(
                    this.database.collectionsInfoPath,
                    collectionsInfo
                );
            }
        );
    }

    //TODO
    async getCollectionsInfoFromFile() {
        const isCollectionsInfoFileExist = await checkFolderOrFileExist(
            this.database.collectionsInfoPath
        );

        if (isCollectionsInfoFileExist) {
            const data = await handleFileIO(
                `Error getting collections info during "${this.database.name}" database operation`,
                async () => {
                    return fs.readFile(
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

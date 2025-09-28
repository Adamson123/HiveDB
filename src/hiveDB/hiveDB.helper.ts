import fs from "fs/promises";
import { HiveError, HiveErrorCode } from "../errors";
import { validateName } from "../utils";
import { checkFolderOrFileExist } from "../utils/exist";
import { handleFileIO, handleFolderIO } from "../utils/io";
import HiveDB from "./hiveDB";

export default class HiveDB_Helper {
    hiveDB: HiveDB;

    constructor(hiveDB: HiveDB) {
        this.hiveDB = hiveDB;
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
        const isFolderExist = await checkFolderOrFileExist(
            this.hiveDB.hiveDB_data_folder
        );
        if (!isFolderExist)
            await handleFolderIO(
                `Error creating hiveDB data folder during "${this.hiveDB.name}" database operation`,
                async () => {
                    await fs.mkdir(this.hiveDB.hiveDB_data_folder);
                }
            );
        //Save collections info to a json file
        const collectionsInfo = JSON.stringify(
            this.hiveDB.collections?.map((col) => ({
                name: col.name,
                schema: col.schema,
            })) || "[]",
            null,
            2
        );
        await handleFileIO(
            `Error saving collections info during "${this.hiveDB.name}" database operation`,
            async () => {
                fs.writeFile(this.hiveDB.collectionsInfoPath, collectionsInfo);
            }
        );
    }

    async getCollectionsInfoFromFile() {
        const isCollectionsInfoFileExist = await checkFolderOrFileExist(
            this.hiveDB.collectionsInfoPath
        );

        if (isCollectionsInfoFileExist) {
            const data = await handleFileIO(
                `Error getting collections info during "${this.hiveDB.name}" database operation`,
                async () => {
                    return fs.readFile(this.hiveDB.collectionsInfoPath, "utf8");
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

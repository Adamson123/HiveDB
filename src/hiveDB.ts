import path from "path";
import { allDatabesesFolder, validateName } from "./global";
import { checkFolderOrFileExist, handleFileIO, handleFolderIO } from "./utils";
import fs from "fs/promises";
import Collection, { Schema } from "./collection";
import { HiveError, HiveErrorCode } from "./errors";

export default class HiveDB {
    name: string;
    folderPath: string;
    private hiveDB_data_folder: string = "./data_folder";
    private collectionsInfoPath: string = path.join(
        this.hiveDB_data_folder,
        "collectionsData.json"
    );
    collections: Collection<any>[] = [];
    processCollectionsName: Set<string> = new Set();

    constructor(name: string) {
        this.validateDatabaseName(name);
        this.name = name;
        this.folderPath = path.join(allDatabesesFolder, this.name);
    }

    private validateDatabaseName(name: string) {
        if (validateName(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_INVALID_DATABASE_NAME,
                `Database name '${name}' is invalid.`
            );
        }
    }

    async deleteDatabase() {
        const isFolderExist = await checkFolderOrFileExist(this.folderPath);
        if (isFolderExist)
            await handleFolderIO(
                `Error deleting database "${this.name}"`,
                async () => {
                    await fs.rm(this.folderPath, {
                        recursive: true,
                        force: true,
                    });
                }
            );
    }

    async init() {
        const isFolderExist = await checkFolderOrFileExist(this.folderPath);
        if (!isFolderExist) {
            await handleFolderIO(
                `Error creating database "${this.name}"`,
                async () => {
                    await fs.mkdir(this.folderPath);
                }
            );
        }
        const collectionsInfo = await this.getCollectionsInfoFromFile();

        if (collectionsInfo && collectionsInfo.length) {
            this.collections = collectionsInfo.map(
                (col) => new Collection(col.name, col.schema, this)
            );
        }
    }

    async saveCollectionsInfoToFile() {
        const isFolderExist = await checkFolderOrFileExist(
            this.hiveDB_data_folder
        );
        if (!isFolderExist)
            await handleFolderIO(
                `Error creating hiveDB data folder during "${this.name}" database operation`,
                async () => {
                    await fs.mkdir(this.hiveDB_data_folder);
                }
            );
        //Save collections info to a json file
        const collectionsInfo = JSON.stringify(
            this.collections?.map((col) => ({
                name: col.name,
                schema: col.schema,
            })) || "[]",
            null,
            2
        );
        await handleFileIO(
            `Error saving collections info during "${this.name}" database operation`,
            async () => {
                fs.writeFile(this.collectionsInfoPath, collectionsInfo);
            }
        );
    }

    async getCollectionsInfoFromFile() {
        const isCollectionsInfoFileExist = await checkFolderOrFileExist(
            this.collectionsInfoPath
        );

        if (isCollectionsInfoFileExist) {
            const data = await handleFileIO(
                `Error getting collections info during "${this.name}" database operation`,
                async () => {
                    return fs.readFile(this.collectionsInfoPath, "utf8");
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

    async createCollection<S extends Schema>(name: string, schema: S) {
        //Throw Error for trying to create a collection twice in a process

        if (this.processCollectionsName.has(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_COLLECTION_EXISTS,
                `Collection with name "${name}" already exist`
            );
        }

        const newCollection = new Collection<S>(name, schema, this);
        const justCreatingCollection = await newCollection.init();

        //If just creating collection file
        if (justCreatingCollection) {
            this.collections.push(newCollection);
            await this.saveCollectionsInfoToFile();
        }
        this.processCollectionsName.add(name);

        return newCollection;
    }

    async deleteCollection(name: string) {
        const collectionToDelete = this.collections?.find(
            (col) => col.name === name
        );
        await collectionToDelete?.deleteCollection();
        this.collections = this.collections?.filter((col) => col.name !== name);
        this.saveCollectionsInfoToFile();
        // console.log(collectionToDelete);
    }

    //To provide type safety when defining schema
    CreateSchema<S extends Schema>(schema: S) {
        return schema;
    }
}

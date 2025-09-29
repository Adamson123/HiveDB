import path from "path";
import { allDatabesesFolder } from "../global";
import { checkFolderOrFileExist } from "../utils/exist";
import fs from "fs/promises";
import Collection, { Schema } from "../collection/collection";
import { HiveError, HiveErrorCode } from "../errors";
import { handleFolderIO } from "../utils/io";
import HiveDB_Helper from "./hiveDB.helper";

export default class HiveDB {
    name: string;
    folderPath: string;
    hiveDB_data_folder: string = "./data_folder";
    collectionsInfoPath: string;
    // All collections in a database
    collections: Collection<any>[] = [];
    // To avoid creating collection twice in a process
    processCollectionsName: Set<string> = new Set();
    helper: HiveDB_Helper = new HiveDB_Helper(this);

    constructor(name: string) {
        this.helper.validateDatabaseName(name);
        this.name = name;
        this.collectionsInfoPath = path.join(
            this.hiveDB_data_folder,
            this.name + "_collections.json"
        );
        this.folderPath = path.join(allDatabesesFolder, this.name);
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
        const collectionsInfo = await this.helper.getCollectionsInfoFromFile();

        if (collectionsInfo && collectionsInfo.length) {
            this.collections = collectionsInfo.map(
                (col) => new Collection(col.name, col.schema, this)
            );
        }
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
        await newCollection.init();

        //Cheecking if collection already exist
        const isAlreadyExistInCollection = this.collections.find(
            (col) => col.name === name
        );
        if (!isAlreadyExistInCollection) {
            this.collections.push(newCollection);
            await this.helper.saveCollectionsInfoToFile();
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
        this.helper.saveCollectionsInfoToFile();
        // console.log(collectionToDelete);
    }

    //To provide type safety when defining schema
    CreateSchema<S extends Schema>(schema: S) {
        return schema;
    }
}

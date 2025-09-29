import path from "path";
import { allDatabesesFolder } from "../global";
import { checkFolderOrFileExist } from "../utils/exist";
import fs from "fs/promises";
import Collection, { Schema } from "../collection/collection";
import { HiveError, HiveErrorCode } from "../errors";
import { handleFolderIO } from "../utils/io";
import DatabaseHelper from "./database.helper";
import HiveDB from "../hiveDB";

export default class Database {
    name: string;
    folderPath: string;
    // hiveDB: typeof HiveDB;
    // hiveDB_data_folder: string = "./data_folder";
    collectionsInfoPath: string;
    // All collections in a database
    collections: Collection<any>[] = [];
    // To avoid creating collection twice in a process
    processCollectionsName: Set<string> = new Set();
    helper: DatabaseHelper = new DatabaseHelper(this);

    constructor(name: string) {
        this.helper.validateDatabaseName(name);
        this.name = name;
        this.collectionsInfoPath = path.join(
            HiveDB.hiveDB_data_folder,
            "collections",
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

        //Load collections info from collectionsInfoPath
        const collectionsInfo = await this.helper.getCollectionsInfoFromFile();

        //Initialize collections from collectionsInfo
        if (collectionsInfo && collectionsInfo.length) {
            this.collections = collectionsInfo.map(
                (col) => new Collection(col.name, col.schema, this)
            );
        }

        await HiveDB.saveDatabasesInfoToFile(this.name);
    }

    async createCollection<S extends Schema>(name: string, schema: S) {
        //Throw Error if collection with same name is being created in a process
        if (this.processCollectionsName.has(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_COLLECTION_EXISTS,
                `Collection with name "${name}" already exist`
            );
        }

        const newCollection = new Collection<S>(name, schema, this);
        await newCollection.init();

        //Checking if collection already exist before pushing to collections array
        // This is to avoid creating collection, as this collections include collections from file also, so if collection already exist in file, it will not push again
        //It won't make sense to throw error here, as user may want to get existing collection also using createCollection method

        if (!this.collections.find((col) => col.name === name)) {
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

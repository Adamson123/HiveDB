import path from "path";
//import { allDatabesesFolder } from "../constants.js";
import {
    checkFolderOrFileExist,
    checkFolderOrFileExistSync,
} from "../utils/exist.js";
import fs from "fs/promises";
import fsSync from "fs";
import Collection from "../collection/collection.js";
import { HiveError, HiveErrorCode } from "../errors.js";
import { handleFolderIO } from "../utils/io.js";
import DatabaseHelper from "./databaseHelper.js";
import { PATHS } from "../constants.js";
import { Schema } from "../types/index.js";

export default class Database {
    name: string;
    folderPath: string;
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
            PATHS.collectionsFolder,
            this.name + "-collections.json"
        );
        this.folderPath = path.join(PATHS.allDatabesesFolder, this.name);
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

    init() {
        const isFolderExist = checkFolderOrFileExistSync(this.folderPath);
        if (!isFolderExist) {
            handleFolderIO(`Error creating database "${this.name}"`, () => {
                fsSync.mkdirSync(this.folderPath);
            });
        }

        //Load collections info from collectionsInfoPath
        const collectionsInfo = this.helper.getCollectionsInfoFromFile();

        //Initialize collections from collectionsInfo
        if (collectionsInfo && collectionsInfo.length) {
            this.collections = collectionsInfo.map((col: any) => {
                const c = new Collection(col.name, col.schema, this);
                c.init(); // ensure documents are loaded
                return c;
            });
        }
    }

    createCollection<S extends Schema>(name: string, schema: S) {
        //Throw Error if collection with same name is being created in a process
        if (this.processCollectionsName.has(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_COLLECTION_EXISTS,
                `Collection with name "${name}" already exist`
            );
        }

        const newCollection = new Collection<S>(name, schema, this);
        newCollection.init();

        //Checking if collection already exist before pushing to collections array
        // This is to avoid creating collection, as this collections include collections from file also, so if collection already exist in file, it will not push again
        //It won't make sense to throw error here, as user may want to get existing collection also using createCollection method

        if (!this.collections.find((col) => col.name === name)) {
            this.collections.push(newCollection);
            this.helper.saveCollectionsInfoToFileSync();
        }

        this.processCollectionsName.add(name);

        return newCollection;
    }

    async deleteCollection(name: string) {
        const collectionToDelete = this.collections?.find(
            (col) => col.name === name
        );

        if (!collectionToDelete)
            throw new HiveError(
                HiveErrorCode.ERR_COLLECTION_NOT_FOUND,
                `The collection "${name}" does not exist `
            );

        await collectionToDelete?.deleteCollection();
        this.collections = this.collections?.filter((col) => col.name !== name);
        this.processCollectionsName.delete(name);

        //Update collections info file after deleting collection
        await this.helper.saveCollectionsInfoToFile();
    }
}

import path from "path";
import { allDatabesesFolder } from "./global";
import { checkFolderOrFileExist } from "./utils";
import fs from "fs/promises";
import Collection, { Schema } from "./collection";

export default class HiveDB {
    name: string;
    folderPath: string;
    private hiveDB_data_folder: string = "./data_folder";
    private collectionsInfoPath: string = path.join(
        this.hiveDB_data_folder,
        "collectionsData.json"
    );
    collections: Collection<any>[] = [];

    constructor(name: string) {
        this.name = name;
        this.folderPath = path.join(allDatabesesFolder, this.name);
    }

    async deleteDatabase() {
        const isFolderExist = await checkFolderOrFileExist(this.folderPath);
        if (isFolderExist)
            await fs.rm(this.folderPath, { recursive: true, force: true });
    }

    async init() {
        const isFolderExist = await checkFolderOrFileExist(this.folderPath);
        if (!isFolderExist) {
            await fs.mkdir(this.folderPath);
        }
        const collectionsInfo = await this.getCollectionsInfoFromFile();
        //  console.log(collectionsInfo, collectionsInfo.length);

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
        if (!isFolderExist) await fs.mkdir(this.hiveDB_data_folder);
        //Save collections info to a json file
        await fs.writeFile(
            this.collectionsInfoPath,
            JSON.stringify(
                this.collections?.map((col) => ({
                    name: col.name,
                    schema: col.schema,
                })) || "[]",
                null,
                2
            )
        );
    }

    async getCollectionsInfoFromFile() {
        const isCollectionFileExist = await checkFolderOrFileExist(
            this.collectionsInfoPath
        );

        if (isCollectionFileExist) {
            const data = await fs.readFile(this.collectionsInfoPath, "utf8");
            try {
                return JSON.parse(data);
            } catch {
                return [];
            }
        }

        return [];
    }

    async createCollection<S extends Schema>(name: string, schema: S) {
        const newCollection = new Collection<S>(name, schema, this);
        const justCreatingCollection = await newCollection.init();

        //If just creating collection file
        if (justCreatingCollection) {
            console.log({ justCreatingCollection });

            this.collections.push(newCollection);
            this.saveCollectionsInfoToFile();
        }
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
}

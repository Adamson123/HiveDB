import Database from "./database.js";

// Methods thats takes a callback function as parameter
export default class DatabaseCallbacks {
    database: Database;
    constructor(database: Database) {
        this.database = database;
    }

    saveCollectionsInfoToFileFunc(callback: (param: string) => void) {
        // Save collections info to a json file
        const collectionsInfo = JSON.stringify(
            this.database.collections?.map((col) => ({
                name: col.name,
                schema: col.schema,
            })) ?? [],
            null,
            2
        );
        callback(collectionsInfo);
    }
}

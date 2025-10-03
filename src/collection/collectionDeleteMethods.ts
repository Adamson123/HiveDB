import { Document, Schema } from "../types/index.js";
import Collection from "./collection.js";
import CollectionHelper from "./collectionHelper.js";

export default class CollectionDeleteMethods<S extends Schema> {
    collection: Collection<S>;
    helper: CollectionHelper<S>;

    constructor(collection: Collection<S>) {
        this.collection = collection;
        this.helper = collection.helper;
    }

    async deleteById(_id: string) {
        this.collection.documents = this.collection.documents.filter(
            (doc) => doc._id !== _id
        );
        await this.helper.saveDocumentsToFile();
    }

    async deleteOne(query: Partial<Document<S>>) {
        if (!this.helper.objectNotEmpty(query)) return;

        const keys = Object.keys(query);

        this.collection.documents = this.collection.documents.filter(
            (doc) =>
                !keys.every((key) => (doc as any)[key] === (query as any)[key])
        );
        await this.helper.saveDocumentsToFile();
    }

    async deleteMany(query: Partial<Document<S>>) {
        if (!this.helper.objectNotEmpty(query)) return;

        const keys = Object.keys(query);

        if (keys.length === 0) {
            // delete all
            this.collection.documents = [];
        } else {
            // keep docs that DO NOT fully match the query
            this.collection.documents = this.collection.documents.filter(
                (doc) =>
                    keys.some(
                        (key) => (doc as any)[key] !== (query as any)[key]
                    )
            );
        }
        await this.helper.saveDocumentsToFile();
    }
}

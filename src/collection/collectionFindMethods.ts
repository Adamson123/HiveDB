import { Document, Schema } from "../types/index.js";
import Collection from "./collection.js";

export default class CollectionFindMethods<S extends Schema> {
    collection: Collection<S>;

    constructor(collection: Collection<S>) {
        this.collection = collection;
    }

    async findById(_id: string): Promise<Document<S> | undefined> {
        return this.collection.documents.find((doc) => doc._id === _id);
    }

    async findOne(query: Partial<Document<S>>): Promise<Document<S>> {
        const keys = Object.keys(query);
        return this.collection.documents.find((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        ) as Document<S>;
    }

    async findMany(query?: Partial<Document<S>>): Promise<Document<S>[]> {
        if (!query || Object.keys(query).length === 0)
            return this.collection.documents;

        const keys = Object.keys(query);
        return this.collection.documents.filter((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        );
    }
}

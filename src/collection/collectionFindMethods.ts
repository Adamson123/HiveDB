import CollectionHelper from "./collectionHelper.js";

export default class CollectionFindMethods<S extends Schema> {
    documents: Doc<S>[];

    constructor(documents: Doc<S>[]) {
        this.documents = documents;
    }

    async findById(_id: string): Promise<Doc<S> | undefined> {
        return this.documents.find((doc) => doc._id === _id);
    }

    async find(query?: Partial<Doc<S>>): Promise<Doc<S>[]> {
        if (!query || Object.keys(query).length === 0) return this.documents;

        const keys = Object.keys(query);
        return this.documents.filter((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        );
    }

    async findOne(query: Partial<Doc<S>>): Promise<Doc<S>> {
        const keys = Object.keys(query);
        return this.documents.find((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        ) as Doc<S>;
    }
}

import CollectionHelper from "./collectionHelper.js";

export default class CollectionDeleteMethods<S extends Schema> {
    documents: Doc<S>[];
    helper: CollectionHelper<S>;

    constructor(documents: Doc<S>[], helper: CollectionHelper<S>) {
        this.documents = documents;
        this.helper = helper;
    }

    async deleteById(_id: string) {
        this.documents = this.documents.filter((doc) => doc._id !== _id);
        await this.helper.saveDocumentsToFile();
    }

    async deleteOne(query: Partial<Doc<S>>) {
        if (!this.helper.objectNotEmpty(query)) return;

        const keys = Object.keys(query);

        this.documents = this.documents.filter(
            (doc) =>
                !keys.every((key) => (doc as any)[key] === (query as any)[key])
        );
        await this.helper.saveDocumentsToFile();
    }

    async deleteMany(query: Partial<Doc<S>>) {
        if (!this.helper.objectNotEmpty(query)) return;

        const keys = Object.keys(query);

        if (keys.length === 0) {
            // delete all
            this.documents = [];
        } else {
            // keep docs that DO NOT fully match the query
            this.documents = this.documents.filter((doc) =>
                keys.some((key) => (doc as any)[key] !== (query as any)[key])
            );
        }
        await this.helper.saveDocumentsToFile();
    }
}

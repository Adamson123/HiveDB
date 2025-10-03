import { Document, Schema } from "../types/index.js";
import Collection from "./collection.js";
import CollectionHelper from "./collectionHelper.js";

export default class CollectionUpdateMethods<S extends Schema> {
    collection: Collection<S>;
    helper: CollectionHelper<S>;

    constructor(collection: Collection<S>) {
        this.collection = collection;
        this.helper = collection.helper;
    }

    async updateById(_id: string, update: Partial<Document<S>>) {
        let docToUpdate = this.collection.documents.find(
            (doc) => doc._id === _id
        );

        // If document not found, return undefined
        if (!docToUpdate) {
            return;
        }

        // If update object is empty, return the original document
        if (!this.helper.objectNotEmpty(update)) {
            return docToUpdate;
        }

        const trimmedUpdate = this.helper.removeKeysNotDefinedInSchema(update);
        this.helper.validateFieldTypes(trimmedUpdate);

        docToUpdate = { ...docToUpdate, ...(trimmedUpdate as any) };

        this.collection.documents = this.collection.documents.map((doc) =>
            doc._id === _id ? docToUpdate! : doc
        );
        await this.helper.saveDocumentsToFile();

        return docToUpdate;
    }

    async updateOne(query: Partial<Document<S>>, update: Partial<Document<S>>) {
        // Check if query is empty
        if (!this.helper.objectNotEmpty(query)) return;

        const keys = Object.keys(query);
        let docToUpdate = this.collection.documents.find((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        );

        // If document not found, return undefined
        if (!docToUpdate) {
            return;
        }

        // If update object is empty, return the original document
        if (!this.helper.objectNotEmpty(update)) {
            return docToUpdate;
        }

        const trimmedUpdate = this.helper.removeKeysNotDefinedInSchema(update);
        this.helper.validateFieldTypes(trimmedUpdate);

        docToUpdate = { ...docToUpdate, ...(trimmedUpdate as any) };

        this.collection.documents = this.collection.documents.map((doc) =>
            doc._id === docToUpdate!._id ? docToUpdate! : doc
        );
        await this.helper.saveDocumentsToFile();

        return docToUpdate;
    }

    async updateMany(
        query: Partial<Document<S>>,
        update: Partial<Document<S>>
    ) {
        // Check if query is empty
        if (!this.helper.objectNotEmpty(query)) return;

        // If update object is empty, return all original documents
        if (!this.helper.objectNotEmpty(update)) {
            return this.collection.documents;
        }

        const trimmedUpdate = this.helper.removeKeysNotDefinedInSchema(update);
        this.helper.validateFieldTypes(trimmedUpdate);

        let updatedDocuments: Document<S>[] = [];

        const keys = Object.keys(query);
        this.collection.documents = this.collection.documents.map((doc) => {
            if (
                keys.every((key) => (doc as any)[key] === (query as any)[key])
            ) {
                const updatedDoc = { ...doc, ...(trimmedUpdate as any) };
                updatedDocuments.push(updatedDoc);
                return updatedDoc;
            }
            return doc;
        });

        await this.helper.saveDocumentsToFile();

        return updatedDocuments;
    }
}

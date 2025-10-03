import fs from "fs/promises";
//import fsSync from "fs";
import Database from "../database/database.js";
import path from "path";
import { v4 as uuid } from "uuid";
import { handleFileIO } from "../utils/io.js";
import {
    checkFolderOrFileExist,
    checkFolderOrFileExistSync,
} from "../utils/exist.js";
import CollectionHelper from "./collectionHelper.js";
import CollectionDeleteMethods from "./collectionDeleteMethods.js";
import CollectionFindMethods from "./collectionFindMethods.js";
import { HiveError, HiveErrorCode } from "../errors.js";
import CollectionUpdateMethods from "./collectionUpdateMethods.js";

export default class Collection<S extends Schema> {
    name: string;
    //for future collection relationship
    #database: Database;
    filePath: string;
    schema: S;
    documents: Doc<S>[] = [];
    isInit: boolean = false;
    helper: CollectionHelper<S> = new CollectionHelper(this);
    private deleteMethods: CollectionDeleteMethods<S> =
        new CollectionDeleteMethods<S>(this);
    private findMethods = new CollectionFindMethods<S>(this);
    private updateMethods: CollectionUpdateMethods<S> =
        new CollectionUpdateMethods<S>(this);

    constructor(name: string, schema: S, database: Database) {
        this.helper.validateCollectionName(name);
        this.name = name;
        this.schema = schema;
        this.#database = database;
        this.filePath = path.join(database.folderPath, name + ".json");
    }

    init() {
        if (this.isInit) return;
        const isFileExist = checkFolderOrFileExistSync(this.filePath); //true

        if (!isFileExist) {
            this.helper.createCollectionFile();
            this.documents = [];
        }

        this.documents = this.helper.getDocumentsFromFile();
        this.isInit = true;
    }

    async deleteCollection() {
        const isFileExist = await checkFolderOrFileExist(this.filePath);

        if (isFileExist)
            await handleFileIO(
                `Error deleting collection "${this.name}"`,
                async () => {
                    //console.log("Deleting collection file:", this.filePath);
                    await fs.unlink(this.filePath);
                    this.documents = [];
                }
            );
    }

    /**
     * Create a new document in the collection
     * @param document The document to create
     * @returns The created document with a unique _id
     */
    async create(document: FieldType<S>): Promise<Doc<S>> {
        if (!document)
            throw new HiveError(
                HiveErrorCode.ERR_UNDEFINED_DOCUMENT,
                "Document cannot be undefined"
            );

        const trimmedDocument =
            this.helper.removeKeysNotDefinedInSchema(document);

        this.helper.validateRequiredFields(trimmedDocument);
        this.helper.validateFieldTypes(trimmedDocument);

        const newDocument: Doc<S> = {
            _id: uuid(),
            ...(trimmedDocument as any),
        };
        this.documents.push(newDocument);

        await this.helper.saveDocumentsToFile();
        return newDocument;
    }

    // Delete methods

    /**
     * Update a document by its ID
     * @param _id The ID of the document to update
     * @returns void
     */
    async deleteById(_id: string) {
        return await this.deleteMethods.deleteById(_id);
    }

    /**
     * Delete a single document matching the query
     * @param query The query to match the document for deletion
     * @returns void
     */
    async deleteOne(query: Partial<Doc<S>>) {
        return await this.deleteMethods.deleteOne(query);
    }

    /**
     * Delete multiple documents matching the query
     * @param query The query to match documents for deletion
     * @returns void
     */
    async deleteMany(query: Partial<Doc<S>>) {
        return await this.deleteMethods.deleteMany(query);
    }

    // Find methods

    /**
     * Find a document by its ID
     * @param _id The ID of the document to find
     * @returns The found document or undefined if not found
     * */
    async findById(_id: string): Promise<Doc<S> | undefined> {
        return await this.findMethods.findById(_id);
    }

    /**
     *  Find a single document matching the query
     * @param query The query to match the document
     * @returns The found document or undefined if not found
     * */
    async findOne(query: Partial<Doc<S>>): Promise<Doc<S>> {
        return await this.findMethods.findOne(query);
    }

    /**
     * Find multiple documents matching the query
     * @param query The query to match documents
     * @returns An array of matching documents
     * */
    async findMany(query?: Partial<Doc<S>>): Promise<Doc<S>[]> {
        return await this.findMethods.findMany(query);
    }

    // Update methods

    /**
     * Update a document by its ID
     * @param _id The ID of the document to update
     * @param update The fields to update in the document
     * @returns The updated document or undefined if not found
     */
    async updateById(_id: string, update: Partial<Doc<S>>) {
        return await this.updateMethods.updateById(_id, update);
    }

    /**
     * Update a single document matching the query
     * @param query The query to match the document for update
     * @param update The fields to update in the document
     * @returns The updated document or undefined if not found
     */
    async updateOne(query: Partial<Doc<S>>, update: Partial<Doc<S>>) {
        return await this.updateMethods.updateOne(query, update);
    }

    /**
     *  Update multiple documents matching the query
     * @param query The query to match documents for update
     * @param update The fields to update in the documents
     * @return An array of updated documents
     */
    async updateMany(query: Partial<Doc<S>>, update: Partial<Doc<S>>) {
        return await this.updateMethods.updateMany(query, update);
    }
}

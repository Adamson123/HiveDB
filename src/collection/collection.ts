import fs from "fs/promises";
import Database from "../Database/Database";
import path from "path";
import { v4 as uuid } from "uuid";
import { handleFileIO } from "../utils/io";
import { checkFolderOrFileExist } from "../utils/exist";
import CollectionHelper from "./collection.helper";

type Otherfields = {
    required?: boolean;
};

export type FieldSpec =
    | ({ type: "string" } & Otherfields)
    | ({ type: "number" } & Otherfields)
    | ({ type: "boolean" } & Otherfields);

export type Schema = Record<string, FieldSpec>;

export type FieldType<T> = {
    // required fields
    [K in keyof T as T[K] extends { required: true }
        ? K
        : never]: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : T[K] extends { type: "boolean" }
        ? boolean
        : never;
} & {
    // optional fields
    [K in keyof T as T[K] extends { required: true }
        ? never
        : K]?: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : T[K] extends { type: "boolean" }
        ? boolean
        : never;
};

// Stored document
export type Doc<S> = { _id: string } & FieldType<S>;

export default class Collection<S extends Schema> {
    name: string;
    //for future collection relationship
    #database: Database;
    filePath: string;
    schema: S;
    documents: Doc<S>[] = [];
    isInit: boolean = false;
    private helper: CollectionHelper<S> = new CollectionHelper(this);

    constructor(name: string, schema: S, database: Database) {
        this.helper.validateCollectionName(name);
        this.name = name;
        this.schema = schema;
        this.#database = database;
        this.filePath = path.join(database.folderPath, name + ".json");
    }

    async init() {
        if (this.isInit) return;
        const isFileExist = await checkFolderOrFileExist(this.filePath); //true
        //If file does not exist
        if (!isFileExist) {
            await this.helper.createCollectionFile();

            this.documents = [];
            // return true; // Just creating collection file
        }
        this.documents = await this.helper.getDocumentsFromFile();
        this.isInit = true;
    }

    async deleteCollection() {
        const isFileExist = await checkFolderOrFileExist(this.filePath);
        if (isFileExist)
            await handleFileIO(
                `Error deleting collection "${this.name}"`,
                async () => {
                    await fs.unlink(this.filePath);
                }
            );
    }

    async create(document: FieldType<S>): Promise<Doc<S>> {
        await this.init();

        this.helper.validateRequiredFields(document);
        this.helper.validateFieldTypes(document);

        const newDocument: Doc<S> = { _id: uuid(), ...(document as any) };
        this.documents.push(newDocument);
        await this.helper.saveDocumentsToFile();
        return newDocument;
    }

    async deleteById(_id: string) {
        await this.init();

        this.documents = this.documents.filter((doc) => doc._id !== _id);
        await this.helper.saveDocumentsToFile();
    }

    async delete(query: Partial<Doc<S>>) {
        await this.init();

        const keys = Object.keys(query) as (keyof S)[];
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

    async findById(_id: string): Promise<Doc<S> | undefined> {
        await this.init();

        return this.documents.find((doc) => doc._id === _id);
    }

    async find(query: Partial<Doc<S>>): Promise<Doc<S>[]> {
        await this.init();

        const keys = Object.keys(query) as (keyof S)[];
        return this.documents.filter((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        );
    }

    async findOne(query: Partial<Doc<S>>): Promise<Doc<S>> {
        await this.init();

        const keys = Object.keys(query) as (keyof S)[];
        return this.documents.find((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        ) as Doc<S>;
    }
}

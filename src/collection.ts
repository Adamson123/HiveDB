import fs from "fs/promises";
import fsSync from "fs";
import HiveDB from "./hiveDB";
import path from "path";
import { v4 as uuid } from "uuid";
import { checkFolderOrFileExist, handleFileIO } from "./utils";
import { HiveError, HiveErrorCode } from "./errors";
import { validateName } from "./global";

type Otherfields = {
    required?: boolean;
};

export type FieldSpec =
    | ({ type: "string" } & Otherfields)
    | ({ type: "number" } & Otherfields)
    | ({ type: "boolean" } & Otherfields);

export type Schema = Record<string, FieldSpec>;

type FieldType<T> = {
    // required fields
    [K in keyof T as T[K] extends { required: true }
        ? K
        : never]: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : never;
} & {
    // optional fields
    [K in keyof T as T[K] extends { required: true }
        ? never
        : K]?: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : never;
};

// Stored document
type Doc<S> = { _id: string } & {
    [K in keyof S]: FieldType<S[K]>;
};

export default class Collection<S extends Schema> {
    name: string;
    #database: HiveDB;
    filePath: string;
    schema: S;
    documents: Doc<S>[] = [];
    isInit: boolean = false;

    constructor(name: string, schema: S, database: HiveDB) {
        this.validateCollectionName(name);
        this.name = name;
        this.schema = schema;
        this.#database = database;
        this.filePath = path.join(database.folderPath, name + ".json");
    }

    private validateCollectionName(name: string) {
        if (validateName(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_INVALID_COLLECTION_NAME,
                `Collection name '${name}' is invalid.`
            );
        }
    }

    //Checks if all required if field are not empty

    async createCollectionFile() {
        await handleFileIO(
            `Error creating collection "${this.name}"`,
            async () => {
                return await fs.readFile(this.filePath, "utf8");
            }
        );
    }

    async init() {
        if (this.isInit) return;
        const isFileExist = await checkFolderOrFileExist(this.filePath); //true
        //If file does not exist
        if (!isFileExist) {
            await this.createCollectionFile();

            this.documents = [];
            return true; // Just creating collection file
        }
        this.documents = await this.getDocumentsFromFile();
        this.isInit = true;
    }

    // initSync() {
    //     const exists = fsSync.existsSync(this.filePath);
    //     if (!exists) {
    //         fsSync.writeFileSync(this.filePath, "[]", "utf8");
    //         this.documents = [];
    //         return true; // Just created
    //     }
    //     try {
    //         const data = fsSync.readFileSync(this.filePath, "utf8").trim();
    //         if (!data) {
    //             fsSync.writeFileSync(this.filePath, "[]", "utf8");
    //             this.documents = [];
    //             return false;
    //         }
    //         this.documents = JSON.parse(data) as Doc<S>[];
    //     } catch {
    //         fsSync.writeFileSync(this.filePath, "[]", "utf8");
    //         this.documents = [];
    //     }
    //     return false;
    // }

    //TODO: Remove creating collection file when it does not exist
    private async getDocumentsFromFile(): Promise<Doc<S>[]> {
        const data = await handleFileIO(
            `Error reading collection "${this.name}"`,
            async () => {
                return await fs.readFile(this.filePath, "utf8");
            }
        );

        const trimmed = data.trim();

        if (!trimmed) {
            await this.createCollectionFile();
            return [];
        }
        try {
            return JSON.parse(trimmed) as Doc<S>[];
        } catch {
            await this.createCollectionFile();
            return [];
        }
    }

    private async saveDocumentsToFile() {
        const documents = JSON.stringify(this.documents, null, 2);
        await handleFileIO(
            `Error saving document to collection "${this.name}"`,
            async () => {
                fs.writeFile(this.filePath, documents);
            }
        );
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

    //TODO: Will be Extended for data types that will be added to the schema in the future
    private validateFieldTypes = (document: FieldType<S>) => {
        const keys = Object.keys(document);

        for (const key of keys) {
            const fieldTypeInDoc = document[key];
            const fieldTypeInSchema = this.schema[key].type;

            if (typeof fieldTypeInDoc !== fieldTypeInSchema) {
                throw new HiveError(
                    HiveErrorCode.ERR_INVALID_FIELD_TYPE,
                    `Invalid type for field "${key}". Expect ${fieldTypeInSchema}, got ${fieldTypeInDoc}`
                );
            }
        }
    };

    private validateRequiredFields(document: FieldType<S>) {
        const requiredSchemaKeys = Object.keys(this.schema).filter(
            (key) => this.schema[key].required
        );

        for (const key of requiredSchemaKeys) {
            //If document doesn't have this required key
            if (!Object.keys(document).includes(key))
                throw new HiveError(
                    //TODO: add new Error enum for this
                    HiveErrorCode.ERR_VALIDATION_FAILED,
                    `The field "${key}" is missing or empty`
                );
        }
    }

    async create(document: FieldType<S>): Promise<Doc<S>> {
        await this.init();

        this.validateRequiredFields(document);
        this.validateFieldTypes(document);

        const newDocument: Doc<S> = { _id: uuid(), ...(document as any) };
        this.documents.push(newDocument);
        await this.saveDocumentsToFile();
        return newDocument;
    }

    async deleteById(_id: string) {
        await this.init();

        this.documents = this.documents.filter((doc) => doc._id !== _id);
        await this.saveDocumentsToFile();
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

        await this.saveDocumentsToFile();
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

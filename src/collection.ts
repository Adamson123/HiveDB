import fs from "fs/promises";
import HiveDB from "./hiveDB";
import path from "path";
import { v4 as uuid } from "uuid";
import { checkFolderOrFileExist } from "./utils";

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

// Stored document: optional fields may be absent
type Doc<S> = { _id: string } & {
    [K in keyof S]: FieldType<S[K]>;
};

export default class Collection<S extends Schema> {
    name: string;
    #database: HiveDB;
    filePath: string;
    schema: S;
    documents: Doc<S>[] = [];

    constructor(name: string, schema: S, database: HiveDB) {
        this.name = name;
        this.schema = schema;
        this.#database = database;
        this.filePath = path.join(database.folderPath, name + ".json");
    }

    async init() {
        const isFileExist = await checkFolderOrFileExist(this.filePath); //true
        //If file does not exist
        if (!isFileExist) {
            await fs.writeFile(this.filePath, "[]", "utf8");
            this.documents = [];
            return true; // Just creating collection file
        }
        this.documents = await this.getDocumentsFromFile();
    }

    private async getDocumentsFromFile(): Promise<Doc<S>[]> {
        const data = await fs.readFile(this.filePath, "utf8");
        const trimmed = data.trim();
        if (!trimmed) {
            await fs.writeFile(this.filePath, "[]", "utf8");
            return [];
        }
        try {
            return JSON.parse(trimmed) as Doc<S>[];
        } catch {
            await fs.writeFile(this.filePath, "[]", "utf8");
            return [];
        }
    }

    private async saveDocumentsToFile() {
        try {
            const documents = JSON.stringify(this.documents, null, 2);
            await fs.writeFile(this.filePath, documents);
        } catch (error) {
            console.log("Error writing to file", error);
        }
    }

    async deleteCollection() {
        const isFileExist = await checkFolderOrFileExist(this.filePath);
        if (isFileExist) await fs.unlink(this.filePath);
    }

    async create(document: FieldType<S>): Promise<Doc<S>> {
        const newDocument: Doc<S> = { _id: uuid(), ...(document as any) };
        this.documents.push(newDocument);
        await this.saveDocumentsToFile();
        return newDocument;
    }

    async deleteById(_id: string) {
        this.documents = this.documents.filter((doc) => doc._id !== _id);
        await this.saveDocumentsToFile();
    }

    async delete(query: Partial<Doc<S>>) {
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
        return this.documents.find((doc) => doc._id === _id);
    }

    async find(query: Partial<Doc<S>>): Promise<Doc<S>[]> {
        const keys = Object.keys(query) as (keyof S)[];
        return this.documents.filter((doc) =>
            keys.every((key) => (doc as any)[key] === (query as any)[key])
        );
    }
}

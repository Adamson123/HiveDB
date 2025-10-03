import { HiveError, HiveErrorCode } from "../errors.js";
import { validateName } from "../utils/index.js";
import { handleFileIO, handleFileIOSync } from "../utils/io.js";
import Collection from "./collection.js";
import fs from "fs/promises";
import fsSync from "fs";

export default class CollectionHelper<S extends Schema> {
    collection: Collection<S>;

    constructor(collection: Collection<S>) {
        this.collection = collection;
    }

    createCollectionFile() {
        handleFileIO(
            `Error creating collection "${this.collection.name}"`,
            () => {
                fsSync.writeFileSync(this.collection.filePath, "", {
                    encoding: "utf8",
                });
            }
        );
    }

    getDocumentsFromFile(): Doc<S>[] {
        const data = handleFileIOSync(
            `Error reading collection "${this.collection.name}"`,
            () => {
                return fsSync.readFileSync(this.collection.filePath, "utf8");
            }
        );

        const trimmed = data.trim();

        // If file is empty, return empty array
        if (!trimmed) {
            this.createCollectionFile();
            return [];
        }

        // Try to parse JSON, if fails, return empty array
        try {
            return JSON.parse(trimmed) as Doc<S>[];
        } catch {
            return [];
        }
    }

    async saveDocumentsToFile() {
        const documents = JSON.stringify(this.collection.documents, null, 2);
        await handleFileIO(
            `Error saving document to collection "${this.collection.name}"`,
            async () => {
                await fs.writeFile(this.collection.filePath, documents);
            }
        );
    }

    objectNotEmpty = (obj: object) => {
        if (!obj || Object.keys(obj).length === 0) return false;
        return true;
    };

    validateFieldTypes = (document: FieldType<S> | Partial<Doc<S>>) => {
        const keys = Object.keys(document);

        for (const key of keys) {
            const fieldTypeInDoc = typeof document[key as keyof FieldType<S>];
            const fieldTypeInSchema = this.collection.schema[key].type;

            if (fieldTypeInDoc !== fieldTypeInSchema) {
                throw new HiveError(
                    HiveErrorCode.ERR_INVALID_FIELD_TYPE,
                    `Invalid type for field "${key}". Expect ${fieldTypeInSchema}, got ${fieldTypeInDoc}`
                );
            }
        }
    };

    validateRequiredFields(document: FieldType<S> | Partial<Doc<S>>) {
        const requiredSchemaKeys = Object.keys(this.collection.schema).filter(
            (key) => this.collection.schema[key].required
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

    validateCollectionName(name: string) {
        if (validateName(name)) {
            throw new HiveError(
                HiveErrorCode.ERR_INVALID_COLLECTION_NAME,
                `Collection name '${name}' is invalid.`
            );
        }
    }

    removeKeysNotDefinedInSchema(document: FieldType<S> | Partial<Doc<S>>) {
        const schemaKeys = Object.keys(this.collection.schema);
        const docKeys = Object.keys(document);

        for (const key of docKeys) {
            if (!schemaKeys.includes(key)) {
                delete (document as any)[key];
            }
        }
        return document;
    }
}

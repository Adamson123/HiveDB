import { HiveError, HiveErrorCode } from "../errors";
import { validateName } from "../utils/index";
import { handleFileIO, handleFileIOSync } from "../utils/io";
import Collection, { Doc, FieldType, Schema } from "./collection";
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

    validateFieldTypes = (document: FieldType<S>) => {
        const keys = Object.keys(document);

        for (const key of keys) {
            const fieldTypeInDoc = typeof document[key];
            const fieldTypeInSchema = this.collection.schema[key].type;

            if (fieldTypeInDoc !== fieldTypeInSchema) {
                throw new HiveError(
                    HiveErrorCode.ERR_INVALID_FIELD_TYPE,
                    `Invalid type for field "${key}". Expect ${fieldTypeInSchema}, got ${fieldTypeInDoc}`
                );
            }
        }
    };

    validateRequiredFields(document: FieldType<S>) {
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
}

export enum HiveErrorCode {
    ERR_INVALID_DATABASE_NAME = "ERR_INVALID_DATABASE_NAME",
    ERR_INVALID_COLLECTION_NAME = "ERR_INVALID_COLLECTION_NAME",
    ERR_COLLECTION_EXISTS = "ERR_COLLECTION_EXISTS",
    ERR_COLLECTION_NOT_FOUND = "ERR_COLLECTION_NOT_FOUND",
    ERR_INVALID_SCHEMA = "ERR_INVALID_SCHEMA",
    ERR_VALIDATION_FAILED = "ERR_VALIDATION_FAILED",
    ERR_DOCUMENT_NOT_FOUND = "ERR_DOCUMENT_NOT_FOUND",
    ERR_QUERY_INVALID = "ERR_QUERY_INVALID",
    ERR_FOLDER_IO = "ERR_FOLDER_IO",
    ERR_FILE_IO = "ERR_FILE_IO",
    ERR_JSON_PARSE = "ERR_JSON_PARSE",
}

export class HiveError extends Error {
    code: HiveErrorCode;
    details?: unknown;

    constructor(code: HiveErrorCode, message?: string, details?: unknown) {
        super(message ?? code);
        this.name = code; // so error.name === code
        this.code = code;
        this.details = details;
    }

    static is(e: unknown, code: HiveErrorCode): e is HiveError {
        return e instanceof HiveError && e.code === code;
    }
}

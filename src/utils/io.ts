import { HiveError, HiveErrorCode } from "../errors";

// Handle folder IO asynchronous version
export const handleFolderIO = async (
    message: string,
    callback: () => Promise<any> | any
) => {
    try {
        return callback();
    } catch (error) {
        throw new HiveError(HiveErrorCode.ERR_FOLDER_IO, message, error);
    }
};

// Handle folder IO synchronous version
export const handleFolderIOSync = (message: string, callback: () => any) => {
    try {
        return callback();
    } catch (error) {
        throw new HiveError(HiveErrorCode.ERR_FOLDER_IO, message, error);
    }
};

// Handle folder IO synchronous version
export const handleFileIO = async (
    message: string,
    callback: () => Promise<any> | any
) => {
    try {
        return await callback();
    } catch (error) {
        throw new HiveError(HiveErrorCode.ERR_FILE_IO, message, error);
    }
};

// Handle folder IO synchronous version
export const handleFileIOSync = (message: string, callback: () => any) => {
    try {
        return callback();
    } catch (error) {
        throw new HiveError(HiveErrorCode.ERR_FILE_IO, message, error);
    }
};

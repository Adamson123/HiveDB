import fs from "fs/promises";
import { HiveError, HiveErrorCode } from "../errors";

/**
 * Checks if a folder or file exist
 *  @returns "true" if folder exists and "false" if it does not
 * */
export const checkFolderOrFileExist = async (contentPath: string) => {
    try {
        await fs.access(contentPath);
        return true;
    } catch (error) {
        return false;
    }
};

export const handleFolderIO = async (
    message: string,
    callback: () => Promise<any>
) => {
    try {
        return await callback();
    } catch (error) {
        throw new HiveError(HiveErrorCode.ERR_FOLDER_IO, message, error);
    }
};

export const handleFileIO = async (
    message: string,
    callback: () => Promise<any>
) => {
    try {
        return await callback();
    } catch (error) {
        throw new HiveError(HiveErrorCode.ERR_FILE_IO, message, error);
    }
};

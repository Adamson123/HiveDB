import fs from "fs/promises";
import fsSync from "fs";

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

/**
 * Checks if a folder or file exist
 *  @returns "true" if folder exists and "false" if it does not
 * */
export const checkFolderOrFileExistSync = (contentPath: string) => {
    try {
        fsSync.accessSync(contentPath);
        return true;
    } catch (error) {
        return false;
    }
};

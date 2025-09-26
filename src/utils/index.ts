import path from "path";
import fs from "fs/promises";
import { allDatabesesFolder } from "../src/global";

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

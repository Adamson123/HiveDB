import { HiveError, HiveErrorCode } from "../errors";

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

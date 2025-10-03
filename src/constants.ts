import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, "..");

export const HIVE_ROOT =
    process.env.HIVEDB_ROOT && process.env.HIVEDB_ROOT.trim()
        ? path.resolve(process.env.HIVEDB_ROOT)
        : PACKAGE_ROOT;

export const PATHS = {
    allDatabesesFolder: path.join(HIVE_ROOT, "hives"),
    hiveDBDataFolder: path.join(HIVE_ROOT, "data-folder"),
    collectionsFolder: path.join(HIVE_ROOT, "data-folder", "collections"),
    databaseInfoPath: path.join(
        HIVE_ROOT,
        "data-folder",
        "databases-info.json"
    ),
};

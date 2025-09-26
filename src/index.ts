import HiveDB from "./hiveDB";

const db = new HiveDB("new-db");
await db.init();

const schema = {
    name: { type: "string", required: true },
    password: { type: "string", required: true },
    food: { type: "number" },
    email: {
        type: "string",
    },
} as const;

//const col = await db.createCollection("coll", schema);

// IntelliSense now suggests "name" (string, required) and "food" (number, optional)
// const created = await col.create({ name: "swwsssrr", password: "!@#334444" });

// // Typed query completions:
// const user = await col.find({ name: "swwsssrr" });

//await col.delete({ name: "swwsssrr" });

const article = await db.createCollection("posts", {
    title: { type: "string", required: true },
    subtitle: { type: "string" },
    content: { type: "string" },
});

await article.create({
    title: "Adam Title",
    content: "This a content",
    subtitle: "Adam subtitle",
});

const user = await db.createCollection("users", schema);

await db.deleteCollection("posts");
await db.createCollection("posts", {
    title: { type: "string", required: true },
    subtitle: { type: "string" },
    content: { type: "string" },
});

//console.log(user);

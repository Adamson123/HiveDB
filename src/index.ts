import HiveDB from "./hiveDB";

// type SchemaComp<T> = {
//     [K in keyof T]: {
//         type: "string" | "number" | "boolean";
//         required?: boolean;
//     };
// };

// const CreateSchema = <S>(schema: SchemaComp<S>) => {
//     return schema;
// };
// CreateSchema({ adam: { type: "number", required: true } });

const db = new HiveDB("new-db");
await db.init();

const userSchema = db.CreateSchema({
    name: { type: "string", required: true },
    password: { type: "string", required: true },
    bio: { type: "string" },
    email: {
        type: "string",
    },
});

const postSchema = db.CreateSchema({
    title: { type: "string", required: true },
    subtitle: { type: "string" },
    content: { type: "string" },
    authorId: {
        type: "string",
        required: true,
    },
});

//const col = await db.createCollection("coll", schema);

// IntelliSense now suggests "name" (string, required) and "food" (number, optional)
// const created = await col.create({ name: "swwsssrr", password: "!@#334444" });

// // Typed query completions:
// const user = await col.find({ name: "swwsssrr" });

//await col.delete({ name: "swwsssrr" });

const postCol = await db.createCollection("posts", postSchema);

const userCol = await db.createCollection("users", userSchema);

const author = await userCol.create({
    name: "Adam Ajibade",
    password: "12345",
    email: "adam66@gmail.com",
});

await postCol.create({
    title: "Adam Title",
    content: "This a content",
    subtitle: "Adam subtitle",
    authorId: author._id,
});

await postCol.find();

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
const db = new HiveDB("newdb");

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

const postCol = await db.createCollection("posts", postSchema);

const posts = db.createCollection("posts", postSchema);

const userCol = await db.createCollection("users", userSchema);

const author = await userCol.create({
    name: "Adam Ajibade",
    password: "",
    email: "adam66@gmail.com",
});

let existingPost = await postCol.findOne({ title: "Adam Title" });

if (!existingPost)
    existingPost = await postCol.create({
        title: "Adam Title",
        content: "This a content",
        subtitle: "Adam subtitle",
        authorId: author._id,
    });

const foundPost = await postCol.findById(existingPost._id);

console.log(foundPost);

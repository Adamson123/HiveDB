import HiveDB from "./hiveDB.js";

const db = HiveDB.createDatabase("newdb");
const db2 = HiveDB.createDatabase("newdb2");
const db3 = HiveDB.createDatabase("newdb3");

//db
const userSchema = HiveDB.createSchema({
    name: { type: "string", required: true },
    password: { type: "string", required: true },
    bio: { type: "string" },
    email: {
        type: "string",
    },
});

const postSchema = HiveDB.createSchema({
    title: { type: "string", required: true },
    subtitle: { type: "string" },
    content: { type: "string" },
    authorId: {
        type: "string",
        required: true,
    },
});

const postCol = db.createCollection("posts", postSchema);
//const posts = db.createCollection("posts", postSchema);
const userCol = db.createCollection("users", userSchema);

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

//db2
const productSchema = HiveDB.createSchema({
    name: { type: "string", required: true },
    price: { type: "number", required: true },
    description: { type: "string" },
    inStock: { type: "boolean", required: true },
});
const productCol = db2.createCollection("products", productSchema);
const product = await productCol.create({
    name: "Laptop",
    price: 999.99,
    description: "A high-performance laptop",
    inStock: true,
});

console.log(product);

//db3
const categorySchema = HiveDB.createSchema({
    name: { type: "string", required: true },
    description: { type: "string" },
});
const categoryCol = db3.createCollection("categories", categorySchema);
//TODO: Fix deleteCollection not deleting the collection file
//await db3.deleteCollection("categories");
const category = await categoryCol.create({ name: "Electronics" });

console.log(category);

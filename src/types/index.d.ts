type Otherfields = {
    required?: boolean;
};

type FieldSpec =
    | ({ type: "string" } & Otherfields)
    | ({ type: "number" } & Otherfields)
    | ({ type: "boolean" } & Otherfields);

type Schema = Record<string, FieldSpec>;

type FieldType<T> = {
    // required fields
    [K in keyof T as T[K] extends { required: true }
        ? K
        : never]: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : T[K] extends { type: "boolean" }
        ? boolean
        : never;
} & {
    // optional fields
    [K in keyof T as T[K] extends { required: true }
        ? never
        : K]?: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : T[K] extends { type: "boolean" }
        ? boolean
        : never;
};

// Stored document
type Doc<S> = { _id: string } & FieldType<S>;

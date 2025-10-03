export type Otherfields = {
    required?: boolean;
};

export type FieldSpec =
    | ({ type: "string" } & Otherfields)
    | ({ type: "number" } & Otherfields)
    | ({ type: "boolean" } & Otherfields);

export type Schema = Record<string, FieldSpec>;

export type FieldType<T> = {
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
export type Document<S> = { _id: string } & FieldType<S>;

type FieldAC<T> = T extends { type: "st" }
    ? string
    : T extends { type: "nu" }
    ? number
    : T extends { type: "bo" }
    ? boolean
    : never;

type FieldSpecAc = { type: "st" } | { type: "nu" } | { type: "bo" };

type FieldSpec = { type: "string" } | { type: "number" } | { type: "boolean" };

type FieldType<T> = T extends { type: "string" }
    ? string
    : T extends { type: "number" }
    ? number
    : T extends { type: "boolean" }
    ? boolean
    : never;

const num: FieldType<{ type: "string" }> = "";

function mockField<F extends FieldSpec>(field: F): FieldType<F> {
    if (field.type === "string") return "hello" as FieldType<F>;
    if (field.type === "number") return 42 as FieldType<F>;
    return true as FieldType<F>;
}

const st: number = mockField({ type: "number" });

const mockFieldAC = <T extends FieldSpecAc>(field: T): FieldAC<T> => {
    return true as FieldAC<T>;
};

const ff = mockFieldAC({ type: "nu" });

type WantObj<T> = T extends string
    ? { type: "string" }
    : T extends number
    ? { type: "number" }
    : T extends boolean
    ? { type: "boolean" }
    : { type: "never" };

const mockFieldWantObj = <T>(field: string | number | boolean): WantObj<T> => {
    return { type: "string" } as WantObj<T>;
};

const mockFieldWantObj2 = <T>(field?: T): WantObj<T> => {
    if (typeof field === "string") {
        return { type: "string" } as WantObj<T>;
    } else if (typeof field === "number") {
        return { type: "number" } as WantObj<T>;
    } else if (typeof field === "boolean") {
        return { type: "boolean" } as WantObj<T>;
    }
    return { type: "never" } as WantObj<T>;
};

const food: { type: "never" } = mockFieldWantObj2();

// type FType<T> = {
//     [K in keyof T]: T[K] extends { type: "string" }
//         ? string
//         : T[K] extends { type: "number" }
//         ? number
//         : never;
// };

type FType<T> = {
    // required fields
    [K in keyof T as T[K] extends { required: true }
        ? K
        : never]: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : never;
} & {
    // optional fields
    [K in keyof T as T[K] extends { required: true }
        ? never
        : K]?: T[K] extends { type: "string" }
        ? string
        : T[K] extends { type: "number" }
        ? number
        : never;
};

const foodFunc = <T>(food: T) => {
    return (p: FType<T>) => {};
};

const p = foodFunc({
    f: { type: "string", required: true },
    g: { type: "number" },
} as const);

p({ g: 3, f: "5" });

// Share with client and server
type Entry = {
    id: string;
    title: string;
    path: string;
    tags: string[];
    comments: string;
    authors: string[];
    year: number | null;
    publisher: string | null;
};

type DB = Entry[];

export type {Entry, DB};
export {}

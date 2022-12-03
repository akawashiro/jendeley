// Share with client and server
type Entry = {
    id: string;
    title: string;
    path: string;
    tags: string[];
    comments: string;
    authors: string[];
    abstract: string;
    year: number | null;
    publisher: string;
};

type DB = Entry[];

export type {Entry, DB};
export {}

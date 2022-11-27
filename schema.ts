// Share with client and server
type Entry = {
    id: string;
    title: string;
    authors: [string];
    path: string;
    year: string;
    publisher: string;
};

type DB = Entry[];

export type {Entry, DB};
export {}

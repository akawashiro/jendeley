// This file is shared between client and server

type IDType = "doi" | "isbn" | "url" | "book";

type Entry = {
    id: string;
    id_type: IDType;
    url: string;
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

type RequestGetPdfFromUrl = {
    url: string;
    title: string | null;
    doi: string | null;
    isbn: string | null;
    tags: string[];
    comments: string;
};

type RequestGetWebFromUrl = {
    url: string;
    title: string;
    tags: string[];
    comments: string;
};

export type { IDType, Entry, DB, RequestGetPdfFromUrl, RequestGetWebFromUrl };
export { };

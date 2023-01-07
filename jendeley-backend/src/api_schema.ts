// This file is shared between client and server

type IDType = "doi" | "isbn" | "url" | "book" | "arxiv" | "path";

type ApiEntry = {
  id: string;
  idType: IDType;
  url: string | undefined;
  title: string;
  path: string | undefined;
  tags: string[];
  comments: string;
  authors: string[];
  abstract: string;
  year: number | undefined;
  publisher: string | undefined;
};

type ApiDB = ApiEntry[];

type RequestGetPdfFromUrl = {
  url: string;
  title: string | undefined;
  doi: string | undefined;
  isbn: string | undefined;
  tags: string[];
  comments: string;
};

type RequestGetWebFromUrl = {
  url: string;
  title: string;
  tags: string[];
  comments: string;
};

type ApiResponse = {
  isSucceeded: boolean;
  message: string;
};

export type {
  IDType,
  ApiEntry,
  ApiDB,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
  ApiResponse,
};
export {};

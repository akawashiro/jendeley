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

type RequestGetPdfFromFile = {
  filename: string | undefined;
  fileBase64: string;
  doi: string | undefined;
  isbn: string | undefined;
  tags: string[];
  comments: string;
};

type RequestGetPdfFromUrl = {
  url: string;
  filename: string | undefined;
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
  RequestGetPdfFromFile,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
  ApiResponse,
};
export {};

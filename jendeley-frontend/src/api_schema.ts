// This file is shared between client and server

type IDType = "doi" | "isbn" | "url" | "book" | "arxiv" | "path";

type ApiEntry = {
  id: string;
  idType: IDType;
  url: string | undefined;
  title: string;
  text: string | undefined;
  path: string | undefined;
  tags: string[];
  comments: string;
  authors: string[];
  abstract: string;
  year: number | undefined;
  publisher: string | undefined;
};

type ApiDB = ApiEntry[];

type RequestGetDB = {
  title: string | undefined;
  authors: string | undefined;
  tags: string | undefined;
  comments: string | undefined;
  year: string | undefined;
  publisher: string | undefined;
  text: string | undefined;
};

type RequestGetPdfFromFile = {
  filename: string;
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

const AUTHORES_EDITABLE_ID_TYPES = ["url", "path"];

export type {
  IDType,
  ApiEntry,
  ApiDB,
  RequestGetPdfFromFile,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
  RequestGetDB,
  ApiResponse,
};

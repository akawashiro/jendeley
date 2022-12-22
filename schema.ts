// Share with client and server
type Entry = {
  id: string;
  id_type: string;
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

export type { Entry, DB, RequestGetPdfFromUrl, RequestGetWebFromUrl };
export {};

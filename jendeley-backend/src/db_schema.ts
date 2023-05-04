type ArxivEntry = {
  idType: "arxiv";
  path: string[];
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromArxiv: any;
  reservedForUser: any | undefined;
};

type DoiEntry = {
  idType: "doi";
  path: string[];
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromCrossref: any;
  reservedForUser: any | undefined;
};

type BookEntry = {
  idType: "book";
  path: string[];
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromNodeIsbn: any;
  reservedForUser: any | undefined;
};

type IsbnEntry = {
  idType: "isbn";
  path: string[];
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromNodeIsbn: any;
  reservedForUser: any | undefined;
};

type PathEntry = {
  idType: "path";
  path: string[];
  title: string;
  tags: string[];
  userSpecifiedTitle: string | undefined;
  comments: string;
  reservedForUser: any | undefined;
};

type UrlEntry = {
  idType: "url";
  url: string;
  title: string;
  tags: string[];
  userSpecifiedTitle: string | undefined;
  comments: string;
  reservedForUser: any | undefined;
};

type DBMetaData = {
  idType: "meta";
  version: string;
};

type DBEntry =
  | ArxivEntry
  | DoiEntry
  | IsbnEntry
  | PathEntry
  | UrlEntry
  | BookEntry;

type JsonDB = {
  [key: string]: DBEntry | DBMetaData;
};

type FulltextDB = { [key: string]: string };

export type {
  ArxivEntry,
  DoiEntry,
  IsbnEntry,
  PathEntry,
  UrlEntry,
  BookEntry,
  JsonDB,
  DBEntry,
  FulltextDB,
};
export {};

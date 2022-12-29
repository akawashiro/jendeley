import { IDType } from "./api_schema";

type ArxivEntry = {
  idType: IDType;
  path: string;
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromArxiv: any;
};

type DoiEntry = {
  idType: IDType;
  path: string;
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromCrossref: any;
};

type IsbnEntry = {
  idType: IDType;
  path: string;
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromNodeIsbn: any;
};

type PathEntry = {
  idType: IDType;
  path: string;
  title: string;
  tags: string[];
  userSpecifiedTitle: string | undefined;
  comments: string;
};

type UrlEntry = {
  idType: IDType;
  url: string;
  title: string;
  tags: string[];
  userSpecifiedTitle: string | undefined;
  comments: string;
};

export type { ArxivEntry, DoiEntry, IsbnEntry, PathEntry, UrlEntry };
export {};

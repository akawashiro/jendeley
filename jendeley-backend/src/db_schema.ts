import { IDType } from "./api_schema";

type ArxivEntry = {
  id_type: IDType;
  path: string;
  tags: string[];
  comments: string;
  data_from_arxiv: any;
};

type DoiEntry = {
  id_type: IDType;
  path: string;
  tags: string[];
  comments: string;
  data_from_crossref: any;
};

type IsbnEntry = {
  id_type: IDType;
  path: string;
  tags: string[];
  comments: string;
  data_from_node_isbn: any;
};

type PathEntry = {
  id_type: IDType;
  path: string;
  title: string;
  tags: string[];
  comments: string;
};

type UrlEntry = {
  id_type: IDType;
  url: string;
  title: string;
  tags: string[];
  comments: string;
};

export type { ArxivEntry, DoiEntry, IsbnEntry, PathEntry, UrlEntry };
export {};

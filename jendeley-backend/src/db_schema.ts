type ArxivEntry = {
  idType: "arxiv";
  path: string;
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromArxiv: any;
};

type DoiEntry = {
  idType: "doi";
  path: string;
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromCrossref: any;
};

type IsbnEntry = {
  idType: "isbn";
  path: string;
  tags: string[];
  comments: string;
  userSpecifiedTitle: string | undefined;
  dataFromNodeIsbn: any;
};

type PathEntry = {
  idType: "path";
  path: string;
  title: string;
  tags: string[];
  userSpecifiedTitle: string | undefined;
  comments: string;
};

type UrlEntry = {
  idType: "url";
  url: string;
  title: string;
  tags: string[];
  userSpecifiedTitle: string | undefined;
  comments: string;
};

export type { ArxivEntry, DoiEntry, IsbnEntry, PathEntry, UrlEntry };
export {};

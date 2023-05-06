const JENDELEY_VERSION = "2.0.0";
const JENDELEY_NO_TRACK = "[jendeley no track]";
const JENDELEY_NO_ID = "[jendeley no id]";
const ENTRY_ID_TYPE = "idType";
const ENTRY_PATH = "path";
const ENTRY_AUTHORS = "authors";
const ENTRY_URL = "url";
const ENTRY_TITLE = "title";
const ENTRY_TAGS = "tags";
const ENTRY_COMMENTS = "comments";
const ENTRY_TEXT = "text";
const DB_META_KEY = "jendeley_meta";
const ID_TYPE_ARXIV = "arxiv";
const ID_TYPE_DOI = "doi";
const ID_TYPE_ISBN = "isbn";
const ID_TYPE_PATH = "path";
const ID_TYPE_BOOK = "book";
const ID_TYPE_URL = "url";
const ID_TYPE_META = "meta";
const ARXIV_API_URL = "http://export.arxiv.org/api/query?id_list=";
const ENTRY_DATA_FROM_ARXIV = "data_from_" + ARXIV_API_URL;
const JENDELEY_DIR = ".jendeley";

const AUTHORES_EDITABLE_ID_TYPES = ["url", "path"];
const TITLE_EDITABLE_ID_TYPES = ["path"];

export {
  AUTHORES_EDITABLE_ID_TYPES,
  TITLE_EDITABLE_ID_TYPES,
  JENDELEY_NO_TRACK,
  JENDELEY_NO_ID,
  DB_META_KEY,
  ENTRY_ID_TYPE,
  ENTRY_AUTHORS,
  ENTRY_PATH,
  ENTRY_URL,
  ENTRY_TAGS,
  ENTRY_COMMENTS,
  ENTRY_TEXT,
  ENTRY_TITLE,
  ENTRY_DATA_FROM_ARXIV,
  ID_TYPE_ARXIV,
  ID_TYPE_DOI,
  ID_TYPE_ISBN,
  ID_TYPE_PATH,
  ID_TYPE_BOOK,
  ID_TYPE_META,
  ID_TYPE_URL,
  ARXIV_API_URL,
  JENDELEY_VERSION,
  JENDELEY_DIR,
};

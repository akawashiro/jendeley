import fs from "fs";
import path from "path";
import node_isbn from "node-isbn";
import xml2js from "xml2js";
import crypto from "crypto";
import { logger } from "./logger";
import {
  JENDELEY_NO_TRACK,
  ENTRY_ID_TYPE,
  ID_TYPE_ARXIV,
  ID_TYPE_DOI,
  ID_TYPE_ISBN,
  ID_TYPE_PATH,
  ENTRY_PATH,
  ENTRY_TITLE,
  ENTRY_COMMENTS,
  ENTRY_TAGS,
  ENTRY_URL,
  ID_TYPE_URL,
  ID_TYPE_BOOK,
  ARXIV_API_URL,
  ENTRY_DATA_FROM_ARXIV,
} from "./constants";
import { DocID, getDocID } from "./docid";
import { validateJsonDB } from "./validate_db";
import {
  ArxivEntry,
  DoiEntry,
  IsbnEntry,
  JsonDB,
  PathEntry,
  UrlEntry,
} from "./db_schema";
import * as E from "fp-ts/lib/Either";

function walkPDFDFS(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  } else if (fs.lstatSync(dir).isDirectory()) {
    const ds = fs.readdirSync(dir, { withFileTypes: true });
    var ret: Array<string> = [];
    ds.forEach((d) => {
      ret = ret.concat(walkPDFDFS(path.join(dir, d.name)));
    });
    return ret;
  } else if (path.extname(dir) == ".pdf" && !dir.includes("_Note")) {
    // TODO: Ignore general pattern
    return [dir];
  } else {
    return [];
  }
}

// All paths returned from walkPDF are relative path from papersDir.
function walkPDF(papersDir: string): string[] {
  let r: string[] = [];
  const pdfs = walkPDFDFS(papersDir);
  for (const pd of pdfs) {
    r.push(pd.replace(papersDir, ""));
  }
  return r;
}

function getTitleFromPath(pdf: string): string {
  const basename = path.basename(pdf, ".pdf");
  let r = "";
  let level = 0;
  for (let i = 0; i < basename.length; i++) {
    if (basename[i] == "[") level += 1;
    else if (basename[i] == "]") level -= 1;
    else if (level == 0 && (r != "" || basename[i] != " ")) r += basename[i];
  }
  return r;
}

async function getDoiJSON(doi: string): Promise<Object> {
  let { got } = await import("got");

  // See here for API documentation
  // https://www.crossref.org/documentation/retrieve-metadata/rest-api/
  const URL = "https://api.crossref.org/v1/works/" + doi + "/transform";
  const options = { headers: { Accept: "application/json" } };
  try {
    const data = (await got(URL, options).json()) as Object;
    return data;
  } catch {
    logger.warn("Failed to get information from doi: " + URL);
    return new Object();
  }
}

async function getIsbnJson(isbn: string) {
  const b = await node_isbn
    .resolve(isbn)
    .then(function (book) {
      return book;
    })
    .catch(function (err) {
      logger.warn("Failed to get information from ISBN: " + isbn);
      return undefined;
    });
  return b;
}

async function getArxivJson(arxiv: string) {
  let { got } = await import("got");

  // See here for API documentation
  // https://arxiv.org/help/api/
  const URL = ARXIV_API_URL + arxiv;
  const options = { headers: { Accept: "application/json" } };
  try {
    const data = (await got(URL, options)).body;
    let jsonData;
    const parser = new xml2js.Parser({
      async: false,
      explicitArray: false,
    });
    parser.parseString(data, (error, json) => {
      jsonData = json;
    });
    if (jsonData.feed.entry == undefined) {
      logger.warn(
        "Failed to get information from arXiv: " +
          URL +
          JSON.stringify(jsonData)
      );
      return new Object();
    } else {
      return jsonData.feed.entry;
    }
  } catch {
    logger.warn("Failed to get information from arXiv: " + URL);
    return new Object();
  }
}

// Return [JSON, ID]
async function getJson(
  docID: DocID,
  path: string
): Promise<
  [ArxivEntry | DoiEntry | IsbnEntry | PathEntry, string] | undefined
> {
  let json_r: ArxivEntry | DoiEntry | IsbnEntry | PathEntry | undefined =
    undefined;
  let db_id: string | undefined = undefined;

  if (docID.arxiv != undefined) {
    let dataFromArxiv = await getArxivJson(docID.arxiv);
    if (dataFromArxiv != undefined) {
      let json: ArxivEntry = {
        path: path,
        idType: ID_TYPE_ARXIV,
        tags: [],
        comments: "",
        userSpecifiedTitle: undefined,
        dataFromArxiv: dataFromArxiv,
      };
      json_r = json;
      db_id = "arxiv_" + docID.arxiv;
    } else {
      logger.warn(
        "Failed to get information of " +
          JSON.stringify(docID) +
          " using arxiv " +
          path
      );
    }
  }
  if (
    docID.doi != undefined &&
    (json_r == undefined || json_r[ENTRY_TITLE] == undefined)
  ) {
    let dataFromCrossref = await getDoiJSON(docID.doi);
    if (dataFromCrossref != undefined) {
      let json: DoiEntry = {
        path: path,
        idType: ID_TYPE_DOI,
        tags: [],
        comments: "",
        userSpecifiedTitle: undefined,
        dataFromCrossref: dataFromCrossref,
      };
      json_r = json;
      db_id = "doi_" + docID.doi;
    } else {
      logger.warn(
        "Failed to get information of " +
          JSON.stringify(docID) +
          " using doi " +
          path
      );
    }
  }
  if (
    docID.isbn != undefined &&
    (json_r == undefined || json_r[ENTRY_TITLE] == undefined)
  ) {
    let dataFromNodeIsbn = await getIsbnJson(docID.isbn);
    if (dataFromNodeIsbn != undefined) {
      let json: IsbnEntry = {
        path: path,
        idType: ID_TYPE_ISBN,
        tags: [],
        comments: "",
        userSpecifiedTitle: undefined,
        dataFromNodeIsbn: dataFromNodeIsbn,
      };
      json_r = json;
      db_id = "isbn_" + docID.isbn;
    } else {
      logger.warn(
        "Failed to get information of " +
          JSON.stringify(docID) +
          " using isbn " +
          path
      );
    }
  }
  if (
    docID.path != undefined &&
    (json_r == undefined || json_r[ENTRY_TITLE] == undefined)
  ) {
    let json: PathEntry = {
      path: path,
      title: docID.path,
      idType: ID_TYPE_PATH,
      tags: [],
      comments: "",
      userSpecifiedTitle: undefined,
    };
    json_r = json;
    db_id = "path_" + docID.path;
  }

  if (json_r == undefined || db_id == undefined) {
    logger.warn(
      "Failed to get information of " +
        JSON.stringify(docID) +
        " path = " +
        path +
        " json_r = " +
        JSON.stringify(json_r) +
        " db_id = " +
        JSON.stringify(db_id)
    );
    return undefined;
  } else {
    return [json_r, db_id];
  }
}

function isValidJsonEntry(json: Object) {
  return (
    json[ENTRY_TITLE] != undefined &&
    (json[ENTRY_PATH] != undefined || json[ENTRY_ID_TYPE] == ID_TYPE_URL)
  );
}

function genDummyDB(output: string) {
  const n_entry = 500;

  let jsonDB: JsonDB = {};
  for (let i = 0; i < n_entry; i++) {
    const id = "path_" + crypto.randomBytes(20).toString("hex");
    const e: PathEntry = {
      idType: "path",
      path: crypto.randomBytes(40).toString("hex"),
      title: crypto.randomBytes(40).toString("hex"),
      tags: [],
      userSpecifiedTitle: undefined,
      comments: crypto.randomBytes(40).toString("hex"),
    };
    jsonDB[id] = e;
  }

  if (!validateJsonDB(jsonDB, undefined)) {
    throw new Error("validateJsonDB failed!");
  }
  fs.writeFileSync(output, JSON.stringify(jsonDB, null, 2));
}

function registerWeb(
  jsonDB: JsonDB,
  url: string,
  title: string,
  comments: string,
  tags: string[]
) {
  logger.info(
    "url = " +
      url +
      " title = " +
      title +
      " tags = " +
      tags +
      " comments = " +
      comments
  );
  const docID: DocID = {
    url: url,
    doi: undefined,
    isbn: undefined,
    path: undefined,
    arxiv: undefined,
  };
  logger.info("docID = " + JSON.stringify(docID));

  let json: UrlEntry = {
    title: title,
    url: url,
    comments: comments,
    tags: tags,
    userSpecifiedTitle: undefined,
    idType: ID_TYPE_URL,
  };

  if (isValidJsonEntry(json)) {
    jsonDB["url_" + url] = json;
    logger.info("Register url_" + url);

    if (!validateJsonDB(jsonDB, undefined)) {
      throw new Error("validateJsonDB failed!");
    }

    return jsonDB;
  } else {
    logger.warn("Failed to register url_" + url);
    return jsonDB;
  }
}

async function registerNonBookPDF(
  papersDir: string,
  pdf: string,
  jsonDB: JsonDB,
  userSpecifiedTitle: string | undefined,
  comments: string,
  tags: string[],
  renameUsingTitle: boolean,
  downloadUrl: string | undefined
): Promise<E.Either<string, JsonDB>> {
  logger.info(
    "papersDir = " +
      papersDir +
      " pdf = " +
      pdf +
      " tags = " +
      tags +
      " comments = " +
      comments
  );
  const docID = await getDocID(pdf, papersDir, false, downloadUrl);

  if (E.isLeft(docID)) {
    logger.warn("Cannot get docID of " + pdf);
    return docID;
  }

  logger.info("docID = " + JSON.stringify(docID));
  const t = await getJson(E.toUnion(docID), pdf);

  if (t == undefined) {
    logger.warn(pdf + " is not valid.");
    return E.right(jsonDB);
  }

  const json = t[0];
  const dbID = t[1];

  if (userSpecifiedTitle != undefined) {
    json[ENTRY_TITLE] = userSpecifiedTitle;
  }
  json[ENTRY_COMMENTS] = comments;
  json[ENTRY_TAGS] = tags;

  if (jsonDB.hasOwnProperty(dbID)) {
    logger.warn(
      pdf +
        " is duplicated. You can find another file in " +
        jsonDB[dbID][ENTRY_PATH] +
        "."
    );
    console.warn("mv ", '"' + pdf + '" duplicated');
    return E.right(jsonDB);
  }

  // TODO: Condition of json[ENTRY_ID_TYPE] != "path" is not good
  if (renameUsingTitle && json[ENTRY_ID_TYPE] != "path") {
    const newFilename = path.join(
      path.dirname(pdf),
      json[ENTRY_TITLE].replace(/[/\\?%*:|"<>.]/g, "") +
        " " +
        path.basename(pdf)
    );
    const oldFileneme = json[ENTRY_PATH];
    json[ENTRY_PATH] = newFilename;

    if (fs.existsSync(path.join(papersDir, newFilename))) {
      logger.warn(newFilename + " already exists. Skip registration.");
      return E.right(jsonDB);
    }
    fs.renameSync(
      path.join(papersDir, oldFileneme),
      path.join(papersDir, newFilename)
    );
    logger.info("Rename " + oldFileneme + " to " + newFilename);
  }

  jsonDB[dbID] = json;

  if (!validateJsonDB(jsonDB, undefined)) {
    throw new Error(
      "validateJsonDB failed!\n" + JSON.stringify(jsonDB, null, 2)
    );
  }

  return E.right(jsonDB);
}

async function genDB(papersDir: string, bookDirsStr: string, dbName: string) {
  papersDir = path.resolve(papersDir);
  let bookDirs = bookDirsStr == "" ? [] : bookDirsStr.split(",");
  for (let i = 0; i < bookDirs.length; i++) {
    bookDirs[i] = path.resolve(bookDirs[i]);
    if (bookDirs[i].startsWith(papersDir)) {
      bookDirs[i] = bookDirs[i].replace(papersDir, "");
    }
  }

  if (!fs.existsSync(papersDir)) {
    logger.warn("papersDir:", papersDir + " is not exist.");
    return;
  }
  for (const bd of bookDirs) {
    if (!fs.existsSync(path.join(papersDir, bd))) {
      logger.warn("bd:", path.join(papersDir, bd) + " is not exist.");
      return;
    }
  }

  let bookDB = new Object();
  let jsonDB: JsonDB = {};
  let exstingPdfs: string[] = [];
  if (fs.existsSync(path.join(papersDir, dbName))) {
    jsonDB = JSON.parse(
      fs.readFileSync(path.join(papersDir, dbName)).toString()
    );
    for (const id of Object.keys(jsonDB)) {
      exstingPdfs.push(jsonDB[id][ENTRY_PATH]);
    }
  }

  let pdfs = walkPDF(papersDir);
  pdfs.sort();
  pdfs = pdfs.filter((p) => !p.includes(JENDELEY_NO_TRACK));
  for (const p of pdfs) {
    if (exstingPdfs.includes(p)) {
      continue;
    }

    logger.info("Processing " + p);
    let isBook = false;
    for (const bd of bookDirs) {
      if (bookDB[bd] == undefined) {
        bookDB[bd] = {};
      }
      if (p.startsWith(bd)) {
        bookDB[bd][p] = new Object();
        isBook = true;
        const docID = await getDocID(p, papersDir, true, undefined);
        if (E.isRight(docID)) {
          const t = await getJson(E.toUnion(docID), p);
          if (t != undefined && t[0][ENTRY_ID_TYPE] == ID_TYPE_ISBN) {
            const json = t[0];
            bookDB[bd][p] = json;
            bookDB[bd]["id"] = t[1];
          }
        }
      }
    }

    if (!isBook) {
      const newDB = await registerNonBookPDF(
        papersDir,
        p,
        jsonDB,
        undefined,
        "",
        [],
        false,
        undefined
      );
      if (E.isRight(newDB)) {
        jsonDB = E.toUnion(newDB);
      }
    }
  }

  for (const bookDir of Object.keys(bookDB)) {
    let bookInfo: Object | undefined = undefined;
    let bookID: string | undefined = "";
    for (const path of Object.keys(bookDB[bookDir])) {
      if (
        bookDB[bookDir][path] != undefined &&
        bookDB[bookDir][path][ENTRY_ID_TYPE] == ID_TYPE_ISBN
      ) {
        bookInfo = bookDB[bookDir][path];
        bookID = bookDB[bookDir]["id"];
      }
    }
    if (bookInfo != undefined && bookID != undefined) {
      for (const chapterPath of Object.keys(bookDB[bookDir])) {
        const chapterID = bookID + "_" + path.basename(chapterPath);
        let chapterInfo = JSON.parse(JSON.stringify(bookInfo));
        chapterInfo[ENTRY_TITLE] = path.join(
          chapterInfo[ENTRY_TITLE],
          path.basename(chapterPath, ".pdf")
        );
        chapterInfo[ENTRY_ID_TYPE] = ID_TYPE_BOOK;
        chapterInfo[ENTRY_PATH] = chapterPath;
        if (jsonDB.hasOwnProperty(chapterID)) {
          logger.warn(chapterID, " is already registered.");
        }
        if (isValidJsonEntry(chapterInfo)) {
          jsonDB[chapterID] = chapterInfo;
        }
      }
    }
  }

  let registeredPdfs: string[] = [];
  for (const id of Object.keys(jsonDB)) {
    registeredPdfs.push(jsonDB[id][ENTRY_PATH]);
  }

  const notRegisterdPdfs = pdfs.filter((x) => !registeredPdfs.includes(x));

  if (notRegisterdPdfs.length > 0) {
    logger.warn(
      notRegisterdPdfs.length +
        " files are not registered. Please edit edit_and_run.sh and run it so that we can find IDs."
    );

    // TODO: For Windows.
    const registerShellscript = "edit_and_run.sh";
    let commands = `#! /bin/bash
#
# Sorry! This script works only on Linux or MacOS.
#
# Please edit and run this script to rename files
# which are not registered to the database.
# You need to specify DOI or ISBN for each files.
#
# To specify DOI, change the filename to include
# [jendeley doi <DOI replaced all delimiters with underscore>].
# For example, "cyclone [jendeley doi 10_1145_512529_512563].pdf".
#
# To specify ISBN, change the filename to include
# [jendeley isbn <ISBN>]. For example,
# "hoge [jendeley isbn 9781467330763].pdf".
#
# If you don't register PDFs, please rename them to include
# [jendeley no track].  For example, "hoge [jendeley no track].pdf".
`;
    for (const nr of notRegisterdPdfs) {
      commands =
        commands +
        "mv " +
        '"' +
        path.join(papersDir, nr) +
        '"' +
        ' "' +
        path.join(papersDir, nr) +
        '"\n';
    }
    fs.writeFileSync(registerShellscript, commands);
  }

  try {
    const dbPath = path.join(papersDir, dbName);

    if (!validateJsonDB(jsonDB, dbPath)) {
      throw new Error("validateJsonDB failed!");
    }

    fs.writeFileSync(dbPath, JSON.stringify(jsonDB, null, 2));
  } catch (err) {
    logger.warn(err);
  }
}

export {
  genDB,
  genDummyDB,
  getJson,
  getDoiJSON,
  getTitleFromPath,
  registerNonBookPDF,
  registerWeb,
};

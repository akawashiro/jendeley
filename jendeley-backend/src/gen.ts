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
  ID_TYPE_URL,
  ARXIV_API_URL,
  JENDELEY_VERSION,
  DB_META_KEY,
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
  BookEntry,
  DBEntry,
} from "./db_schema";
import * as E from "fp-ts/lib/Either";
import { loadDB, saveDB } from "./load_db";
import {
  concatDirs,
  isChild,
  isEqualDirs,
  pathStrToDirs,
  showDirs,
} from "./path_util";

function getRegisterdFiles(jsonDB: JsonDB) {
  let registeredFiles: string[][] = [];
  for (const id of Object.keys(jsonDB)) {
    const e = jsonDB[id];
    if (e.idType == "url" || e.idType == "meta") {
      continue;
    } else {
      registeredFiles.push(e.path);
    }
  }
  return registeredFiles;
}

function walkPDFDFS(dir: string[]): string[][] {
  if (!fs.existsSync(concatDirs(dir))) {
    return [];
  } else if (fs.lstatSync(concatDirs(dir)).isDirectory()) {
    const ds = fs.readdirSync(concatDirs(dir), { withFileTypes: true });
    var ret: string[][] = [];
    ds.forEach((d) => {
      ret = ret.concat(walkPDFDFS(dir.concat([d.name])));
    });
    return ret;
  } else if (
    path.extname(concatDirs(dir)) == ".pdf" &&
    !dir.includes("_Note")
  ) {
    // TODO: Ignore general pattern
    return [dir];
  } else {
    return [];
  }
}

// All paths returned from walkPDF are relative path from papersDir.
function walkPDF(papersDir: string[]): string[][] {
  let r: string[][] = [];
  const pdfs = walkPDFDFS(papersDir);
  for (const pd of pdfs) {
    const pf = concatDirs(papersDir);
    const pdf = concatDirs(pd);
    r.push(
      pdf
        .replace(pf, "")
        .split(path.sep)
        .filter((p) => p != "")
    );
  }
  return r;
}

function getTitleFromPath(pdf: string[]): string {
  const basename = path.basename(pdf[pdf.length - 1], ".pdf");
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
  pathPDF: string[]
): Promise<
  [ArxivEntry | DoiEntry | IsbnEntry | PathEntry, string] | undefined
> {
  let json_r: ArxivEntry | DoiEntry | IsbnEntry | PathEntry | undefined =
    undefined;
  let db_id: string | undefined = undefined;

  if (docID.docIDType == "arxiv") {
    let dataFromArxiv = await getArxivJson(docID.arxiv);
    if (dataFromArxiv != undefined) {
      let json: ArxivEntry = {
        path: pathPDF,
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
          pathPDF
      );
    }
  }
  if (
    docID.docIDType == "doi" &&
    (json_r == undefined || json_r[ENTRY_TITLE] == undefined)
  ) {
    let dataFromCrossref = await getDoiJSON(docID.doi);
    if (dataFromCrossref != undefined) {
      let json: DoiEntry = {
        path: pathPDF,
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
          pathPDF
      );
    }
  }
  if (
    docID.docIDType == "isbn" &&
    (json_r == undefined || json_r[ENTRY_TITLE] == undefined)
  ) {
    let dataFromNodeIsbn = await getIsbnJson(docID.isbn);
    if (dataFromNodeIsbn != undefined) {
      let json: IsbnEntry = {
        path: pathPDF,
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
          pathPDF
      );
    }
  }
  if (
    docID.docIDType == "path" &&
    (json_r == undefined || json_r[ENTRY_TITLE] == undefined)
  ) {
    let json: PathEntry = {
      path: pathPDF,
      title: docID.path.join(path.sep),
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
        pathPDF +
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
      path: [crypto.randomBytes(40).toString("hex")],
      title: crypto.randomBytes(40).toString("hex"),
      tags: [],
      userSpecifiedTitle: undefined,
      comments: crypto.randomBytes(40).toString("hex"),
    };
    jsonDB[id] = e;
  }

  saveDB(jsonDB, [output]);
}

function registerWeb(
  jsonDB: JsonDB,
  url: string,
  title: string,
  comments: string,
  tags: string[]
): E.Either<string, JsonDB> {
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
  const docID: DocID = { docIDType: "url", url: url };
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
    const id = "url_" + url;
    if (id in jsonDB) {
      return E.left(
        "Failed to register url_" +
          url +
          ". Because " +
          url +
          " is already registered."
      );
    } else {
      jsonDB[id] = json;
      logger.info("Register url_" + url);

      return E.right(jsonDB);
    }
  } else {
    return E.left(
      "Failed to register url_" + url + ". Because got JSON is not valid."
    );
  }
}

async function registerNonBookPDF(
  papersDir: string[],
  pdf: string[],
  jsonDB: JsonDB,
  userSpecifiedTitle: string | undefined,
  comments: string,
  tags: string[],
  renameUsingTitle: boolean,
  downloadUrl: string | undefined
): Promise<E.Either<string, [string, DBEntry]>> {
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
  if (!validateJsonDB(jsonDB, undefined)) {
    logger.fatal("validateJsonDB failed in registerNonBookPDF");
    process.exit(1);
  }

  const docID = await getDocID(pdf, papersDir, false, downloadUrl);

  if (E.isLeft(docID)) {
    logger.warn("Cannot get docID of " + pdf);
    return docID;
  }

  logger.info("docID = " + JSON.stringify(docID));
  const t = await getJson(E.toUnion(docID), pdf);

  if (t == undefined) {
    return E.left(pdf + " is not valid.");
  }

  const json = t[0];
  const dbID = t[1];

  if (userSpecifiedTitle != undefined) {
    json[ENTRY_TITLE] = userSpecifiedTitle;
  }
  json[ENTRY_COMMENTS] = comments;
  json[ENTRY_TAGS] = tags;

  if (jsonDB.hasOwnProperty(dbID)) {
    // TODO: Make shell script to delete duplicated files.
    console.warn("mv ", '"' + pdf + '" duplicated');
    return E.left(
      pdf +
        " is duplicated. You can find another file in " +
        jsonDB[dbID][ENTRY_PATH] +
        "."
    );
  }

  // TODO: Condition of json[ENTRY_ID_TYPE] != "path" is not good
  if (renameUsingTitle && json[ENTRY_ID_TYPE] != "path") {
    let newFilename: string[] = json[ENTRY_PATH];
    newFilename[newFilename.length - 1] =
      json[ENTRY_TITLE].replace(/[/\\?%*:|"<>.]/g, "") +
      " " +
      pdf[pdf.length - 1];
    const oldFilename = json[ENTRY_PATH];
    json[ENTRY_PATH] = newFilename;

    if (fs.existsSync(concatDirs(papersDir.concat(newFilename)))) {
      return E.left(newFilename + " already exists. Skip registration.");
    }
    fs.renameSync(
      concatDirs(papersDir.concat(oldFilename)),
      concatDirs(papersDir.concat(newFilename))
    );
    logger.info("Rename " + oldFilename + " to " + newFilename);
  }

  return E.right([dbID, json]);
}

async function genDB(
  papersDirUserArg: string,
  bookDirsStr: string,
  dbName: string,
  deleteUnreachableFiles: boolean
) {
  const papersDir = pathStrToDirs(path.resolve(papersDirUserArg));
  logger.info(
    "papersDirUserArg = " +
      papersDirUserArg +
      " path.resolve(papersDirUserArg) = " +
      path.resolve(papersDirUserArg) +
      " papersDir = " +
      showDirs(papersDir)
  );
  let bookDirStrs = bookDirsStr == "" ? [] : bookDirsStr.split(",");
  let bookDirs: string[][] = [];
  for (let i = 0; i < bookDirStrs.length; i++) {
    const pf = path.resolve(papersDirUserArg);
    const bf = path.resolve(bookDirStrs[i]);
    if (bf.startsWith(pf)) {
      bookDirs[i] = pathStrToDirs(bf.replace(pf, ""));
    } else {
      logger.fatal("Book directory " + bf + " is not in papers directory" + pf);
    }
  }

  if (!fs.existsSync(concatDirs(papersDir))) {
    logger.fatal("papersDir:", concatDirs(papersDir) + " is not exist.");
    process.exit(1);
  }
  for (const bd of bookDirs) {
    if (!fs.existsSync(concatDirs(papersDir.concat(bd)))) {
      logger.fatal(
        "book directory:" + concatDirs(papersDir.concat(bd)) + " is not exist."
      );
      process.exit(1);
    }
  }

  if (deleteUnreachableFiles) {
    if (!fs.existsSync(concatDirs(papersDir.concat([dbName])))) {
      logger.fatal(
        "You use --delete_unreachable_files but " +
          concatDirs(papersDir.concat([dbName])) +
          " does not exist."
      );
      process.exit(1);
    }

    let jsonDB = loadDB(papersDir.concat([dbName]), true);
    let deletedIDs: string[] = [];

    for (const id of Object.keys(jsonDB)) {
      const e = jsonDB[id];
      if (e.idType != "url" && e.idType != "meta") {
        const p = e.path;
        if (!fs.existsSync(concatDirs(papersDir.concat(p)))) {
          logger.warn(p + " does not exist. Delete entry " + id);
          deletedIDs.push(id);
        }
      }
    }
    for (const id of deletedIDs) {
      delete jsonDB[id];
    }

    saveDB(jsonDB, papersDir.concat([dbName]));
  }

  let bookChapters: {
    [key: string]: {
      isbnEntry: [IsbnEntry, string] | undefined;
      pdfs: string[][];
    };
  } = {};
  let jsonDB: JsonDB = {};
  jsonDB[DB_META_KEY] = { idType: "meta", version: JENDELEY_VERSION };
  let exstingPdfs: string[][] = [];
  if (fs.existsSync(concatDirs(papersDir.concat([dbName])))) {
    jsonDB = loadDB(papersDir.concat([dbName]), false);
    exstingPdfs = getRegisterdFiles(jsonDB);
  }

  let pdfs = walkPDF(papersDir);
  pdfs.sort();
  pdfs = pdfs.filter((p) => !p.includes(JENDELEY_NO_TRACK));
  for (const p of pdfs) {
    let existsInDB = false;
    for (const e of exstingPdfs) {
      if (isEqualDirs(e, p)) {
        existsInDB = true;
      }
    }
    if (existsInDB) {
      continue;
    }

    logger.info("Processing " + showDirs(p));
    let isBook = false;
    for (const bd of bookDirs) {
      if (bookChapters[concatDirs(papersDir.concat(bd))] == undefined) {
        bookChapters[concatDirs(papersDir.concat(bd))] = {
          isbnEntry: undefined,
          pdfs: [],
        };
      }

      if (isChild(papersDir.concat(p), papersDir.concat(bd))) {
        isBook = true;
        const docID = await getDocID(p, papersDir, true, undefined);
        bookChapters[concatDirs(papersDir.concat(bd))].pdfs.push(p);
        if (E.isRight(docID)) {
          const i: DocID = E.toUnion(docID);
          const t = await getJson(i, p);
          if (
            t != undefined &&
            t[0][ENTRY_ID_TYPE] == ID_TYPE_ISBN &&
            i.docIDType == "isbn"
          ) {
            bookChapters[concatDirs(papersDir.concat(bd))].isbnEntry = [
              t[0],
              i.isbn,
            ];
          }
        }
      }
    }

    if (!isBook) {
      const idEntryOrError = await registerNonBookPDF(
        papersDir,
        p,
        jsonDB,
        undefined,
        "",
        [],
        false,
        undefined
      );
      if (E.isRight(idEntryOrError)) {
        const t: [string, DBEntry] = E.toUnion(idEntryOrError);
        jsonDB[t[0]] = t[1];
      }
    }
  }

  for (const bookDir of Object.keys(bookChapters)) {
    let bookInfo = bookChapters[bookDir].isbnEntry;
    if (bookInfo == undefined) {
      if (bookChapters[bookDir].pdfs.length > 0) {
        logger.warn(
          "PDFs in " + bookDir + " are ignored. Because we cannot find no ISBN."
        );
      }
      continue;
    }
    const isbnEntry: IsbnEntry = bookInfo[0];
    const isbn: string = bookInfo[1];

    for (const pdf of bookChapters[bookDir].pdfs) {
      let title = "";
      if (isbnEntry.dataFromNodeIsbn["title"] != undefined) {
        title =
          isbnEntry.dataFromNodeIsbn["title"] +
          "_" +
          path.basename(pdf[pdf.length - 1], ".pdf");
      } else {
        title = path.join(bookDir, path.basename(pdf[pdf.length - 1], ".pdf"));
      }

      // TODO: Should we use userSpecifiedTitle here? Otherwise, we can rewrite
      // isbnEntry.dataFromNodeIsbn["title"].
      const bookEntry: BookEntry = {
        idType: "book",
        path: pdf,
        tags: [],
        comments: "",
        userSpecifiedTitle: title,
        dataFromNodeIsbn: isbnEntry.dataFromNodeIsbn,
      };
      const chapterID =
        "book_" + isbn + "_" + path.basename(pdf[pdf.length - 1]);
      jsonDB[chapterID] = bookEntry;
    }
  }

  let registeredPdfs: string[][] = getRegisterdFiles(jsonDB);

  let notRegisterdPdfs: string[][] = [];
  for (const p of pdfs) {
    let registered = false;
    for (const r of registeredPdfs) {
      if (isEqualDirs(p, r)) {
        registered = true;
      }
    }
    if (!registered) {
      notRegisterdPdfs.push(p);
    }
  }

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
        concatDirs(papersDir.concat(nr)) +
        '"' +
        ' "' +
        concatDirs(papersDir.concat(nr)) +
        '"\n';
    }
    fs.writeFileSync(registerShellscript, commands);
  }

  const dbPath = papersDir.concat([dbName]);
  saveDB(jsonDB, dbPath);
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

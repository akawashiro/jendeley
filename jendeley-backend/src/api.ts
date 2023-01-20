import url from "url";
import base_64 from "base-64";
import { logger } from "./logger";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import cheerio from "cheerio";
import {
  JENDELEY_NO_TRACK,
  ENTRY_ID_TYPE,
  ID_TYPE_URL,
  ID_TYPE_ISBN,
  ID_TYPE_BOOK,
  ID_TYPE_DOI,
  ENTRY_COMMENTS,
  ENTRY_TAGS,
  ID_TYPE_ARXIV,
  ID_TYPE_PATH,
  ENTRY_PATH,
  DB_META_KEY,
} from "./constants";
import {
  ApiEntry,
  ApiDB,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
  ApiResponse,
  RequestGetPdfFromFile,
} from "./api_schema";
import https from "https";
import http from "http";
import { registerWeb, registerNonBookPDF } from "./gen";
import {
  ArxivEntry,
  DBEntry,
  DoiEntry,
  JsonDB,
  PathEntry,
  UrlEntry,
} from "./db_schema";
import { Either, genLeft, genRight, isRight } from "./either";
import { loadDB, saveDB } from "./load_db";
import { concatDirs } from "./path_util";

function checkEntry(entry: ApiEntry) {
  if (entry.idType == "url") {
    if (entry.title == undefined || entry.path != undefined) {
      logger.fatal(
        "Check failed in checkEntry: id = " +
          entry.id +
          " entry = " +
          JSON.stringify(entry, undefined, 2)
      );
      process.exit(1);
    }
  } else {
    if (entry.title == undefined || entry.path == undefined) {
      logger.fatal(
        "Check failed in checkEntry: id = " +
          entry.id +
          " entry = " +
          JSON.stringify(entry, undefined, 2)
      );
      process.exit(1);
    }
  }
}

function getEntry(id: string, jsonDB: JsonDB): ApiEntry {
  if (jsonDB[id] == undefined) {
    logger.fatal("json[" + id + "] != undefined");
    process.exit(1);
  }

  const entryInDB = jsonDB[id];

  if (entryInDB.idType == "meta") {
    logger.fatal("metadata = " + JSON.stringify(entryInDB));
    process.exit(1);
  }

  if (entryInDB.idType == "url") {
    const urlEntry: UrlEntry = entryInDB;
    let authors: string[] = [];
    const abstract = "";

    const e = {
      id: id,
      idType: urlEntry.idType,
      url: urlEntry.url,
      title: urlEntry.title,
      authors: authors,
      tags: urlEntry.tags,
      comments: urlEntry.comments,
      abstract: abstract,
      path: undefined,
      year: undefined,
      publisher: "",
    };
    checkEntry(e);
    return e;
  } else if (
    entryInDB.idType == ID_TYPE_ISBN ||
    entryInDB.idType == ID_TYPE_BOOK
  ) {
    let authors: string[] = [];
    if (entryInDB.dataFromNodeIsbn["authors"] != undefined) {
      authors = entryInDB.dataFromNodeIsbn["authors"];
    }
    let year: number | undefined = undefined;
    if (
      entryInDB.dataFromNodeIsbn["publishedDate"] != undefined &&
      !isNaN(parseInt(entryInDB.dataFromNodeIsbn["publishedDate"].substr(0, 4)))
    ) {
      year = parseInt(entryInDB.dataFromNodeIsbn["publishedDate"].substr(0, 4));
    }
    let publisher: string = "";
    if (entryInDB.dataFromNodeIsbn["publisher"] != undefined) {
      publisher = entryInDB.dataFromNodeIsbn["publisher"];
    }
    const title =
      entryInDB.userSpecifiedTitle != undefined
        ? entryInDB.userSpecifiedTitle
        : entryInDB.dataFromNodeIsbn["title"];
    const abstract = "";
    const p = entryInDB.path.join(path.sep);

    const e = {
      id: id,
      idType: entryInDB.idType,
      title: title,
      url: undefined,
      authors: authors,
      tags: entryInDB.tags,
      comments: entryInDB.comments,
      abstract: abstract,
      path: p,
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else if (entryInDB.idType == ID_TYPE_DOI) {
    const doiEntry: DoiEntry = entryInDB;
    const title: string = doiEntry.dataFromCrossref["title"];
    let authors: string[] = [];
    if (doiEntry.dataFromCrossref["author"] != undefined) {
      for (let i = 0; i < doiEntry.dataFromCrossref["author"].length; i++) {
        authors.push(
          doiEntry.dataFromCrossref["author"][i]["given"] +
            " " +
            doiEntry.dataFromCrossref["author"][i]["family"]
        );
      }
    }
    let year: number | undefined = undefined;
    if (doiEntry.dataFromCrossref["published-print"] != undefined) {
      year = doiEntry.dataFromCrossref["published-print"]["date-parts"][0][0];
    } else if (doiEntry.dataFromCrossref["created"] != undefined) {
      year = doiEntry.dataFromCrossref["created"]["date-parts"][0][0];
    }
    const publisher: string =
      doiEntry.dataFromCrossref["event"] != undefined
        ? doiEntry.dataFromCrossref["event"]
        : "";
    const abstract: string =
      doiEntry.dataFromCrossref["abstract"] != undefined
        ? doiEntry.dataFromCrossref["abstract"]
        : "";
    const tags = doiEntry.tags;
    const comments = doiEntry.comments;

    const e = {
      id: id,
      idType: entryInDB.idType,
      title: title,
      authors: authors,
      url: undefined,
      tags: tags,
      comments: comments,
      abstract: abstract,
      path: doiEntry.path.join(path.sep),
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else if (entryInDB.idType == ID_TYPE_ARXIV) {
    const arxivEntry: ArxivEntry = entryInDB;
    const title: string = arxivEntry.dataFromArxiv["title"];
    let authors: string[] = [];
    if (arxivEntry.dataFromArxiv["author"].length != undefined) {
      for (let i = 0; i < arxivEntry.dataFromArxiv["author"].length; i++) {
        authors.push(arxivEntry.dataFromArxiv["author"][i]["name"]);
      }
    } else {
      authors.push(arxivEntry.dataFromArxiv["author"]["name"]);
    }
    let year: number | undefined = undefined;
    if (
      arxivEntry.dataFromArxiv["published"] != undefined &&
      !isNaN(parseInt(arxivEntry.dataFromArxiv["published"].substr(0, 4)))
    ) {
      year = parseInt(arxivEntry.dataFromArxiv["published"].substr(0, 4));
    }
    const publisher: string =
      arxivEntry.dataFromArxiv["event"] != undefined
        ? arxivEntry.dataFromArxiv["event"]
        : "";
    const abstract: string =
      arxivEntry.dataFromArxiv["summary"] != undefined
        ? arxivEntry.dataFromArxiv["summary"]
        : "";

    const e = {
      id: id,
      idType: arxivEntry.idType,
      title: title,
      url: undefined,
      authors: authors,
      tags: arxivEntry.tags,
      abstract: abstract,
      comments: arxivEntry.comments,
      path: arxivEntry.path.join(path.sep),
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else {
    if (entryInDB.idType != ID_TYPE_PATH) {
      logger.fatal(
        jsonDB[id][ENTRY_ID_TYPE] +
          " must be " +
          ID_TYPE_PATH +
          " but id: " +
          id +
          " is not."
      );
      process.exit(1);
    }
    const pathEntry: PathEntry = entryInDB;
    const authors = [];
    const abstract =
      jsonDB[id]["abstract"] != undefined ? jsonDB[id]["abstract"] : "";
    const e = {
      id: id,
      idType: pathEntry.idType,
      title: pathEntry.title,
      url: undefined,
      authors: authors,
      tags: pathEntry.tags,
      abstract: abstract,
      comments: pathEntry.comments,
      path: pathEntry.path.join(path.sep),
      year: undefined,
      publisher: undefined,
    };
    checkEntry(e);
    return e;
  }
}

function updateEntry(request: Request, response: Response, dbPath: string[]) {
  logger.info("Get a update_entry request url = " + request.url);
  const entry_o = request.body;

  // TODO: Is there any more sophisticated way to check user defined type?
  if (
    entry_o["id"] != undefined &&
    entry_o[ENTRY_TAGS] != undefined &&
    entry_o[ENTRY_COMMENTS] != undefined
  ) {
    const entry = entry_o as ApiEntry;
    let jsonDB = loadDB(dbPath, false);
    if (jsonDB[entry.id] != undefined) {
      logger.info("Update DB with entry = " + JSON.stringify(entry));
      jsonDB[entry.id][ENTRY_TAGS] = entry.tags;
      jsonDB[entry.id][ENTRY_COMMENTS] = entry.comments;
    }

    saveDB(jsonDB, dbPath);

    const r: ApiResponse = {
      isSucceeded: true,
      message: "Update " + entry_o["id"],
    };
    response.status(200).json(r);
  } else {
    logger.warn(
      "Object from the client is not legitimated. entry_o = " +
        JSON.stringify(entry_o)
    );

    const r: ApiResponse = {
      isSucceeded: false,
      message: "Failed update. entry_o = " + JSON.stringify(entry_o),
    };
    response.status(500).json(r);
  }

  logger.info("Sent a response from update_entry");
}

function getPdf(request: Request, response: Response, dbPath: string[]) {
  logger.info("Get a get_pdf request", request.url);
  const params = url.parse(request.url, true).query;
  const pdfPath = unescape(base_64.decode(params.file as string));
  const pdf = fs.readFileSync(
    path.join(concatDirs(dbPath.slice(0, dbPath.length - 1)), pdfPath)
  );

  response.writeHead(200, {
    "Content-Type": "application/pdf",
  });

  response.end(pdf);
  logger.info("Sent a response from get_pdf");
}

function getDB(request: Request, response: Response, dbPath: string[]) {
  logger.info("Get a get_db request" + request.url);
  const jsonDB = loadDB(dbPath, false);
  let dbResponse: ApiDB = [];

  for (const id of Object.keys(jsonDB)) {
    if (jsonDB[id] == undefined) continue;
    if (id == DB_META_KEY) continue;
    const e = getEntry(id, jsonDB);
    dbResponse.push(e);
  }

  response.status(200).json(dbResponse);
  logger.info("Sent a response from get_db");
}

// Rewrite using Either
async function getTitleFromUrl(url: string): Promise<Either<string, string>> {
  let { got } = await import("got");

  try {
    const res = await got(url);
    const root = cheerio.load(res.body);
    const title = root("title").text();
    return genRight(title);
  } catch {
    const err = "Failed to get title from " + url;
    logger.warn(err);
    return genLeft(err);
  }
}

async function addWebFromUrl(
  httpRequest: Request,
  response: Response,
  dbPath: string[]
) {
  const req = httpRequest.body as RequestGetWebFromUrl;
  logger.info(
    "Get a add_web_from_url request url = " +
      httpRequest.url +
      " req = " +
      JSON.stringify(req)
  );

  let title = "";
  if (req.title !== "") {
    title = req.title;
  } else {
    const titleOrError = await getTitleFromUrl(req.url);
    if (titleOrError._tag === "left") {
      const r: ApiResponse = {
        isSucceeded: false,
        message: titleOrError.left,
      };
      response.status(500).json(r);
      return;
    } else {
      title = titleOrError.right;
    }
  }

  const jsonDB = loadDB(dbPath, false);
  const date = new Date();
  const date_tag = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  const tags = req.tags;
  tags.push(date_tag);
  const newDBOrError = registerWeb(jsonDB, req.url, title, req.comments, tags);

  if (newDBOrError._tag === "right") {
    saveDB(newDBOrError.right, dbPath);

    const r: ApiResponse = {
      isSucceeded: true,
      message: "addWebFromUrl succeeded",
    };
    response.status(200).json(r);
  } else {
    const err: string = newDBOrError.left;
    const r: ApiResponse = {
      isSucceeded: false,
      message: err,
    };
    response.status(500).json(r);
  }

  logger.info("Sent a response from add_web_from_url");
}

async function addPdfFromFile(
  httpRequest: Request,
  response: Response,
  dbPath: string[]
) {
  // TODO: Handle RequestGetPdfFromFile.isbn/doi/comments/tags
  const req = httpRequest.body as RequestGetPdfFromFile;
  logger.info(
    "Get a add_pdf_from_file request url = " +
      httpRequest.url +
      " req.filename = " +
      JSON.stringify(req.filename)
  );

  if (
    fs.existsSync(
      concatDirs(dbPath.slice(0, dbPath.length - 1).concat([req.filename]))
    )
  ) {
    const err: string = req.filename + " is already exists.";
    const r: ApiResponse = {
      isSucceeded: false,
      message: err,
    };
    response.status(500).json(r);
  } else {
    const data = req.fileBase64.replace(/^data:application\/pdf+;base64,/, "");
    const buf = new Buffer(data, "base64");

    const fullpathOfUploadFile = concatDirs(
      dbPath.slice(0, dbPath.length - 1).concat([req.filename])
    );
    fs.writeFileSync(fullpathOfUploadFile, buf);

    const jsonDB = loadDB(dbPath, false);
    const date = new Date();
    const date_tag = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
    const tags = req.tags;
    tags.push(date_tag);
    const idEntryOrError = await registerNonBookPDF(
      dbPath.slice(0, dbPath.length - 1),
      [req.filename],
      jsonDB,
      undefined,
      req.comments,
      tags,
      req.filename == undefined,
      undefined
    );

    if (idEntryOrError._tag === "right") {
      const t: [string, DBEntry] = idEntryOrError.right;

      if (t[0] in jsonDB) {
        fs.rmSync(fullpathOfUploadFile);
        const r: ApiResponse = {
          isSucceeded: false,
          message:
            "addPdfFromFile failed. You have registered the same document already.",
        };
        response.status(500).json(r);
      } else {
        jsonDB[t[0]] = t[1];
        saveDB(jsonDB, dbPath);

        const r: ApiResponse = {
          isSucceeded: true,
          message: "addPdfFromFile succeeded",
        };
        response.status(200).json(r);
      }
    } else {
      fs.rmSync(fullpathOfUploadFile);
      const err: string = idEntryOrError.left;
      const r: ApiResponse = {
        isSucceeded: false,
        message: err,
      };
      response.status(500).json(r);
    }

    logger.info("Sent a response from add_pdf_from_file");
  }
}

async function addPdfFromUrl(
  httpRequest: Request,
  response: Response,
  dbPath: string[]
) {
  // TODO: Handle RequestGetPdfFromUrl.isbn/doi/comments/tags
  const req = httpRequest.body as RequestGetPdfFromUrl;
  logger.info(
    "Get a add_pdf_from_url request url = " +
      httpRequest.url +
      " req = " +
      JSON.stringify(req)
  );

  const filename =
    req.filename != undefined
      ? req.filename
      : "[jendeley download " + Date.now().toString() + "].pdf";

  if (
    fs.existsSync(
      concatDirs(dbPath.slice(0, dbPath.length - 1).concat([filename]))
    )
  ) {
    const err: string = filename + " is already exists.";
    const r: ApiResponse = {
      isSucceeded: false,
      message: err,
    };
    response.status(500).json(r);
  }

  const download = (uri: string, filename: string) => {
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0",
      },
    };

    if (uri.startsWith("https")) {
      return new Promise<void>((resolve, reject) =>
        https
          .request(uri, options, (res) => {
            res
              .pipe(fs.createWriteStream(filename))
              .on("close", resolve)
              .on("error", reject);
          })
          .end()
      );
    } else if (uri.startsWith("http")) {
      return new Promise<void>((resolve, reject) =>
        http
          .request(uri, options, (res) => {
            res
              .pipe(fs.createWriteStream(filename))
              .on("close", resolve)
              .on("error", reject);
          })
          .end()
      );
    }
  };

  const fullpathOfDownloadFile = concatDirs(
    dbPath.slice(0, dbPath.length - 1).concat([filename])
  );
  await download(req.url, fullpathOfDownloadFile);

  const jsonDB = loadDB(dbPath, false);
  const date = new Date();
  const date_tag = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  const tags = req.tags;
  tags.push(date_tag);
  const idEntryOrError = await registerNonBookPDF(
    dbPath.slice(0, dbPath.length - 1),
    [filename],
    jsonDB,
    undefined,
    req.comments,
    tags,
    req.filename == undefined,
    req.url
  );

  if (idEntryOrError._tag === "right") {
    const t: [string, DBEntry] = idEntryOrError.right;

    if (t[0] in jsonDB) {
      fs.rmSync(fullpathOfDownloadFile);
      const r: ApiResponse = {
        isSucceeded: false,
        message:
          "addPdfFromUrl failed. You have registered the same document already.",
      };
      response.status(500).json(r);
    } else {
      jsonDB[t[0]] = t[1];
      saveDB(jsonDB, dbPath);

      const r: ApiResponse = {
        isSucceeded: true,
        message: "addPdfFromUrl succeeded",
      };
      response.status(200).json(r);
    }
  } else {
    fs.rmSync(fullpathOfDownloadFile);
    const err: string = idEntryOrError.left;
    const r: ApiResponse = {
      isSucceeded: false,
      message: err,
    };
    response.status(500).json(r);
  }

  logger.info("Sent a response from add_pdf_from_url");
}

function deleteEntry(request: Request, response: Response, dbPath: string[]) {
  logger.info("Get a delete_entry request url = " + request.url);
  const entry_o = request.body;

  if (entry_o["id"] != undefined) {
    const entry = entry_o as ApiEntry;
    let jsonDB = loadDB(dbPath, false);
    if (
      jsonDB[entry.id] != undefined &&
      jsonDB[entry.id][ENTRY_PATH] != undefined
    ) {
      logger.info("Delete " + jsonDB[entry.id]["path"]);
      const oldFilename = concatDirs(
        dbPath.slice(0, dbPath.length - 1).concat(jsonDB[entry.id]["path"])
      );
      const dir = path.dirname(oldFilename);
      const newFilename = path.join(
        dir,
        path.basename(oldFilename, ".pdf") + " " + JENDELEY_NO_TRACK + ".pdf"
      );
      if (fs.existsSync(oldFilename) && !fs.existsSync(newFilename)) {
        logger.info("Rename " + oldFilename + " to " + newFilename);
        fs.renameSync(oldFilename, newFilename);
      } else {
        logger.warn("Failed to rename " + oldFilename + " to " + newFilename);
      }
      delete jsonDB[entry.id];
    } else if (
      jsonDB[entry.id] != undefined &&
      jsonDB[entry.id][ENTRY_PATH] == undefined &&
      jsonDB[entry.id][ENTRY_ID_TYPE] == ID_TYPE_URL
    ) {
      logger.info("Delete " + entry.id);
      delete jsonDB[entry.id];
    }

    saveDB(jsonDB, dbPath);

    const r: ApiResponse = {
      isSucceeded: true,
      message: JSON.stringify(entry) + " is deleted.",
    };
    response.status(200).json(r);
  } else {
    const msg =
      "Object from the client is not legitimated. entry_o = " +
      JSON.stringify(entry_o);
    const r: ApiResponse = {
      isSucceeded: false,
      message: msg,
    };
    logger.warn(msg);
    response.status(500).json(r);
  }

  logger.info("Sent a response from delete_entry");
}

export {
  getDB,
  deleteEntry,
  addWebFromUrl,
  updateEntry,
  addPdfFromUrl,
  addPdfFromFile,
  getPdf,
  getTitleFromUrl,
};

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
  ENTRY_TITLE,
  ENTRY_COMMENTS,
  ENTRY_TAGS,
  ID_TYPE_ARXIV,
  ID_TYPE_PATH,
  ENTRY_PATH,
} from "./constants";
import {
  ApiEntry,
  ApiDB,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
  ApiResponse,
} from "./api_schema";
import https from "https";
import http from "http";
import { registerWeb, registerNonBookPDF } from "./gen";
import { validateJsonDB } from "./validate_db";
import { ArxivEntry, DoiEntry, JsonDB, PathEntry, UrlEntry } from "./db_schema";
import * as E from "fp-ts/lib/Either";

function checkEntry(entry: ApiEntry) {
  if (entry.title == undefined || entry.path == undefined) {
    logger.fatal(
      "id = ",
      entry.id,
      "entry = ",
      JSON.stringify(entry, undefined, 2)
    );
  }
}

function getEntry(id: string, jsonDB: JsonDB): ApiEntry {
  if (jsonDB[id] == undefined) {
    throw Error("json[" + id + "] != undefined");
  }

  const entryInDB = jsonDB[id];
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
    const abstract = "";

    const e = {
      id: id,
      idType: entryInDB.idType,
      title: entryInDB.dataFromNodeIsbn["title"],
      url: undefined,
      authors: authors,
      tags: entryInDB.tags,
      comments: entryInDB.comments,
      abstract: abstract,
      path: entryInDB.path,
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else if (entryInDB.idType == ID_TYPE_DOI) {
    const doiEntry: DoiEntry = entryInDB;
    const title: string = doiEntry.dataFromCrossref["title"];
    const path: string = doiEntry.path;
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
      idType: jsonDB[id][ENTRY_ID_TYPE],
      title: title,
      authors: authors,
      url: undefined,
      tags: tags,
      comments: comments,
      abstract: abstract,
      path: path,
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
      path: arxivEntry.path,
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else {
    if (entryInDB.idType != ID_TYPE_PATH) {
      throw new Error(
        jsonDB[id][ENTRY_ID_TYPE] +
          " must be " +
          ID_TYPE_PATH +
          " but id: " +
          id +
          " is not."
      );
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
      path: pathEntry.path,
      year: undefined,
      publisher: undefined,
    };
    checkEntry(e);
    return e;
  }
}

function updateEntry(request: Request, response: Response, dbPath: string) {
  logger.info("Get a update_entry request url = " + request.url);
  const entry_o = request.body;

  // TODO: Is there any more sophisticated way to check user defined type?
  if (
    entry_o["id"] != undefined &&
    entry_o[ENTRY_TAGS] != undefined &&
    entry_o[ENTRY_COMMENTS] != undefined
  ) {
    const entry = entry_o as ApiEntry;
    let jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());
    if (jsonDB[entry.id] != undefined) {
      logger.info("Update DB with entry = " + JSON.stringify(entry));
      jsonDB[entry.id][ENTRY_TAGS] = entry.tags;
      jsonDB[entry.id][ENTRY_COMMENTS] = entry.comments;
    }

    if (!validateJsonDB(jsonDB, dbPath)) {
      throw new Error("validateJsonDB failed!");
    }

    fs.writeFileSync(dbPath, JSON.stringify(jsonDB));
  } else {
    logger.warn(
      "Object from the client is not legitimated. entry_o = " +
        JSON.stringify(entry_o)
    );
  }

  response.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
  });

  response.end();

  logger.info("Sent a response from update_entry");
}

function getPdf(request: Request, response: Response, db_path: string) {
  logger.info("Get a get_pdf request", request.url);
  const params = url.parse(request.url, true).query;
  const pdf_path = unescape(base_64.decode(params.file as string));
  const pdf = fs.readFileSync(path.join(path.dirname(db_path), pdf_path));

  response.writeHead(200, {
    "Content-Type": "application/pdf",
  });

  response.end(pdf);
  logger.info("Sent a response from get_pdf");
}

function getDB(request: Request, response: Response, dbPathDB: string) {
  logger.info("Get a get_db request" + request.url);
  const jsonDB = JSON.parse(fs.readFileSync(dbPathDB).toString());
  let db_response: ApiDB = [];

  for (const id of Object.keys(jsonDB)) {
    if (jsonDB[id] == undefined) continue;
    const e = getEntry(id, jsonDB);
    db_response.push(e);
  }

  response.json(db_response);
  logger.info("Sent a response from get_db");
}

// Rewrite using Either
async function getTitleFromUrl(url: string): Promise<string> {
  let { got } = await import("got");

  const res = await got(url);
  const root = cheerio.load(res.body);
  const title = root("title").text();
  return title;
}

async function addWebFromUrl(
  httpRequest: Request,
  response: Response,
  dbPath: string
) {
  const req = httpRequest.body as RequestGetWebFromUrl;
  logger.info(
    "Get a add_web_from_url request url = " +
      httpRequest.url +
      " req = " +
      JSON.stringify(req)
  );

  const jsonDB: JsonDB = JSON.parse(fs.readFileSync(dbPath).toString());
  const title = req.title == "" ? await getTitleFromUrl(req.url) : req.title;
  const date = new Date();
  const date_tag = date.toISOString().split("T")[0];
  const tags = req.tags;
  tags.push(date_tag);
  const newDBOrError = registerWeb(jsonDB, req.url, title, req.comments, tags);

  if (E.isRight(newDBOrError)) {
    if (!validateJsonDB(E.toUnion(newDBOrError), dbPath)) {
      throw new Error("validateJsonDB failed!");
    }

    fs.writeFileSync(dbPath, JSON.stringify(E.toUnion(newDBOrError)));

    const r: ApiResponse = {
      isSucceeded: true,
      message: "addPdfFromUrl succeeded",
    };
    response.status(200).json(r);
  } else {
    const err: string = E.toUnion(newDBOrError);
    const r: ApiResponse = {
      isSucceeded: false,
      message: err,
    };
    response.status(500).json(r);
  }

  logger.info("Sent a response from add_web_from_url");
}

async function addPdfFromUrl(
  httpRequest: Request,
  response: Response,
  dbPath: string
) {
  // TODO: Handle RequestGetPdfFromUrl.isbn/doi/comments/tags
  const req = httpRequest.body as RequestGetPdfFromUrl;
  logger.info(
    "Get a add_pdf_from_url request url = " +
      httpRequest.url +
      " req = " +
      JSON.stringify(req)
  );

  const filename = "[jendeley download " + Date.now().toString() + "].pdf";
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

  await download(req.url, path.join(path.dirname(dbPath), filename));
  const jsonDB: JsonDB = JSON.parse(fs.readFileSync(dbPath).toString());
  const date = new Date();
  const date_tag = date.toISOString().split("T")[0];
  const tags = req.tags;
  tags.push(date_tag);
  const newDBOrError = await registerNonBookPDF(
    path.dirname(dbPath),
    filename,
    jsonDB,
    req.title,
    req.comments,
    tags,
    true,
    req.url
  );

  if (E.isRight(newDBOrError)) {
    if (!validateJsonDB(E.toUnion(newDBOrError), dbPath)) {
      throw new Error("validateJsonDB failed!");
    }

    fs.writeFileSync(dbPath, JSON.stringify(E.toUnion(newDBOrError)));

    const r: ApiResponse = {
      isSucceeded: true,
      message: "addPdfFromUrl succeeded",
    };
    response.status(200).json(r);
  } else {
    const err: string = E.toUnion(newDBOrError);
    const r: ApiResponse = {
      isSucceeded: false,
      message: err,
    };
    response.status(500).json(r);
  }

  logger.info("Sent a response from add_pdf_from_url");
}

function deleteEntry(request: Request, response: Response, db_path: string) {
  logger.info("Get a delete_entry request url = " + request.url);
  const entry_o = request.body;

  if (entry_o["id"] != undefined) {
    const entry = entry_o as ApiEntry;
    let jsonDB = JSON.parse(fs.readFileSync(db_path).toString());
    if (
      jsonDB[entry.id] != undefined &&
      jsonDB[entry.id][ENTRY_PATH] != undefined
    ) {
      logger.info("Delete " + jsonDB[entry.id]["path"]);
      const old_filename = path.join(
        path.dirname(db_path),
        jsonDB[entry.id]["path"]
      );
      const dir = path.dirname(old_filename);
      const new_filename = path.join(
        dir,
        path.basename(old_filename, ".pdf") + " " + JENDELEY_NO_TRACK + ".pdf"
      );
      if (!fs.existsSync(old_filename)) {
        logger.info("Rename " + old_filename + " to " + new_filename);
        fs.renameSync(old_filename, new_filename);
      } else {
        logger.warn("Failed to rename " + old_filename + " to " + new_filename);
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

    if (!validateJsonDB(jsonDB, db_path)) {
      throw new Error("validateJsonDB failed!");
    }

    fs.writeFileSync(db_path, JSON.stringify(jsonDB));

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
  getPdf,
  getTitleFromUrl,
};

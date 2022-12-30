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
  Entry,
  DB,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
} from "./api_schema";
import https from "https";
import http from "http";
import { registerWeb, registerNonBookPDF } from "./gen";
import { validateJsonDB } from "./validate_db";
import { ArxivEntry, DoiEntry, PathEntry, UrlEntry } from "./db_schema";

function checkEntry(entry: Entry) {
  console.assert(
    entry.title != undefined && entry.path != undefined,
    "id = ",
    entry.id,
    "entry = ",
    JSON.stringify(entry, undefined, 2)
  );
}

function getEntry(id: string, jsonDB: any): Entry {
  console.assert(jsonDB[id] != undefined, "json[" + id + "] != undefined");

  if (jsonDB[id][ENTRY_ID_TYPE] == ID_TYPE_URL) {
    const urlEntry: UrlEntry = jsonDB[id];
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
    jsonDB[id][ENTRY_ID_TYPE] == ID_TYPE_ISBN ||
    jsonDB[id][ENTRY_ID_TYPE] == ID_TYPE_BOOK
  ) {
    const title: string = jsonDB[id][ENTRY_TITLE];
    const path: string = jsonDB[id]["path"];
    let authors: string[] = [];
    if (jsonDB[id]["authors"] != undefined) {
      authors = jsonDB[id]["authors"];
    }
    let year: number | undefined = undefined;
    if (
      jsonDB[id]["publishedDate"] != undefined &&
      !isNaN(parseInt(jsonDB[id]["publishedDate"].substr(0, 4)))
    ) {
      year = parseInt(jsonDB[id]["publishedDate"].substr(0, 4));
    }
    let publisher: string = "";
    if (jsonDB[id]["publisher"] != undefined) {
      publisher = jsonDB[id]["publisher"];
    }
    const tags =
      jsonDB[id][ENTRY_TAGS] != undefined ? jsonDB[id][ENTRY_TAGS] : [];
    const comments =
      jsonDB[id][ENTRY_COMMENTS] != undefined ? jsonDB[id][ENTRY_COMMENTS] : [];
    const abstract = "";

    const e = {
      id: id,
      idType: jsonDB[id][ENTRY_ID_TYPE],
      title: title,
      url: undefined,
      authors: authors,
      tags: tags,
      comments: comments,
      abstract: abstract,
      path: path,
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else if (jsonDB[id][ENTRY_ID_TYPE] == ID_TYPE_DOI) {
    const doiEntry: DoiEntry = jsonDB[id];
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
  } else if (jsonDB[id][ENTRY_ID_TYPE] == ID_TYPE_ARXIV) {
    const arxivEntry: ArxivEntry = jsonDB[id];
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
    if (jsonDB[id][ENTRY_ID_TYPE] != ID_TYPE_PATH) {
      throw new Error(
        jsonDB[id][ENTRY_ID_TYPE] +
          " must be " +
          ID_TYPE_PATH +
          " but id: " +
          id +
          " is not."
      );
    }
    const pathEntry: PathEntry = jsonDB[id];
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
    const entry = entry_o as Entry;
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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
  });

  response.end(pdf);
  logger.info("Sent a response from get_pdf");
}

function getDB(request: Request, response: Response, dbPathDB: string) {
  logger.info("Get a get_db request" + request.url);
  const jsonDB = JSON.parse(fs.readFileSync(dbPathDB).toString());
  let db_response: DB = [];

  for (const id of Object.keys(jsonDB)) {
    if (jsonDB[id] == undefined) continue;
    const e = getEntry(id, jsonDB);
    db_response.push(e);
  }

  response.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
  });

  response.end(JSON.stringify(db_response));
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
  dPath: string
) {
  const req = httpRequest.body as RequestGetWebFromUrl;
  logger.info(
    "Get a add_web_from_url request url = " +
      httpRequest.url +
      " req = " +
      JSON.stringify(req)
  );

  let jsonDB = JSON.parse(fs.readFileSync(dPath).toString());
  const title = req.title == "" ? await getTitleFromUrl(req.url) : req.title;
  const date = new Date();
  const date_tag = date.toISOString().split("T")[0];
  const tags = req.tags;
  tags.push(date_tag);
  jsonDB = registerWeb(jsonDB, req.url, title, req.comments, tags);

  if (!validateJsonDB(jsonDB, dPath)) {
    throw new Error("validateJsonDB failed!");
  }

  fs.writeFileSync(dPath, JSON.stringify(jsonDB));

  response.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
  });

  response.end();

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
  let jsonDB = JSON.parse(fs.readFileSync(dbPath).toString());
  const date = new Date();
  const date_tag = date.toISOString().split("T")[0];
  const tags = req.tags;
  tags.push(date_tag);
  jsonDB = await registerNonBookPDF(
    path.dirname(dbPath),
    filename,
    jsonDB,
    req.title,
    req.comments,
    tags,
    true,
    req.url
  );

  if (!validateJsonDB(jsonDB, dbPath)) {
    throw new Error("validateJsonDB failed!");
  }

  fs.writeFileSync(dbPath, JSON.stringify(jsonDB));

  response.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
  });

  response.end();

  logger.info("Sent a response from add_pdf_from_url");
}

function deleteEntry(request: Request, response: Response, db_path: string) {
  logger.info("Get a delete_entry request url = " + request.url);
  const entry_o = request.body;

  if (entry_o["id"] != undefined) {
    const entry = entry_o as Entry;
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

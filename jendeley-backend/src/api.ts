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
  ENTRY_URL,
  ENTRY_COMMENTS,
  ENTRY_TAGS,
} from "./constants";
import {
  Entry,
  DB,
  RequestGetPdfFromUrl,
  RequestGetWebFromUrl,
} from "./api_schema";
import https from "https";
import { registerWeb, registerNonBookPDF } from "./gen";
import { validateJsonDB } from "./validate_db";

function checkEntry(entry: Entry) {
  console.assert(
    entry.title != undefined && entry.path != undefined,
    "id = ",
    entry.id,
    "entry = ",
    JSON.stringify(entry, undefined, 2)
  );
}

function getEntry(id: string, json: any): Entry {
  console.assert(json[id] != undefined, "json[" + id + "] != undefined");

  if (json[id][ENTRY_ID_TYPE] == ID_TYPE_URL) {
    const title: string = json[id][ENTRY_TITLE];
    let authors: string[] = [];
    const tags = json[id][ENTRY_TAGS] != undefined ? json[id][ENTRY_TAGS] : [];
    const comments =
      json[id][ENTRY_COMMENTS] != undefined ? json[id][ENTRY_COMMENTS] : [];
    const abstract = "";

    const e = {
      id: id,
      idType: json[id][ENTRY_ID_TYPE],
      url: json[id][ENTRY_URL],
      title: title,
      authors: authors,
      tags: tags,
      comments: comments,
      abstract: abstract,
      path: "",
      year: undefined,
      publisher: "",
    };
    checkEntry(e);
    return e;
  } else if (
    json[id][ENTRY_ID_TYPE] == ID_TYPE_ISBN ||
    json[id][ENTRY_ID_TYPE] == ID_TYPE_BOOK
  ) {
    const title: string = json[id][ENTRY_TITLE];
    const path: string = json[id]["path"];
    let authors: string[] = [];
    if (json[id]["authors"] != undefined) {
      authors = json[id]["authors"];
    }
    let year: number | undefined = undefined;
    if (
      json[id]["publishedDate"] != undefined &&
      !isNaN(parseInt(json[id]["publishedDate"].substr(0, 4)))
    ) {
      year = parseInt(json[id]["publishedDate"].substr(0, 4));
    }
    let publisher: string = "";
    if (json[id]["publisher"] != undefined) {
      publisher = json[id]["publisher"];
    }
    const tags = json[id][ENTRY_TAGS] != undefined ? json[id][ENTRY_TAGS] : [];
    const comments =
      json[id][ENTRY_COMMENTS] != undefined ? json[id][ENTRY_COMMENTS] : [];
    const abstract = "";

    const e = {
      id: id,
      idType: json[id][ENTRY_ID_TYPE],
      title: title,
      url: "",
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
  } else if (json[id][ENTRY_ID_TYPE] == ID_TYPE_DOI) {
    const title: string = json[id][ENTRY_TITLE];
    const path: string = json[id]["path"];
    let authors: string[] = [];
    if (json[id]["author"] != undefined) {
      for (let i = 0; i < json[id]["author"].length; i++) {
        authors.push(
          json[id]["author"][i]["given"] + " " + json[id]["author"][i]["family"]
        );
      }
    }
    let year: number | undefined = undefined;
    if (json[id]["published-print"] != undefined) {
      year = json[id]["published-print"]["date-parts"][0][0];
    } else if (json[id]["created"] != undefined) {
      year = json[id]["created"]["date-parts"][0][0];
    }
    const publisher: string =
      json[id]["event"] != undefined ? json[id]["event"] : "";
    const abstract: string =
      json[id]["abstract"] != undefined ? json[id]["abstract"] : "";
    const tags = json[id][ENTRY_TAGS] != undefined ? json[id][ENTRY_TAGS] : [];
    const comments =
      json[id][ENTRY_COMMENTS] != undefined ? json[id][ENTRY_COMMENTS] : [];

    const e = {
      id: id,
      idType: json[id][ENTRY_ID_TYPE],
      title: title,
      authors: authors,
      url: "",
      tags: tags,
      comments: comments,
      abstract: abstract,
      path: path,
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else if (json[id][ENTRY_ID_TYPE] == "arxiv") {
    const title: string = json[id][ENTRY_TITLE];
    const path: string = json[id]["path"];
    let authors: string[] = [];
    if (json[id]["author"].length != undefined) {
      for (let i = 0; i < json[id]["author"].length; i++) {
        authors.push(json[id]["author"][i]["name"]);
      }
    } else {
      authors.push(json[id]["author"]["name"]);
    }
    let year: number | undefined = undefined;
    if (
      json[id]["published"] != undefined &&
      !isNaN(parseInt(json[id]["published"].substr(0, 4)))
    ) {
      year = parseInt(json[id]["published"].substr(0, 4));
    }
    const publisher: string =
      json[id]["event"] != undefined ? json[id]["event"] : "";
    const abstract: string =
      json[id]["summary"] != undefined ? json[id]["summary"] : "";
    const tags = json[id][ENTRY_TAGS] != undefined ? json[id][ENTRY_TAGS] : [];
    const comments =
      json[id][ENTRY_COMMENTS] != undefined ? json[id][ENTRY_COMMENTS] : [];

    const e = {
      id: id,
      idType: json[id][ENTRY_ID_TYPE],
      title: title,
      url: "",
      authors: authors,
      tags: tags,
      abstract: abstract,
      comments: comments,
      path: path,
      year: year,
      publisher: publisher,
    };
    checkEntry(e);
    return e;
  } else {
    const title: string = json[id][ENTRY_TITLE];
    const path: string = json[id]["path"];
    const tags = json[id][ENTRY_TAGS] != undefined ? json[id][ENTRY_TAGS] : [];
    const comments =
      json[id][ENTRY_COMMENTS] != undefined ? json[id][ENTRY_COMMENTS] : [];
    const authors = [];
    const abstract =
      json[id]["abstract"] != undefined ? json[id]["abstract"] : "";
    const year = undefined;
    const publisher = "";
    const e = {
      id: id,
      idType: json[id][ENTRY_ID_TYPE],
      title: title,
      url: "",
      authors: authors,
      tags: tags,
      abstract: abstract,
      comments: comments,
      path: path,
      year: year,
      publisher: publisher,
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

function getDB(request: Request, response: Response, db_path: string) {
  logger.info("Get a get_db request" + request.url);
  const json = JSON.parse(fs.readFileSync(db_path).toString());
  let db_response: DB = [];

  for (const id of Object.keys(json)) {
    if (json[id] == undefined) continue;
    const e = getEntry(id, json);
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

async function getTitleFromUrl(url: string) {
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

  logger.info("Sent a response from add_pdf_from_url");
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
      jsonDB[entry.id]["path"] != undefined
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
      jsonDB[entry.id]["path"] == undefined &&
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

import base_64 from "base-64";
import url from "url";
import path from "path";
import cors from "cors";
import fs from "fs";
import { Entry, DB, RequestGetFromURL } from "./schema";
import express from "express";
import bodyParser from "body-parser";
import https from "https";
import { registerNonBookPDF } from "./gen";
import { logger } from "./logger";
import { JENDELEY_NO_TRACK } from "./constants";

function checkEntry(entry: Entry) {
  console.assert(
    entry.title != null && entry.path != null,
    "id = ",
    entry.id,
    "entry = ",
    JSON.stringify(entry, null, 2)
  );
}

function getEntry(id: string, json: any): Entry {
  console.assert(json[id] != null, "json[" + id + "] != null");

  if (json[id]["id_type"] == "isbn" || json[id]["id_type"] == "book") {
    const title: string = json[id]["title"];
    const path: string = json[id]["path"];
    let authors: string[] = [];
    if (json[id]["authors"] != null) {
      authors = json[id]["authors"];
    }
    let year: number | null = null;
    if (
      json[id]["publishedDate"] != null &&
      !isNaN(parseInt(json[id]["publishedDate"].substr(0, 4)))
    ) {
      year = parseInt(json[id]["publishedDate"].substr(0, 4));
    }
    let publisher: string = "";
    if (json[id]["publisher"] != null) {
      publisher = json[id]["publisher"];
    }
    const tags = json[id]["tags"] != undefined ? json[id]["tags"] : [];
    const comments =
      json[id]["comments"] != undefined ? json[id]["comments"] : [];
    const abstract = "";

    const e = {
      id: id,
      title: title,
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
  } else if (json[id]["id_type"] == "doi") {
    const title: string = json[id]["title"];
    const path: string = json[id]["path"];
    let authors: string[] = [];
    if (json[id]["author"] != undefined) {
      for (let i = 0; i < json[id]["author"].length; i++) {
        authors.push(
          json[id]["author"][i]["given"] + " " + json[id]["author"][i]["family"]
        );
      }
    }
    let year: number | null = null;
    if (json[id]["published-print"] != null) {
      year = json[id]["published-print"]["date-parts"][0][0];
    } else if (json[id]["created"] != null) {
      year = json[id]["created"]["date-parts"][0][0];
    }
    const publisher: string =
      json[id]["event"] != null ? json[id]["event"] : "";
    const abstract: string =
      json[id]["abstract"] != null ? json[id]["abstract"] : "";
    const tags = json[id]["tags"] != undefined ? json[id]["tags"] : [];
    const comments =
      json[id]["comments"] != undefined ? json[id]["comments"] : [];

    const e = {
      id: id,
      title: title,
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
  } else if (json[id]["id_type"] == "arxiv") {
    const title: string = json[id]["title"];
    const path: string = json[id]["path"];
    let authors: string[] = [];
    if (json[id]["author"].length != undefined) {
      for (let i = 0; i < json[id]["author"].length; i++) {
        authors.push(json[id]["author"][i]["name"]);
      }
    } else {
      authors.push(json[id]["author"]["name"]);
    }
    let year: number | null = null;
    if (
      json[id]["published"] != null &&
      !isNaN(parseInt(json[id]["published"].substr(0, 4)))
    ) {
      year = parseInt(json[id]["published"].substr(0, 4));
    }
    const publisher: string =
      json[id]["event"] != null ? json[id]["event"] : "";
    const abstract: string =
      json[id]["summary"] != null ? json[id]["summary"] : "";
    const tags = json[id]["tags"] != undefined ? json[id]["tags"] : [];
    const comments =
      json[id]["comments"] != undefined ? json[id]["comments"] : [];

    const e = {
      id: id,
      title: title,
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
    const title: string = json[id]["title"];
    const path: string = json[id]["path"];
    const tags = json[id]["tags"] != undefined ? json[id]["tags"] : [];
    const comments =
      json[id]["comments"] != undefined ? json[id]["comments"] : [];
    const authors = [];
    const abstract = json[id]["abstract"] != null ? json[id]["abstract"] : "";
    const year = null;
    const publisher = "";
    const e = {
      id: id,
      title: title,
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

function startServer(db_path: string) {
  if (fs.existsSync(db_path)) {
    const app = express();
    const port = 5000;

    app.use(cors());

    const built_frontend_dir = path.join(__dirname, "..", "built-frontend");
    if (!fs.existsSync(built_frontend_dir)) {
      logger.warn(
        built_frontend_dir + " doesn't exist. Are you jendeley developer?"
      );
    }
    app.use(express.static(path.join(__dirname, "..", "built-frontend")));

    app.get("/api/get_db", (request, response) => {
      logger.info("Get a get_db request" + request.url);
      const json = JSON.parse(fs.readFileSync(db_path).toString());
      let db_response: DB = [];

      for (const id of Object.keys(json)) {
        if (json[id] == null) continue;
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
    });

    app.get("/api/get_pdf", (request, response) => {
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
    });

    let jsonParser = bodyParser.json();
    app.put("/api/add_from_url", jsonParser, async (httpRequest, response) => {
      // TODO: Handle RequestGetFromURL.isbn/doi/comments/tags
      const req = httpRequest.body as RequestGetFromURL;
      logger.info(
        "Get a add_from_url request url = " +
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

      await download(req.url, path.join(path.dirname(db_path), filename));
      let json = JSON.parse(fs.readFileSync(db_path).toString());
      const date = new Date();
      const date_tag = date.toISOString().split("T")[0];
      const tags = req.tags;
      tags.push(date_tag);
      json = await registerNonBookPDF(
        path.dirname(db_path),
        filename,
        json,
        req.comments,
        tags,
        true,
        req.url
      );
      fs.writeFileSync(db_path, JSON.stringify(json));

      response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE",
      });

      response.end();

      logger.info("Sent a response from add_from_url");
    });

    app.put("/api/update_entry", jsonParser, (request, response) => {
      logger.info("Get a update_entry request url = " + request.url);
      const entry_o = request.body;

      // TODO: Is there any more sophisticated way to check user defined type?
      if (
        entry_o["id"] != undefined &&
        entry_o["tags"] != undefined &&
        entry_o["comments"] != undefined
      ) {
        const entry = entry_o as Entry;
        let json = JSON.parse(fs.readFileSync(db_path).toString());
        if (json[entry.id] != undefined) {
          logger.info("Update DB with entry = " + JSON.stringify(entry));
          json[entry.id]["tags"] = entry.tags;
          json[entry.id]["comments"] = entry.comments;
        }
        fs.writeFileSync(db_path, JSON.stringify(json));
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
    });

    app.delete("/api/delete_entry", jsonParser, (request, response) => {
      logger.info("Get a delete_entry request url = " + request.url);
      const entry_o = request.body;

      if (entry_o["id"] != undefined) {
        const entry = entry_o as Entry;
        let json = JSON.parse(fs.readFileSync(db_path).toString());
        if (
          json[entry.id] != undefined &&
          json[entry.id]["path"] != undefined
        ) {
          logger.info("Delete " + json[entry.id]["path"]);
          const old_filename = path.join(
            path.dirname(db_path),
            json[entry.id]["path"]
          );
          const dir = path.dirname(old_filename);
          const new_filename = path.join(
            dir,
            path.basename(old_filename, ".pdf") +
              " " +
              JENDELEY_NO_TRACK +
              ".pdf"
          );
          logger.info("Rename " + old_filename + " to " + new_filename);
          fs.renameSync(old_filename, new_filename);
          delete json[entry.id];
        }
        fs.writeFileSync(db_path, JSON.stringify(json));
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
    });

    app.listen(port, () => {
      logger.info(`jendeley backend server is listening on port ${port}`);
      logger.info(`Open http://localhost:${port} with your browser`);
    });
  } else {
    logger.error(db_path + " is not exist.");
  }
}

export { startServer };

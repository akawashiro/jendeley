import path from "path";
import cors from "cors";
import fs from "fs";
import open from "open";
import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { logger } from "./logger";
import {
  addPdfFromFile,
  addPdfFromUrl,
  addWebFromUrl,
  deleteEntry,
  getDB,
  getPdf,
  updateEntry,
} from "./api";
import { concatDirs } from "./path_util";

function startServer(
  dbPath: string[],
  noBrowser: boolean,
  allowCors: boolean,
  port: number
) {
  if (fs.existsSync(concatDirs(dbPath))) {
    const app = express();
    app.use(bodyParser.json({ limit: "1gb" }));
    if (allowCors) {
      app.use(cors());
    }

    const built_frontend_dir = path.join(__dirname, "..", "built-frontend");
    if (!fs.existsSync(built_frontend_dir)) {
      logger.warn(
        built_frontend_dir + " doesn't exist. Are you jendeley developer?"
      );
    }
    app.use(express.static(path.join(__dirname, "..", "built-frontend")));

    app.get("/api/get_db", (request: Request, response: Response) => {
      getDB(request, response, dbPath);
    });

    app.get("/api/get_pdf", (request: Request, response: Response) => {
      getPdf(request, response, dbPath);
    });

    let jsonParser = bodyParser.json();

    app.put(
      "/api/add_pdf_from_file",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        addPdfFromFile(httpRequest, response, dbPath);
      }
    );

    app.put(
      "/api/add_pdf_from_url",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        addPdfFromUrl(httpRequest, response, dbPath);
      }
    );

    app.put(
      "/api/add_web_from_url",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        addWebFromUrl(httpRequest, response, dbPath);
      }
    );

    app.put(
      "/api/update_entry",
      jsonParser,
      (request: Request, response: Response) => {
        updateEntry(request, response, dbPath);
      }
    );

    app.delete(
      "/api/delete_entry",
      jsonParser,
      (request: Request, response: Response) => {
        deleteEntry(request, response, dbPath);
      }
    );

    app.listen(port, () => {
      logger.info(`jendeley backend server is listening on port ${port}`);
      logger.info(`Open http://localhost:${port} with your browser`);
      if (!noBrowser) {
        open(`http://localhost:${port}`);
      }
    });
  } else {
    logger.error(dbPath + " is not exist.");
  }
}

export { startServer };

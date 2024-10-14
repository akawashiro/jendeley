import path from "path";
import cors from "cors";
import fs from "fs";
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
import { loadDB } from "./load_db";
import { JENDELEY_VERSION } from "./constants";

function startServer(
  dbPath: string[],
  allowCors: boolean,
  port: number,
  experimentalUseOllamaServer: boolean
) {
  logger.info("startServer version: " + JENDELEY_VERSION);
  if (fs.existsSync(concatDirs(dbPath))) {
    {
      // Just check DB and ignore the result.
      loadDB(dbPath, false);
    }

    const app = express();
    app.use(bodyParser.json({ limit: "1gb" }));
    if (allowCors) {
      logger.info("Allowing CORS");
      app.use(cors());
    }

    const built_frontend_dir = path.join(__dirname, "..", "built-frontend");
    if (!fs.existsSync(built_frontend_dir)) {
      logger.warn(
        built_frontend_dir + " doesn't exist. Are you jendeley developer?"
      );
    }
    app.use(express.static(path.join(__dirname, "..", "built-frontend")));

    let jsonParser = bodyParser.json();

    // To include search condition in the request body, we use POST method.
    app.post(
      "/api/get_db",
      jsonParser,
      (request: Request, response: Response) => {
        getDB(request, response, dbPath);
      }
    );

    app.get("/api/get_pdf", (request: Request, response: Response) => {
      getPdf(request, response, dbPath);
    });

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
        addWebFromUrl(httpRequest, response, dbPath, experimentalUseOllamaServer);
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
    });
  } else {
    let p = concatDirs(dbPath);
    logger.error(p + " does not exist.");
  }
}

export { startServer };

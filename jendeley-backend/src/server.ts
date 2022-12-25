import path from "path";
import cors from "cors";
import fs from "fs";
import open from "open";
import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { logger } from "./logger";
import {
  addPdfFromUrl,
  addWebFromUrl,
  deleteEntry,
  getDB,
  getPdf,
  updateEntry,
} from "./api";

function startServer(db_path: string, no_browser: boolean, port: number) {
  if (fs.existsSync(db_path)) {
    const app = express();

    app.use(cors());

    const built_frontend_dir = path.join(__dirname, "..", "built-frontend");
    if (!fs.existsSync(built_frontend_dir)) {
      logger.warn(
        built_frontend_dir + " doesn't exist. Are you jendeley developer?"
      );
    }
    app.use(express.static(path.join(__dirname, "..", "built-frontend")));

    app.get("/api/get_db", (request: Request, response: Response) => {
      getDB(request, response, db_path);
    });

    app.get("/api/get_pdf", (request: Request, response: Response) => {
      getPdf(request, response, db_path);
    });

    let jsonParser = bodyParser.json();

    app.put(
      "/api/add_pdf_from_url",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        addPdfFromUrl(httpRequest, response, db_path);
      }
    );

    app.put(
      "/api/add_web_from_url",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        addWebFromUrl(httpRequest, response, db_path);
      }
    );

    app.put(
      "/api/update_entry",
      jsonParser,
      (request: Request, response: Response) => {
        updateEntry(request, response, db_path);
      }
    );

    app.delete(
      "/api/delete_entry",
      jsonParser,
      (request: Request, response: Response) => {
        deleteEntry(request, response, db_path);
      }
    );

    app.listen(port, () => {
      logger.info(`jendeley backend server is listening on port ${port}`);
      logger.info(`Open http://localhost:${port} with your browser`);
      if (!no_browser) {
        open(`http://localhost:${port}`);
      }
    });
  } else {
    logger.error(db_path + " is not exist.");
  }
}

export { startServer };

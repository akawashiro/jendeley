import path from "path";
import cors from "cors";
import fs from "fs";
import open from "open";
import express from "express";
import { Request, Response } from "express";
import bodyParser from "body-parser";
import { logger } from "./logger";
import {
  add_pdf_from_url,
  add_web_from_url,
  delete_entry,
  get_db,
  get_pdf,
  update_entry,
} from "./api";

function startServer(
  db_path: string,
  no_browser: boolean,
  use_dev_port: boolean
) {
  if (fs.existsSync(db_path)) {
    const app = express();
    const port = use_dev_port ? 5001 : 5000;

    app.use(cors());

    const built_frontend_dir = path.join(__dirname, "..", "built-frontend");
    if (!fs.existsSync(built_frontend_dir)) {
      logger.warn(
        built_frontend_dir + " doesn't exist. Are you jendeley developer?"
      );
    }
    app.use(express.static(path.join(__dirname, "..", "built-frontend")));

    app.get("/api/get_db", (request: Request, response: Response) => {
      get_db(request, response, db_path);
    });

    app.get("/api/get_pdf", (request: Request, response: Response) => {
      get_pdf(request, response, db_path);
    });

    let jsonParser = bodyParser.json();

    app.put(
      "/api/add_pdf_from_url",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        add_pdf_from_url(httpRequest, response, db_path);
      }
    );

    app.put(
      "/api/add_web_from_url",
      jsonParser,
      async (httpRequest: Request, response: Response) => {
        add_web_from_url(httpRequest, response, db_path);
      }
    );

    app.put(
      "/api/update_entry",
      jsonParser,
      (request: Request, response: Response) => {
        update_entry(request, response, db_path);
      }
    );

    app.delete(
      "/api/delete_entry",
      jsonParser,
      (request: Request, response: Response) => {
        delete_entry(request, response, db_path);
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

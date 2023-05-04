#!/usr/bin/env node

import { Command } from "commander";
import { startServer } from "./server";
import { genDB, genDummyDB } from "./gen";
import { validateDB } from "./validate_db";
import { JENDELEY_DIR, JENDELEY_VERSION } from "./constants";
import { logger } from "./logger";
import { pathStrToDirs } from "./path_util";
import path from "path";
import { compileDB } from "./compile";

async function main() {
  const program = new Command();

  program.name("jendeley").version(JENDELEY_VERSION, "-v, --version");

  program
    .command("scan")
    .usage("Scan a directory and generate a database JSON file.")
    .requiredOption("--papers_dir <dir>", "Root directory of your papers")
    .option("--book_dirs <dirs>", "Comma separated directories of books")
    .option(
      "--db_name <db_name>",
      "Name of DB. DB is created under <papers_dir>. By default, <papers_dir>/db.json."
    )
    .option(
      "--delete_unreachable_files",
      "Delete entries corresponding to unreachable files."
    )
    .action((cmd, options) => {
      const book_dirs_str =
        options._optionValues.book_dirs == undefined
          ? ""
          : options._optionValues.book_dirs;
      const db_name =
        options._optionValues.db_name == undefined
          ? "jendeley_db.json"
          : options._optionValues.db_name;
      if (db_name == JENDELEY_DIR) {
        logger.fatal(JENDELEY_DIR + " cannot used as the name of DB.");
        process.exit(1);
      }
      genDB(
        options._optionValues.papers_dir,
        book_dirs_str,
        db_name,
        options._optionValues.delete_unreachable_files
      );
    });

  program
    .command("compile")
    .usage("Generate a database with full texts to search.")
    .requiredOption("--db <db>", "Database JSON file generated by scan command")
    .requiredOption(
      "--fulltext_db <fulltext_db>",
      "Output database JSON file with full texts to search"
    )
    .action((cmd, options) => {
      compileDB(
        pathStrToDirs(path.resolve(options._optionValues.db)),
        pathStrToDirs(path.resolve(options._optionValues.fulltext_db))
      );
    });

  program
    .command("validate")
    .usage("Check the DB is valid.")
    .requiredOption("--db <db>", "Database JSON file generated by scan command")
    .action((cmd, options) => {
      validateDB(options._optionValues.db);
    });

  program
    .command("launch")
    .usage("Run jendeley server to check your database JSON file from browser.")
    .requiredOption("--db <db>", "Database JSON file generated by scan command")
    .option("--fulltext_db <fulltext_db>", "Compiled DB JSON file")
    .option("--no_browser", "Don't launch browser")
    .option("--allow_cors", "Allow all CORS request. Only for developers.")
    .option("--port <port>", "Use if the default port 5000 is used.", "5000")
    .action((cmd, options) => {
      const port_n = parseInt(options._optionValues.port, 10);
      const fulltextDBPath =
        options._optionValues.fulltext_db == undefined
          ? undefined
          : pathStrToDirs(path.resolve(options._optionValues.fulltext_db));
      startServer(
        pathStrToDirs(path.resolve(options._optionValues.db)),
        fulltextDBPath,
        options._optionValues.no_browser,
        options._optionValues.allow_cors,
        port_n
      );
    });

  program
    .command("generate-dummy-db")
    .usage(
      "This subcommand is only for developpers. Generate a dummy database."
    )
    .requiredOption("--output <out>", "Output DB to this file.")
    .action((cmd, options) => {
      genDummyDB(options._optionValues.output);
    });

  program.parse();
}

main().then((_arg) => {});

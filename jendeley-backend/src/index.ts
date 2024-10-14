#!/usr/bin/env node

import { Command } from "commander";
import { startServer } from "./server";
import { genDB, genDummyDB } from "./gen";
import { validateDB } from "./validate_db";
import { JENDELEY_DIR, JENDELEY_VERSION } from "./constants";
import { logger } from "./logger";
import { pathStrToDirs } from "./path_util";
import path from "path";
import { update_db } from "./update_db";
import { benchmarkFuzzySearch } from "./benchmark";

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
    .command("update_db")
    .usage("Generate a database with full texts to search.")
    .requiredOption("--db1 <db>", "Input database file of version 1")
    .requiredOption("--db2 <db>", "Output database file of version 2")
    .action((cmd, options) => {
      update_db(
        pathStrToDirs(path.resolve(options._optionValues.db1)),
        pathStrToDirs(path.resolve(options._optionValues.db2))
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
    .option("--allow_cors", "Allow all CORS request. Only for developers.")
    .option("--port <port>", "Use if the default port 5000 is used.", "5000")
    .option(
      "--experimental_use_ollama_server",
      "Use ollama server to generate tags. This is an experimental feature."
    )
    .action((cmd, options) => {
      const port_n = parseInt(options._optionValues.port, 10);
      startServer(
        pathStrToDirs(path.resolve(options._optionValues.db)),
        options._optionValues.allow_cors,
        port_n,
        options._optionValues.experimental_use_ollama_server
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

  program
    .command("benchmark-fuzzy-search")
    .requiredOption("--db <db>", "Database JSON file generated by scan command")
    .action((cmd, options) => {
      benchmarkFuzzySearch(
        pathStrToDirs(path.resolve(options._optionValues.db))
      );
    });

  program.parse();
}

main().then((_arg) => {});

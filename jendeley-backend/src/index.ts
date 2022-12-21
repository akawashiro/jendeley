#!/usr/bin/env node

import { Command } from "commander";
import { startServer } from "./server";
import { genDB, genDummyDB } from "./gen";

async function main() {
  const program = new Command();

  program.name("jendeley");

  program
    .command("scan")
    .usage("Scan a directory and generate a database JSON file.")
    .requiredOption("--papers_dir <dir>", "Root directory of your papers")
    .option("--book_dirs <dirs>", "Comma separated directories of books")
    .option(
      "--db_name <db_name>",
      "Name of DB. DB is created under <papers_dir>. By default, <papers_dir>/db.json."
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
      genDB(options._optionValues.papers_dir, book_dirs_str, db_name);
    });

  program
    .command("launch")
    .usage("Run jendeley server to check your database JSON file from browser.")
    .requiredOption("--db <db>", "Database json file generated by scan command")
    .action((cmd, options) => {
      startServer(options._optionValues.db);
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

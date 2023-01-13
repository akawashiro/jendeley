# jendeley <!-- omit in toc -->
`jendeley` is a JSON-based PDF paper organizing software.
- `jendeley` is JSON-based. You can see and edit your database easily.
- `jendeley` is working locally. Your important database is owned only by you. Not cloud.
- `jendeley` is browser based. You can run it anywhere node.js runs.

## Table of Contents <!-- omit in toc -->
- [Quickstart](#quickstart)
- [Install](#install)
- [Scan your PDFs](#scan-your-pdfs)
    - [Recommended filename style](#recommended-filename-style)
    - [When failed to scan your PDFs](#when-failed-to-scan-your-pdfs)
- [Launch jendeley UI](#launch-jendeley-ui)
    - [Launch `jendeley` automatically](#launch-jendeley-automatically)
- [Use web interface](#use-web-interface)
- [Check and edit your database (advanced)](#check-and-edit-your-database-advanced)

## Quickstart
```
npm install @a_kawashiro/jendeley -g
jendeley scan --papers_dir <YOUR PDFs DIR>
jendeley launch --db <YOUR PDFs DIR>/jendeley_db.json
```
Then you can see a screen like this!
![image](https://user-images.githubusercontent.com/3770618/209427855-374e6523-8910-4c98-a9ec-05bd62ae9b8e.png)

## Install
```
npm install @a_kawashiro/jendeley -g
```

## Scan your PDFs
This command emits the database to `<YOUR PDFs DIR>/jendeley_db.json`. When `jendeley` failed to scan some PDFs, it emit a shellscript `edit_and_run.sh`. Please read the next subsection and rename files using it.
```
jendeley scan --papers_dir <YOUR PDFs DIR>
```

#### Recommended filename style
`jendeley` use filename also to find the document ID (e.g. [DOI](https://www.doi.org/) or [ISBN](https://en.wikipedia.org/wiki/ISBN))). `jendeley` recognizes the filename other than surrounded by `[` and `]` as the title of the file. So I recommend you to name file such way. For example,
- `RustHorn CHC-based Verification for Rust Programs.pdf`
    - When the title of document includes spaces, the filename should also includes spaces.
- `RustHorn CHC-based Verification for Rust Programs [matushita].pdf`
    - If you want to write additional information in the filename, please surround by `[` and `]`.

#### When failed to scan your PDFs
`jendeley` is heavily dependent on [DOI](https://www.doi.org/) or [ISBN](https://en.wikipedia.org/wiki/ISBN) to find title, authors and published year of PDFs. So `jendeley` try to find DOI of given PDFs in many ways. But sometimes all of them fails to find DOI. In that case, you can specify DOI of PDF manually using filename.

- To specify DOI, change the filename to include `[jendeley doi <DOI replaced all delimiters with underscore>]`.
  - For example, `cyclone [jendeley doi 10_1145_512529_512563].pdf`.
- To specify ISBN, change the filename to include `[jendeley isbn <ISBN>]`. 
  - For example, `Types and Programming Languages [jendeley isbn 0262162091].pdf`. 
- When the PDF doesn't have any DOI or ISBN, you can tell it with `[jendeley no id]`. 
  - For example `ARM reference manual [jendeley no id].pdf`.

## Launch jendeley UI
```
jendeley launch --db <YOUR PDFs DIR>/jendeley_db.json
```
You can use `--port` option to change the default port.

#### Launch `jendeley` automatically
When you are using Linux, you can launch `jendeley` automatically using `systemd`. Please make `~/.config/systemd/user/jendeley.service` with the following contents, run `systemctl --user enable jendeley && systemctl --user start jendeley` and access [http://localhost:5000](http://localhost:5000). You can check log with `journalctl --user -f -u jendeley.service`.
```
[Unit]
Description=jendeley JSON based document organization software

[Service]
ExecStart=jendeley launch --db <FILL PATH TO THE YOUR DATABASE JSON FILE> --no_browser

[Install]
WantedBy=default.target
```

## Use web interface
![howtouse](https://user-images.githubusercontent.com/3770618/212287575-b553971c-e59f-40f7-8fb4-fd6ac68d1665.png)

## Check and edit your database (advanced)
Because `jendeley` is fully JSON-based, you can check the contents of the
database easily. For example, you can use `jq` command to list up all titles in
your database with the following command.
```
> cat jendeley_db.json | jq '.' | head
{
  "jendeley_meta": {
    "idType": "meta",
    "version": "0.0.17"
  },
  "doi_10.1145/1122445.1122456": {
    "path": "/A Comprehensive Survey of Neural Architecture Search.pdf",
    "idType": "doi",
    "tags": [],
    "comments": "",
```

You can edit you database using your favorite editor. But after editting, you should check your database is valid as jendeley databse using `jendeley validate --db <PATH TO THE DATABASE>`.

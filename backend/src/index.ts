import {Command} from 'commander'
import fs from 'fs'
import base_64 from 'base-64'
import path from 'path'
import pdfparse from 'pdf-parse'
import node_isbn from 'node-isbn'
import url from 'url'
import http from 'http'
import {Entry, DB} from './schema'
import xml2js from 'xml2js'


function walkPDF(dir: string): Array<string> {
    if (!fs.existsSync(dir)) {
        return []
    } else if (fs.lstatSync(dir).isDirectory()) {
        const ds = fs.readdirSync(dir, {withFileTypes: true});
        var ret: Array<string> = []
        ds.forEach(d => {
            ret = ret.concat(walkPDF(path.join(dir, d.name)));
        });
        return ret
    } else if (path.extname(dir) == ".pdf") {
        return [dir]
    } else {
        return []
    }
}

type DocID = {
    doi: string | null;
    isbn: string | null;
    arxiv: string | null;
};

async function getDocID(pdf: string): Promise<DocID> {
    let dataBuffer = fs.readFileSync(pdf);

    const texts = await pdfparse(dataBuffer).then(data => {
        // See https://www.npmjs.com/package/pdf-parse for usage
        return data.text.split(/\r?\n/);;
    }).catch((e) => {
        console.warn(e.message);
        return null
    });

    if (texts == null) {
        return {"doi": null, "isbn": null, "arxiv": null};
    }

    const regexpDOI = '(10[.][0-9]{2,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)';
    const regexpArxivDOI = '(arXiv:[0-9]{4}[.][0-9]{4,5})';
    const regexpISBN = "(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]";

    let doi: string | null = null;
    let arxiv: string | null = null;
    for (const text of texts) {
        const foundDOI = [...text.matchAll(regexpDOI)];
        for (const f of foundDOI) {
            let d = f[0] as string;
            if (d.charAt(d.length - 1) == '.') {
                d = d.substr(0, d.length - 1);
            }
            doi = d;
            break
        }
        if (doi != null) break;

        const foundArxivDOI = [...text.matchAll(regexpArxivDOI)];
        for (const f of foundArxivDOI) {
            const d = f[0] as string;
            arxiv = d.substring(6);
            break
        }
        if (arxiv != null) break;
    }

    let isbn: string | null = null
    for (const text of texts) {
        const foundISBN = [...text.matchAll(regexpISBN)];
        for (const f of foundISBN) {
            let d = f[0] as string;
            let n = '';
            for (const c of d) {
                if (('0' <= c && c <= '9') || c == 'X') {
                    n += c;
                }
            }
            if (n.length == 10) {
                let cd = 0;
                for (let i = 0; i < 9; i++) {
                    cd += (10 - i) * (n.charCodeAt(i) - '0'.charCodeAt(0));
                }
                cd = 11 - cd % 11;
                const cd_c = cd == 10 ? 'X' : String.fromCharCode('0'.charCodeAt(0) + cd);
                if (cd_c == n[9]) {
                    isbn = n;
                }
            } else if (n.length == 13) {
                let cd = 0;
                for (let i = 0; i < 12; i++) {
                    if (i % 2 == 0) {
                        cd += (n.charCodeAt(i) - '0'.charCodeAt(0));
                    } else {
                        cd += (n.charCodeAt(i) - '0'.charCodeAt(0)) * 3;
                    }
                }
                cd = 10 - (cd % 10);
                const cd_c = String.fromCharCode('0'.charCodeAt(0) + cd);
                if (cd_c == n[12]) {
                    isbn = n;
                }
            }
            break
        }
        if (isbn != null) break;
    }

    return {"doi": doi, "isbn": isbn, "arxiv": arxiv};
}

async function getDoiJSON(doi: string): Promise<Object> {
    let {got} = await import('got');

    const URL = 'https://api.crossref.org/v1/works/' + encodeURIComponent(doi) + "/transform"
    const options = {'headers': {'Accept': 'application/json'}}
    try {
        const data = await got(URL, options).json() as Object;
        return data
    } catch {
        console.warn("Failed to get information from doi: ", URL)
        return new Object();
    }
}

async function getIsbnJson(isbn: string) {
    const b = await node_isbn.resolve(isbn).then(function (book) {
        return book;
    }).catch(function (err) {
        console.warn('Failed to get information from ISBN: ', isbn);
        return null;
    });
    return b;
}

async function getArxivJson(arxiv: string) {
    let {got} = await import('got');

    const URL = 'http://export.arxiv.org/api/query?id_list=' + arxiv
    const options = {'headers': {'Accept': 'application/json'}}
    try {
        const data = (await got(URL, options)).body;
        let jsonData;
        const parser = new xml2js.Parser({
            async: false,
            explicitArray: false
        });
        parser.parseString(data, (error, json) => {
            jsonData = json;
        });
        if (jsonData.feed.entry == undefined) {
            console.warn("Failed to get information from arXiv: ", URL, jsonData);
            return new Object();
        } else {
            return jsonData.feed.entry;
        }
    } catch {
        console.warn("Failed to get information from arXiv: ", URL)
        return new Object();
    }
}

function getEntry(id: string, json: any): Entry {
    console.assert(json[id] != null);

    if (id.startsWith("isbn")) {
        const title: string = json[id]["title"];
        const path: string = json[id]["path"];
        const authors: [string] | null = json[id]["authors"];
        let year: number | null = null;
        if (json[id]["publishedDate"] != null && !isNaN(parseInt(json[id]["publishedDate"].substr(0, 4)))) {
            year = parseInt(json[id]["publishedDate"].substr(0, 4));
        }
        const publisher: string | null = json[id]["publisher"];

        const e = {id: id, title: title, authors: authors, path: path, year: year, publisher: publisher};
        console.assert(title != null && path != null, JSON.stringify(e, null, 2));
        return e;
    } else {
        console.assert(id.startsWith("doi"), id);
        const title: string = json[id]["title"];
        const path: string = json[id]["path"];
        const authors: [string] | null = json[id]["authors"];
        let year: number | null = null;
        if (json[id]["publishedDate"] != null && !isNaN(parseInt(json[id]["publishedDate"].substr(0, 4)))) {
            year = parseInt(json[id]["publishedDate"].substr(0, 4));
        }
        const publisher: string | null = json[id]["publisher"];

        const e = {id: id, title: title, authors: authors, path: path, year: year, publisher: publisher};
        console.assert(title != null && path != null, JSON.stringify(e, null, 2));
        return e;
    }
}

function startServer(db: string) {
    if (fs.existsSync(db)) {
        const port = 5000;
        const server = http.createServer((request, response) => {
            console.log('Get a request', request.url);
            if (request.url == "/api/get_db") {
                const json = JSON.parse(fs.readFileSync(db).toString());
                let db_response: DB = [];

                for (const id of Object.keys(json)) {
                    if (json[id] == null)
                        continue;
                    const e = getEntry(id, json);
                    db_response.push(e);
                }

                response.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
                });

                response.end(JSON.stringify(db_response));
                console.log('Sent a response');
            } else if (request.url != undefined && request.url.startsWith("/api/get_pdf/")) {
                const params = url.parse(request.url, true).query;
                const path = unescape(base_64.decode(params.file as string));
                console.log("path = ", path);
                const pdf = fs.readFileSync(path);

                response.writeHead(200, {
                    'Content-Type': 'application/pdf',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
                });

                response.end(pdf);
                console.log('Sent a response');
            }
        });

        server.listen(port);
        console.log(`The server has started and is listening on port number: ${port}`);
    } else {
        console.log(db + " is not exist.");
    }
}

async function getJson(docID: DocID, path: string): Promise<Object | null> {
    let json_r: Object | null = null;

    if (docID.arxiv != null) {
        let json = await getArxivJson(docID.arxiv);
        if (json != null) {
            json["path"] = path;
            json["id_type"] = "arxiv";
            json_r = json;
        } else {
            console.warn("Failed to get info of ", docID, path);
        }
    } else if (docID.isbn != null) {
        let json = await getIsbnJson(docID.isbn);
        if (json != null) {
            json["path"] = path;
            json["id_type"] = "isbn";
            json_r = json;
        } else {
            console.warn("Failed to get info of ", docID, path);
        }
    } else if (docID.doi != null) {
        let json = await getDoiJSON(docID.doi);
        if (json != null) {
            json["path"] = path;
            json["id_type"] = "doi";
            json_r = json;
        } else {
            console.warn("Failed to get info of ", docID, path);
        }
    }

    return json_r;
}

async function getDBID(docID: DocID, path: string) {
    if (docID.isbn != null) {
        return "isbn_" + docID.isbn;
    } else if (docID.doi != null) {
        return "doi_" + docID.doi.replaceAll(".", "_").replaceAll("/", "_");
    } else if (docID.arxiv != null) {
        return "arxiv_" + docID.arxiv.replaceAll(".", "_");
    } else {
        console.warn("Failed to get ID of", path)
        return null;
    }
}

async function genDB(papers_dir: string, book_dirs_str: string, output: string) {
    const book_dirs = book_dirs_str == "" ? [] : book_dirs_str.split(",");

    if (!fs.existsSync(papers_dir)) {
        console.log(papers_dir + " is not exist.");
        return;
    }
    for (const bd of book_dirs) {
        if (!fs.existsSync(bd)) {
            console.log(bd + " is not exist.");
            return;
        }
    }

    console.log("papers_dir = ", papers_dir)

    let book_db = new Object();
    let json_db = new Object();

    let pdfs = walkPDF(papers_dir);
    pdfs.sort();
    for (const p of pdfs) {
        console.log("Processing ", p)
        let is_book = false;
        for (const bd of book_dirs) {
            if (book_db[bd] == undefined) {
                book_db[bd] = {};
            }
            if (p.startsWith(bd)) {
                const docID = await getDocID(p);
                const json = await getJson(docID, p);
                book_db[bd][p] = json;
                is_book = true;
                break;
            }
        }

        if (!is_book) {
            const docID = await getDocID(p);
            const dbID = await getDBID(docID, p);
            const json = await getJson(docID, p);
            if (dbID != null && json != null) {
                json_db[dbID] = json;
            }
        }
    }

    for (const book_dir of Object.keys(book_db)) {
        let book_info: Object | null = null;
        for (const path of Object.keys(book_db[book_dir])) {
            if (book_db[book_dir][path] != null) {
                book_info = book_db[book_dir][path];
            }
        }
        if (book_info != null) {
            for (const chapter_path of Object.keys(book_db[book_dir])) {
                const chapter_id = escape(path.basename(book_dir)) + "_" + escape(path.basename(chapter_path));
                let chapter_info = JSON.parse(JSON.stringify(book_info));
                chapter_info["title"] = chapter_info["title"] + "/" + path.basename(chapter_path, ".pdf");
                chapter_info["id_type"] = "book";
                chapter_info["path"] = chapter_path;
                json_db[chapter_id] = chapter_info;
            }
        }
    }

    let registered_pdfs: string[] = [];
    for (const id of Object.keys(json_db)) {
        registered_pdfs.push(json_db[id]["path"]);
    }

    const not_registerd_pdfs = pdfs.filter(x => !registered_pdfs.includes(x));
    for (const nr of not_registerd_pdfs) {
        console.warn("Not registered: ", nr);
    }

    try {
        const db_path = output == undefined ? path.join(papers_dir, "db.json") : output;
        fs.writeFileSync(db_path, JSON.stringify(json_db));
    } catch (err) {
        console.warn(err);
    }
}

async function main() {
    const program = new Command();

    program.name("jendeley");

    program
        .command('gen')
        .requiredOption('--papers_dir <dir>', "Root directory of your papers")
        .option('--book_dirs <dirs>', "Comma separated directories of books")
        .option('--output <out>', "Output DB to this file. By default, <papers_dir>/db.json.")
        .action((cmd, options) => {
            const book_dirs_str = options._optionValues.book_dirs == undefined ? "" : options._optionValues.book_dirs;
            genDB(options._optionValues.papers_dir, book_dirs_str, options._optionValues.output);
        });

    program
        .command('server')
        .requiredOption('--db <db>', "DB file generated by gen command")
        .action((cmd, options) => {
            startServer(options._optionValues.db);
        });


    program.parse();
}

main().then(
    _arg => {
    }
);

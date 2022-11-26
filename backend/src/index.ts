import {Command} from 'commander';
import fs from 'fs';
import path from 'path';
import pdfparse from 'pdf-parse';
import node_isbn from 'node-isbn'
import http from 'http'


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

async function getID(pdf: string) {
    let dataBuffer = fs.readFileSync(pdf);

    const texts = await pdfparse(dataBuffer).then(data => {
        // See https://www.npmjs.com/package/pdf-parse for usage
        return data.text.split(/\r?\n/);;
    }).catch((e) => {
        console.warn(e.message);
        return null
    });

    if (texts == null) {
        return {"doi": null, "isbn": null};
    }

    const regexpDOI = '(10[.][0-9]{2,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)';
    const regexpISBN = "(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]";

    let doi: string | null = null
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
    }


    return {"doi": doi, "isbn": isbn};
}

async function getDoiJSON(doi: string) {
    let {got} = await import('got');

    const URL = 'https://api.crossref.org/v1/works/' + encodeURIComponent(doi) + "/transform"
    const options = {'headers': {'Accept': 'application/json'}}
    try {
        const data = await got(URL, options).json();
        return data
    } catch {
        console.warn("Failed to get information from ", URL)
        return new Object();
    }
}

async function getIsbnJson(isbn: string) {
    const b = await node_isbn.resolve(isbn).then(function (book) {
        console.log('Book found ', isbn);
        return book;
    }).catch(function (err) {
        console.log('Book not found', isbn);
        return null;
    });
    return b;
}

function startServer(db: string) {
    if (fs.existsSync(db)) {
        const port = 5000;
        const server = http.createServer((request, response) => {
            const db_content = fs.readFileSync(db);
            response.writeHead(200, {
                'Content-Type': 'application/json'
            });

            response.end(db_content);
            console.log('Sent a response');
        });

        server.listen(port);
        console.log(`The server has started and is listening on port number: ${port}`);
    } else {
        console.log(db + " is not exist.");
    }
}

async function genDB(papers_dir: string, output: string) {
    if (fs.existsSync(papers_dir)) {
        console.log(papers_dir)

        let json_db = new Object();

        let pdfs = walkPDF(papers_dir);
        pdfs.sort();
        for (const p of pdfs) {
            console.log("Processing ", p)
            const id = await getID(p);
            if (id["doi"] != null) {
                const json = await getDoiJSON(id["doi"]);
                json_db["doi_" + id["doi"].replace(".", "_").replace("/", "_")] = json
                if (json != null) {
                    console.log(json["title"], p)
                }
            } else if (id["isbn"] != null) {
                const json = await getIsbnJson(id["isbn"]);
                json_db["isbn_" + id["isbn"]] = json
                if (json != null) {
                    console.log(json["title"], p)
                }
            } else {
                console.warn("Failed to get DOI or ISBN of", p)
            }
        }

        try {
            const db_path = output == undefined ? path.join(papers_dir, "db.json") : output;
            fs.writeFileSync(db_path, JSON.stringify(json_db));
        } catch (err) {
            console.warn(err);
        }
    } else {
        console.log(papers_dir + " is not exist.");
    }
}

async function main() {
    const program = new Command();

    program.name("jendeley");

    program
        .command('gen')
        .requiredOption('--papers_dir <dir>', "Root directory of your papers")
        .option('--output <out>', "Output DB to this file. By default, <papers_dir>/db.json.")
        .action((cmd, options) => {
            genDB(options._optionValues.papers_dir, options._optionValues.output);
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

import base_64 from 'base-64'
import url from 'url'
import http from 'http'
import fs from 'fs'
import {Entry, DB} from './schema'


function getEntry(id: string, json: any): Entry {
    console.assert(json[id] != null);

    if (json[id]["id_type"] == "isbn" || json[id]["id_type"] == "book") {
        const title: string = json[id]["title"];
        const path: string = json[id]["path"];
        const authors: [string] | null = json[id]["authors"];
        let year: number | null = null;
        if (json[id]["publishedDate"] != null && !isNaN(parseInt(json[id]["publishedDate"].substr(0, 4)))) {
            year = parseInt(json[id]["publishedDate"].substr(0, 4));
        }
        const publisher: string | null = json[id]["publisher"];

        const e = {id: id, title: title, authors: authors, path: path, year: year, publisher: publisher};
        console.assert(title != null && path != null, "id = ", id, JSON.stringify(e, null, 2));
        return e;
    } else if (json[id]["id_type"] == "doi") {
        const title: string = json[id]["title"];
        const path: string = json[id]["path"];
        let authors: string[] | null = [];
        console.log(id)
        console.log(json[id]["author"])
        console.log(typeof ([id]["author"]))
        if (json[id]["author"] != undefined) {
            for (let i = 0; i < json[id]["author"].length; i++) {
                authors.push(json[id]["author"][i]["given"] + " " + json[id]["author"][i]["family"]);
            }
        }
        console.log(id);
        let year: number | null = null;
        if (json[id]["published-print"] != null) {
            year = json[id]["published-print"]["date-parts"][0][0];
        } else if (json[id]["created"] != null) {
            year = json[id]["created"]["date-parts"][0][0];
        }
        const publisher: string | null = json[id]["event"];

        const e = {id: id, title: title, authors: authors, path: path, year: year, publisher: publisher};
        console.assert(title != null && path != null, JSON.stringify(e, null, 2));
        return e;
    } else if (json[id]["id_type"] == "arxiv") {
        const title: string = json[id]["title"];
        const path: string = json[id]["path"];
        let authors: string[] | null = [];
        if (json[id]["author"].length != undefined) {
            for (let i = 0; i < json[id]["author"].length; i++) {
                authors.push(json[id]["author"][i]["name"]);
            }
        } else {
            authors.push(json[id]["author"]["name"]);
        }
        let year: number | null = null;
        if (json[id]["published"] != null && !isNaN(parseInt(json[id]["published"].substr(0, 4)))) {
            year = parseInt(json[id]["published"].substr(0, 4));
        }
        const publisher: string | null = json[id]["publisher"];

        const e = {id: id, title: title, authors: authors, path: path, year: year, publisher: publisher};
        console.assert(title != null && path != null, JSON.stringify(e, null, 2));
        return e;
    }else {
        const title: string = json[id]["title"];
        const path: string = json[id]["path"];
        const e = {id: id, title: title, authors: null, path: path, year: null, publisher: null};
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

export {startServer};

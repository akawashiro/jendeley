import {Command} from 'commander';
import fs from 'fs';
import path from 'path';
import pdfparse from 'pdf-parse';


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

async function getDOI(pdf: string) {
    let dataBuffer = fs.readFileSync(pdf);

    const text = await pdfparse(dataBuffer).then(data => {
        // See https://www.npmjs.com/package/pdf-parse for usage
        return data.text;
    }).catch((e) => {
        console.error(e.message);
        return null;
    });

    if (text == null) {
        return null;
    }

    const regexp = '(10[.][0-9]{2,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)';
    const found = [...text.matchAll(regexp)];

    for (const f of found) {
        let d = f[0] as string;
        if (d.charAt(d.length - 1) == '.') {
            d = d.substr(0, d.length - 1);
        }
        return d
    }

    return null
}

async function getJSON(doi: string) {
    let {got} = await import('got');

    const URL = 'https://api.crossref.org/v1/works/' + encodeURIComponent(doi) + "/transform"
    const options = {'headers': {'Accept': 'application/json'}}
    const data = await got(URL, options).json();
    return data
}

async function main() {
    const program = new Command();
    program
        .requiredOption('--papers_dir <dir>', "Root directory of your papers")
    program.parse();
    const options = program.opts();

    if (fs.existsSync(options.papers_dir)) {
        console.log(options.papers_dir)

        let json_db = new Object();

        let pdfs = walkPDF(options.papers_dir);
        pdfs.sort();
        pdfs = pdfs.slice(0, 10);
        console.log(pdfs)
        for (const p of pdfs) {
            console.log("Processing ", p)
            const doi = await getDOI(p);
            if (doi != null) {
                const json = await getJSON(doi);
                json_db["doi_" + doi.replace(".", "_").replace("/", "_")] = json
                if (json != null) {
                    console.log(json, p)
                }
            } else {
                console.warn("Failed to get DOI of", p)
            }
        }

        try {
            fs.writeFileSync(path.join(options.papers_dir, "db.json"), JSON.stringify(json_db));
        } catch (err) {
            console.error(err);
        }
    } else {
        console.log(options.papers_dir + " is not exist.");
    }
}

main().then(
    _arg => {
    }
);

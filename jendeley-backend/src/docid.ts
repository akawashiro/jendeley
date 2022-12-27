import path from "path";
import fs from "fs";
import pdfparse from "pdf-parse";
import { JENDELEY_NO_ID } from "./constants";
import { logger } from "./logger";
import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";

type DocID = {
  doi: string | undefined;
  isbn: string | undefined;
  arxiv: string | undefined;
  path: string | undefined;
  url: string | undefined;
};

function getDocIDFromTexts(texts: [string]): DocID {
  const regexpDOI = new RegExp(
    '(10[.][0-9]{2,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)',
    "g"
  );
  const regexpArxivDOI = new RegExp("(arXiv:[0-9]{4}[.][0-9]{4,5})", "g");
  const regexpISBN = new RegExp(
    "(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]",
    "g"
  );

  let doi: string | undefined = undefined;
  let arxiv: string | undefined = undefined;
  for (const text of texts) {
    const foundDOI = [...text.matchAll(regexpDOI)];
    for (const f of foundDOI) {
      let d = f[0] as string;
      if (d.charAt(d.length - 1) == ".") {
        d = d.substr(0, d.length - 1);
      }
      // Hack for POPL
      d = d.replace("10.1145/http://dx.doi.org/", "");
      doi = d;
      break;
    }
    if (doi != undefined) break;

    const foundArxivDOI = [...text.matchAll(regexpArxivDOI)];
    for (const f of foundArxivDOI) {
      const d = f[0] as string;
      arxiv = d.substring(6);
      break;
    }
    if (arxiv != undefined) break;
  }

  let isbn: string | undefined = undefined;
  for (const text of texts) {
    const foundISBN = [...text.matchAll(regexpISBN)];
    for (const f of foundISBN) {
      let d = f[0] as string;
      let n = "";
      for (const c of d) {
        if (("0" <= c && c <= "9") || c == "X") {
          n += c;
        }
      }

      if (n.length == 10) {
        const invalid = new RegExp(
          "(0000000000)|(1111111111)|(2222222222)|(3333333333)|(4444444444)|(5555555555)|(6666666666)|(7777777777)|(8888888888)|(9999999999)",
          "g"
        );
        const foundInvalid = [...n.matchAll(invalid)];
        if (foundInvalid.length != 0) {
          continue;
        }

        let cd = 0;
        for (let i = 0; i < 9; i++) {
          cd += (10 - i) * (n.charCodeAt(i) - "0".charCodeAt(0));
        }
        cd = 11 - (cd % 11);
        const cd_c =
          cd == 10 ? "X" : String.fromCharCode("0".charCodeAt(0) + cd);
        if (cd_c == n[9]) {
          isbn = n;
        }
      } else if (
        n.length == 13 &&
        (n.substring(0, 3) == "978" || n.substring(0, 3) == "979")
      ) {
        let cd = 0;
        for (let i = 0; i < 12; i++) {
          if (i % 2 == 0) {
            cd += n.charCodeAt(i) - "0".charCodeAt(0);
          } else {
            cd += (n.charCodeAt(i) - "0".charCodeAt(0)) * 3;
          }
        }
        cd = 10 - (cd % 10);
        const cd_c = String.fromCharCode("0".charCodeAt(0) + cd);
        if (cd_c == n[12]) {
          isbn = n;
        }
      }
      break;
    }
    if (isbn != undefined) break;
  }

  return {
    doi: doi,
    isbn: isbn,
    arxiv: arxiv,
    path: undefined,
    url: undefined,
  };
}

function getDocIDFromUrl(url: string): DocID | undefined {
  const regexpArxiv = new RegExp(
    "https://arxiv[.]org/pdf/([0-9]{4}[.][0-9]{4,5})[.]pdf",
    "g"
  );
  const foundArxiv = [...url.matchAll(regexpArxiv)];
  for (const f of foundArxiv) {
    return {
      doi: undefined,
      isbn: undefined,
      arxiv: f[1],
      path: undefined,
      url: undefined,
    };
  }
  return undefined;
}

function getDocIDManuallyWritten(pdf: string): DocID | undefined {
  const regexpDOI1 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[0-9]{4,}([_-][0-9()-]{6,})?)\\s*\\]",
    "g"
  );
  const foundDOI1 = [...pdf.matchAll(regexpDOI1)];
  for (const f of foundDOI1) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return {
      doi: d,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  const regexpDOI2 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[A-Z]{1,3}[0-9]+[0-9X])\\s*\\]",
    "g"
  );
  const foundDOI2 = [...pdf.matchAll(regexpDOI2)];
  for (const f of foundDOI2) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return {
      doi: d,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  const regexpDOI3 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[a-zA-z]+_[0-9]+_[0-9]+)\\s*\\]",
    "g"
  );
  const foundDOI3 = [...pdf.matchAll(regexpDOI3)];
  for (const f of foundDOI3) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return {
      doi: d,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  const regexpDOI4 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[0-9X-]+_[0-9]{1,})\\s*\\]",
    "g"
  );
  const foundDOI4 = [...pdf.matchAll(regexpDOI4)];
  for (const f of foundDOI4) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    return {
      doi: d,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  const regexpDOI6 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[a-zA-z]+-[0-9]+-[0-9]+)\\s*\\]",
    "g"
  );
  const foundDOI6 = [...pdf.matchAll(regexpDOI6)];
  for (const f of foundDOI6) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return {
      doi: d,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  const regexpDOI7 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_978-[0-9-]+)\\s*\\]",
    "g"
  );
  const foundDOI7 = [...pdf.matchAll(regexpDOI7)];
  for (const f of foundDOI7) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return {
      doi: d,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  const regexpISBN = new RegExp(
    ".*\\[\\s*jendeley\\s+isbn\\s+([0-9]{10,})\\s*\\]",
    "g"
  );
  const foundISBN = [...pdf.matchAll(regexpISBN)];
  for (const f of foundISBN) {
    let d = f[1] as string;
    return {
      doi: undefined,
      isbn: d,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }

  if (
    path.basename(pdf, ".pdf").endsWith("no_id") ||
    pdf.includes(JENDELEY_NO_ID)
  ) {
    return {
      doi: undefined,
      isbn: undefined,
      arxiv: undefined,
      path: pdf,
      url: undefined,
    };
  }

  return undefined;
}

async function getTitleFromPDF(
  pdf: string,
  papersDir: string
): Promise<string | undefined> {
  const pdfExtract = new PDFExtract();
  const options: PDFExtractOptions = {}; /* see below */
  const data = await pdfExtract
    .extract(path.join(papersDir, pdf), options)
    .catch(() => {
      logger.warn(
        "Failed to extract data using pdfExtract from " +
          path.join(papersDir, pdf)
      );
      return {};
    });
  if (
    data["meta"] != undefined &&
    data["meta"]["metadata"] != undefined &&
    data["meta"]["metadata"]["dc:title"] != undefined
  ) {
    const title = data["meta"]["metadata"]["dc:title"];
    logger.info("getTitleFromPDF(" + pdf + ", " + papersDir + ") = " + title);
    return title;
  } else if (
    data["meta"] != undefined &&
    data["meta"]["info"] != undefined &&
    data["meta"]["info"]["Title"] != undefined
  ) {
    const title = data["meta"]["info"]["Title"];
    logger.info("getTitleFromPDF(" + pdf + ", " + papersDir + ") = " + title);
    return title;
  } else {
    logger.info("getTitleFromPDF(" + pdf + ", " + papersDir + ") = undefined");
    return undefined;
  }
}

async function getDocIDFromTitle(
  pdf: string,
  papersDir: string
): Promise<DocID | undefined> {
  let titles: string[] = [];
  const titleFromPdf = await getTitleFromPDF(pdf, papersDir);
  if (
    titleFromPdf != undefined &&
    path.extname(titleFromPdf) != ".dvi" &&
    path.extname(titleFromPdf) != ".pdf"
  ) {
    titles.push(titleFromPdf);
  }

  let { got } = await import("got");

  for (const title of titles) {
    logger.info("getDocIDFromTitle title = " + title);
    const URL =
      "https://api.crossref.org/v1/works?query.bibliographic=" +
      title.replaceAll(" ", "+");
    const options = { headers: { Accept: "application/json" } };
    try {
      const data = (await got(URL, options).json()) as Object;
      const n_item = data["message"]["items"].length;
      for (let i = 0; i < n_item; i++) {
        const t = data["message"]["items"][i]["title"][0].toLowerCase();
        if (title.toLowerCase() == t) {
          logger.info("title = " + title + " t = " + t);
          const doi = data["message"]["items"][i]["DOI"];
          return {
            doi: doi,
            isbn: undefined,
            arxiv: undefined,
            path: undefined,
            url: undefined,
          };
        }
      }
    } catch {
      logger.warn("Failed to get information from doi: " + URL);
    }
  }
  return undefined;
}

function isValidDocID(docID: DocID) {
  if (
    docID.arxiv != undefined ||
    docID.doi != undefined ||
    docID.isbn != undefined ||
    docID.path != undefined
  )
    return true;
  else return false;
}

async function getDocID(
  pdf: string,
  papersDir: string,
  isBook: boolean,
  downloadUrl: string | undefined
): Promise<DocID> {
  const pdf_fullpath = path.join(papersDir, pdf);

  // Handle docIDs embedded in filenames.
  const manuallyWrittenDocID = getDocIDManuallyWritten(pdf);
  if (manuallyWrittenDocID != undefined) {
    return manuallyWrittenDocID;
  }

  // Download link gives you additional information
  if (downloadUrl != undefined) {
    const docIDFromUrl = getDocIDFromUrl(downloadUrl);
    if (docIDFromUrl != undefined) {
      return docIDFromUrl;
    }
  }

  // Try to get information using filename as title. Skip if `isBook` because
  // titles of chapters are sometimes confusing such as "Reference".
  if (!isBook) {
    const docIDFromTitle = await getDocIDFromTitle(pdf, papersDir);
    if (docIDFromTitle != undefined) {
      return docIDFromTitle;
    }
  }

  // Parse the contents of PDF and try to extract DOI, ISBN or arXiv ID.
  let dataBuffer = fs.readFileSync(pdf_fullpath);
  const texts = await pdfparse(dataBuffer)
    .then((data) => {
      // See https://www.npmjs.com/package/pdf-parse for usage
      return data.text.split(/\r?\n/);
    })
    .catch((e) => {
      logger.warn(e.message);
      return undefined;
    });

  if (texts == undefined) {
    logger.warn("Failed to extract text from " + pdf_fullpath);
    return {
      doi: undefined,
      isbn: undefined,
      arxiv: undefined,
      path: undefined,
      url: undefined,
    };
  }
  let id = getDocIDFromTexts(texts);
  logger.info("getDocIDFromTexts(texts) = " + JSON.stringify(id));
  if (isBook) {
    id.doi = undefined;
    id.arxiv = undefined;
    id.path = undefined;
  }
  if (isBook || isValidDocID(id)) {
    return id;
  }

  // The fallback case.
  logger.warn("Cannot decide docID of " + pdf);
  return {
    doi: undefined,
    arxiv: undefined,
    path: undefined,
    isbn: undefined,
    url: undefined,
  };
}

export {
  DocID,
  getDocID,
  getDocIDFromTexts,
  getDocIDFromUrl,
  getDocIDManuallyWritten,
  getDocIDFromTitle,
};

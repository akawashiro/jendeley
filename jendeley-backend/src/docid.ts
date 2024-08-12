import path from "path";
import fs from "fs";
import pdfparse from "pdf-parse";
import fetch from "node-fetch";
import { Request as NFRequest } from "node-fetch";
import { JENDELEY_NO_ID } from "./constants";
import { logger } from "./logger";
import { PDFExtract, PDFExtractOptions } from "pdf.js-extract";
import { Either, genLeft, genRight } from "./either";
import { ERROR_GET_DOCID_FROM_URL, ERROR_GET_DOC_ID } from "./error_messages";
import { concatDirs } from "./path_util";

type DocID =
  | { docIDType: "doi"; doi: string }
  | { docIDType: "isbn"; isbn: string }
  | { docIDType: "arxiv"; arxiv: string }
  | { docIDType: "path"; path: string[] }
  | { docIDType: "url"; url: string };

// This returns multiple DocIDs when it has multiple identifiers for example
// DOI and ISBN.
function getDocIDFromTexts(texts: string[]): DocID[] {
  const regexpDOI = new RegExp(
    '(10[.][0-9]{2,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)',
    "g",
  );
  const regexpArxivDOI = new RegExp("(arXiv:[0-9]{4}[.][0-9]{4,5})", "g");
  const regexpISBN = new RegExp(
    "(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}|97[89][0-9]{10}|(?=(?:[0-9]+[- ]){4})[- 0-9]{17})(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]",
    "g",
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
          "g",
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

  let docIDs: DocID[] = [];
  if (doi != undefined) {
    docIDs.push({ docIDType: "doi", doi: doi });
  }
  if (isbn != undefined) {
    docIDs.push({ docIDType: "isbn", isbn: isbn });
  }
  if (arxiv != undefined) {
    docIDs.push({ docIDType: "arxiv", arxiv: arxiv });
  }
  return docIDs;
}

function getDocIDFromUrl(url: string): Either<string, DocID> {
  const regexpArxiv = new RegExp(
    "https://arxiv[.]org/pdf/([0-9]{4}[.][0-9]{4,5})[.]pdf",
    "g",
  );
  const foundArxiv = [...url.matchAll(regexpArxiv)];
  for (const f of foundArxiv) {
    return genRight({ docIDType: "arxiv", arxiv: f[1] });
  }

  const regexpArxiv2 = new RegExp(
    "https://arxiv.org/ftp/arxiv/papers/[0-9]{4}/([0-9]{4}[.][0-9]{4,5})[.]pdf",
    "g",
  );
  const foundArxiv2 = [...url.matchAll(regexpArxiv2)];
  for (const f of foundArxiv2) {
    return genRight({ docIDType: "arxiv", arxiv: f[1] });
  }

  return genLeft(ERROR_GET_DOCID_FROM_URL);
}

function getDocIDManuallyWritten(pdf: string[]): Either<string, DocID> {
  const filename = pdf[pdf.length - 1];

  const regexpDOI1 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[0-9]{4,}([_-][0-9()-]{6,})?)\\s*\\]",
    "g",
  );
  const foundDOI1 = [...filename.matchAll(regexpDOI1)];
  for (const f of foundDOI1) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpDOI2 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[A-Z]{1,3}[0-9]+[0-9X])\\s*\\]",
    "g",
  );
  const foundDOI2 = [...filename.matchAll(regexpDOI2)];
  for (const f of foundDOI2) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpDOI3 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[a-zA-z]+_[0-9]+_[0-9]+)\\s*\\]",
    "g",
  );
  const foundDOI3 = [...filename.matchAll(regexpDOI3)];
  for (const f of foundDOI3) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpDOI4 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[0-9X-]+_[0-9]{1,})\\s*\\]",
    "g",
  );
  const foundDOI4 = [...filename.matchAll(regexpDOI4)];
  for (const f of foundDOI4) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpDOI6 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_[a-zA-z]+-[0-9]+-[0-9]+)\\s*\\]",
    "g",
  );
  const foundDOI6 = [...filename.matchAll(regexpDOI6)];
  for (const f of foundDOI6) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpDOI7 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+(10_[0-9]{4}_978-[0-9-]+)\\s*\\]",
    "g",
  );
  const foundDOI7 = [...filename.matchAll(regexpDOI7)];
  for (const f of foundDOI7) {
    let d = f[1] as string;
    d =
      d.substring(0, 2) +
      "." +
      d.substring(3, 3 + 4) +
      "/" +
      d.substring(3 + 4 + 1);
    d = d.replaceAll("_", ".");
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpDOI8 = new RegExp(
    "\\[\\s*jendeley\\s+doi\\s+10_([0-9]{4,})_([A-Za-z]+)_([0-9_]+)\\s*\\]",
    "g",
  );
  const foundDOI8 = [...filename.matchAll(regexpDOI8)];
  for (const f of foundDOI8) {
    console.log(f);
    const head = f[1] as string;
    const body = f[2] as string;
    const tail = (f[3] as string).replaceAll("_", ".");
    const d = `10.${head}/${body}/${tail}`;
    return genRight({ docIDType: "doi", doi: d });
  }

  const regexpArxiv = new RegExp(
    "\\[\\s*jendeley\\s+arxiv\\s+([0-9]{4}_[0-9v]+)\\s*\\]",
    "g",
  );
  const foundArxiv = [...filename.matchAll(regexpArxiv)];
  for (const f of foundArxiv) {
    let d = f[1] as string;
    d = d.substring(0, 4) + "." + d.substring(5);
    return genRight({ docIDType: "arxiv", arxiv: d });
  }

  const regexpISBN = new RegExp(
    ".*\\[\\s*jendeley\\s+isbn\\s+([0-9]{10,})\\s*\\]",
    "g",
  );
  const foundISBN = [...filename.matchAll(regexpISBN)];
  for (const f of foundISBN) {
    let d = f[1] as string;
    return genRight({ docIDType: "isbn", isbn: d });
  }

  if (filename.includes(JENDELEY_NO_ID)) {
    return genRight({ docIDType: "path", path: pdf });
  }

  return genLeft("Failed getDocIDManuallyWritten.");
}

function removeSquareBrackets(str: string) {
  let ret = "";
  let level = 0;
  for (let c of str) {
    if (c == "[") {
      level++;
    } else if (c == "]") {
      level--;
    } else if (level == 0) {
      ret += c;
    }
  }
  return ret;
}

async function getTitleFromPDF(
  pdf: string[],
  papersDir: string[],
): Promise<string | undefined> {
  const pdfExtract = new PDFExtract();
  const options: PDFExtractOptions = {}; /* see below */
  const data = await pdfExtract
    .extract(concatDirs(papersDir.concat(pdf)), options)
    .catch(() => {
      logger.warn(
        "Failed to extract data using pdfExtract from " +
          concatDirs(papersDir.concat(pdf)),
      );
      return {};
    });

  if (
    data["meta"] != undefined &&
    data["meta"]["metadata"] != undefined &&
    data["meta"]["metadata"]["dc:title"] != undefined &&
    data["meta"]["metadata"]["dc:title"] != "" &&
    data["meta"]["metadata"]["dc:title"] != "untitled"
  ) {
    const title = data["meta"]["metadata"]["dc:title"];
    logger.info("getTitleFromPDF(" + pdf + ", " + papersDir + ") = " + title);
    return title;
  }

  if (
    data["meta"] != undefined &&
    data["meta"]["info"] != undefined &&
    data["meta"]["info"]["Title"] != undefined &&
    data["meta"]["info"]["Title"] != "" &&
    data["meta"]["info"]["Title"] != "untitled"
  ) {
    const title = data["meta"]["info"]["Title"];
    logger.info("getTitleFromPDF(" + pdf + ", " + papersDir + ") = " + title);
    return title;
  }

  const tile_from_path = removeSquareBrackets(
    path.basename(pdf[pdf.length - 1], ".pdf"),
  );
  logger.info("title_from_path = " + tile_from_path);
  if (tile_from_path != "") {
    return tile_from_path;
  }

  logger.info("getTitleFromPDF(" + pdf + ", " + papersDir + ") = undefined");
  return undefined;
}

async function getDocIDFromTitle(
  pdf: string[],
  papersDir: string[],
): Promise<Either<string, DocID>> {
  let titles: string[] = [];
  const titleFromPdf = await getTitleFromPDF(pdf, papersDir);
  if (
    titleFromPdf != undefined &&
    path.extname(titleFromPdf) != ".dvi" &&
    path.extname(titleFromPdf) != ".pdf" &&
    path.extname(titleFromPdf) != ".tex"
  ) {
    titles.push(titleFromPdf);
  }

  for (const title of titles) {
    logger.info("getDocIDFromTitle title = " + title);

    // See here for API documentation
    // https://www.crossref.org/documentation/retrieve-metadata/rest-api/
    const URL =
      "https://api.crossref.org/v1/works?query.bibliographic=" +
      title.replaceAll(" ", "+");
    const options = { headers: { Accept: "application/json" } };
    try {
      const data = (await (
        await fetch(new NFRequest(URL, options))
      ).json()) as Object;
      const nItem = data["message"]["items"].length;
      for (let i = 0; i < nItem; i++) {
        const t = data["message"]["items"][i]["title"][0].toLowerCase();
        if (title.toLowerCase() == t) {
          logger.info("title = " + title + " t = " + t);
          const doi = data["message"]["items"][i]["DOI"];
          return genRight({ docIDType: "doi", doi: doi });
        }
      }
    } catch (error) {
      logger.warn("error = " + error);
      logger.warn("Failed to get information from doi: " + URL);
    }
  }
  return genLeft("Failed to get DocID in getDocIDFromTitle");
}

function sortDocIDs(docIDs: DocID[], num_pages: number): DocID[] {
  if (num_pages < 50) {
    // This case the PDF should be paper. We sort docs from arxiv -> DOI -> ISBN -> Others.
    let ret = docIDs.filter((d) => d.docIDType == "arxiv");
    ret = ret.concat(docIDs.filter((d) => d.docIDType == "doi"));
    ret = ret.concat(docIDs.filter((d) => d.docIDType == "isbn"));
    ret = ret.concat(
      docIDs.filter(
        (d) =>
          d.docIDType != "arxiv" &&
          d.docIDType != "doi" &&
          d.docIDType != "isbn",
      ),
    );
    return ret;
  } else {
    let ret = docIDs.filter((d) => d.docIDType == "isbn");
    ret = ret.concat(docIDs.filter((d) => d.docIDType == "doi"));
    ret = ret.concat(docIDs.filter((d) => d.docIDType == "arxiv"));
    ret = ret.concat(
      docIDs.filter(
        (d) =>
          d.docIDType != "arxiv" &&
          d.docIDType != "doi" &&
          d.docIDType != "isbn",
      ),
    );
    return ret;
  }
}

async function getDocID(
  pdf: string[],
  papersDir: string[],
  isBook: boolean,
  downloadUrl: string | undefined,
): Promise<Either<string, DocID>> {
  const pdfFullpath = concatDirs(papersDir.concat(pdf));

  // Handle docIDs embedded in filenames.
  const manuallyWrittenDocID = getDocIDManuallyWritten(pdf);
  if (manuallyWrittenDocID._tag === "right") {
    return manuallyWrittenDocID;
  }

  // Download link gives you additional information
  if (downloadUrl != undefined) {
    const docIDFromUrl = getDocIDFromUrl(downloadUrl);
    if (docIDFromUrl._tag === "right") {
      return docIDFromUrl;
    }
  }

  // Try to get information using filename as title. Skip if `isBook` because
  // titles of chapters are sometimes confusing such as "Reference".
  if (!isBook) {
    const docIDFromTitle = await getDocIDFromTitle(pdf, papersDir);
    if (docIDFromTitle._tag === "right") {
      return docIDFromTitle;
    }
  }

  // Parse the contents of PDF and try to extract DOI, ISBN or arXiv ID.
  let dataBuffer: Buffer;
  try {
    dataBuffer = fs.readFileSync(pdfFullpath);
  } catch (err) {
    const msg = "Cannot read " + pdfFullpath + ".";
    logger.warn(msg);
    return genLeft(msg);
  }
  let texts: string[] = [];
  let num_pages = 0;
  try {
    const data = await pdfparse(dataBuffer);
    texts = data.text.split(/\r?\n/);
    num_pages = data.numpages;
  } catch (err: any) {
    logger.warn(err.message);
    return genLeft("Failed to extract text from " + pdfFullpath);
  }

  const ids = sortDocIDs(getDocIDFromTexts(texts), num_pages);
  logger.info(
    "sortDocIDs(getDocIDFromTexts(texts)) = " +
      JSON.stringify(ids) +
      " num_pages = " +
      num_pages,
  );
  if (isBook) {
    for (const i of ids) {
      if (i.docIDType == "isbn") {
        return genRight(i);
      }
    }
  } else {
    if (ids.length >= 1) {
      return genRight(ids[0]);
    } else {
      const error_message = "There is no document identifiers in " + pdf;
      logger.warn(error_message);
      return genLeft(error_message);
    }
  }

  // The fallback case.
  logger.warn("Cannot decide docID of " + pdf);
  return genLeft(ERROR_GET_DOC_ID + pdf);
}

export {
  DocID,
  getDocID,
  getDocIDFromTexts,
  getDocIDFromUrl,
  getDocIDManuallyWritten,
  getDocIDFromTitle,
};

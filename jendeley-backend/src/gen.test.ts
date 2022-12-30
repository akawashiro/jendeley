import { getJson, getTitleFromPath } from "./gen";
import { DocID, getDocID, getDocIDFromTexts, getDocIDFromTitle } from "./docid";
import * as E from "fp-ts/lib/Either";

function rightDoi(doi: string): E.Either<string, DocID> {
  return E.right({
    doi: doi,
    isbn: undefined,
    arxiv: undefined,
    path: undefined,
    url: undefined,
  });
}

function rightIsbn(isbn: string) {
  return E.right({
    doi: undefined,
    isbn: isbn,
    arxiv: undefined,
    path: undefined,
    url: undefined,
  });
}

function rightPath(path: string) {
  return E.right({
    doi: undefined,
    isbn: undefined,
    arxiv: undefined,
    path: path,
    url: undefined,
  });
}

function rightArxiv(arxiv: string) {
  return E.right({
    doi: undefined,
    isbn: undefined,
    arxiv: arxiv,
    path: undefined,
    url: undefined,
  });
}

test.skip("DOI from title", async () => {
  const pdf =
    "/papers/[Thomas van Noort, Peter Achten, Rinus Plasmeijer] Ad-hoc Polymorphism and Dynamic Typing in a Statically Typed Functional Language.pdf";
  const docID = await getDocIDFromTitle(pdf, "hoge");
  expect(docID).toBe(rightDoi("10.1145/1863495.1863505"));
});

test("Title from path", async () => {
  const pdf =
    "DependentType/[EDWIN BRADY] Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation.pdf";
  const title = getTitleFromPath(pdf);
  expect(title).toBe(
    "Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation"
  );
});

test("JSON from path", async () => {
  const pdf =
    "DistributedLearning/[Jeffrey Dean] Large Scale Distributed Deep Networks [jendeley no id].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);

  if (E.isRight(docID)) {
    const t = await getJson(E.toUnion(docID), pdf);
    expect(t).toBeTruthy();
    if (t == undefined) return;
    const json = t[0];
    expect(json).toBeTruthy();
    if (json == undefined) return;
    expect(json["title"]).toBe(
      "DistributedLearning/[Jeffrey Dean] Large Scale Distributed Deep Networks [jendeley no id].pdf"
    );
  }
});

test("ISBN from text", async () => {
  const docID1 = await getDocIDFromTexts([
    "ISBN 0-262-16209-1 (hc. : alk. paper)",
  ]);
  expect(docID1).toBe(rightIsbn("0262162091"));

  const docID2 = await getDocIDFromTexts([
    "ISBN: 0262162091 (hc. : alk. paper)",
  ]);
  expect(docID2).toBe(rightIsbn("0262162091"));
});

test("no_id from path", async () => {
  const pdf = "hoge_no_id.pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual({
    arxiv: undefined,
    doi: undefined,
    isbn: undefined,
    path: "hoge_no_id.pdf",
    url: undefined,
  });
});

test("jendeley no id from path", async () => {
  const pdf = "hoge [jendeley no id].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual(rightPath("hoge [jendeley no id].pdf"));
});

test("arXiv from URL", async () => {
  const pdf = "hoge.pdf";
  const url = "https://arxiv.org/pdf/2212.07677.pdf";
  const docID = await getDocID(pdf, "/hoge/", false, url);
  expect(docID).toStrictEqual(rightArxiv("2212.07677"));
});

test("ISBN from path", async () => {
  const pdf = "hoge [jendeley isbn 9781467330763].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual(rightIsbn("9781467330763"));
});

test("ISBN from path", async () => {
  const pdf = "hoge [jendeley   isbn   9781467330763].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual(rightIsbn("9781467330763"));
});

test("DOI from path", async () => {
  const pdf = "hoge [jendeley doi 10_1145_3290364].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1145/3290364"));
});

test("DOI from path", async () => {
  const pdf =
    "Everything Old is New Again Binary Security of WebAssembly [jendeley doi 10_5555_3489212_3489225].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.5555/3489212.3489225"));
});

test("Complicated doi from path", async () => {
  const pdf2 =
    "DependentType/[EDWIN BRADY] Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation [jendeley doi 10_1017_S095679681300018X].pdf";
  const docID2 = await getDocID(pdf2, "/hoge/", false, undefined);
  expect(docID2).toStrictEqual(rightDoi("10.1017/S095679681300018X"));
});

test("Complicated doi from path", async () => {
  const pdf4 =
    "MemoryModel/[Scott Owens, Susmit Sarkar, Peter Sewell] A Better x86 Memory Model x86-TSO [jendeley doi 10_1007_978-3-642-03359-9_27].pdf";
  const docID4 = await getDocID(pdf4, "/hoge/", false, undefined);
  expect(docID4).toStrictEqual(rightDoi("10.1007/978-3-642-03359-9_27"));
});

test("Complicated doi from path", async () => {
  const pdf5 =
    "Riffle An Efficient Communication System with Strong Anonymity [jendeley doi 10_1515_popets-2016-0008].pdf";
  const docID5 = await getDocID(pdf5, "/hoge/", false, undefined);
  expect(docID5).toStrictEqual(rightDoi("10.1515/popets-2016-0008"));
});

test("Complicated doi from path", async () => {
  const pdf7 =
    "[Peter Dybjer] Inductive families [jendeley doi 10_1007_BF01211308].pdf";
  const docID7 = await getDocID(pdf7, "/hoge/", false, undefined);
  expect(docID7).toStrictEqual(rightDoi("10.1007/BF01211308"));
});

test("Complicated doi from path", async () => {
  const pdf9 =
    "[Henk Barendregt] Lambda Calculus with Types [jendeley doi 10_1017_CBO9781139032636].pdf";
  const docID9 = await getDocID(pdf9, "/hoge/", false, undefined);
  expect(docID9).toStrictEqual(rightDoi("10.1017/CBO9781139032636"));
});

test("Complicated journal-like doi from path", async () => {
  const pdf1 =
    "Call-by-name, call-by-value and the λ-calculus [jendeley doi 10_1016_0304-3975(75)90017-1].pdf";
  const docID1 = await getDocID(pdf1, "/hoge/", false, undefined);
  expect(docID1).toStrictEqual({
    arxiv: undefined,
    doi: "10.1016/0304-3975(75)90017-1",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });

  const pdf3 =
    "Emerging-MPEG-Standards-for-Point-Cloud-Compression [jendeley doi 10_1109_JETCAS_2018_2885981].pdf";
  const docID3 = await getDocID(pdf3, "/hoge/", false, undefined);
  expect(docID3).toStrictEqual({
    arxiv: undefined,
    doi: "10.1109/JETCAS.2018.2885981",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });

  const pdf10 =
    "[John C. Reynolds] Separation Logic A Logic for Shared Mutable Data Structures [jendeley doi 10_1109_LICS_2002_1029817].pdf";
  const docID10 = await getDocID(pdf10, "/hoge/", false, undefined);
  expect(docID10).toStrictEqual({
    arxiv: undefined,
    doi: "10.1109/LICS.2002.1029817",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });
});

test("Complicated journal-like doi from path", async () => {
  const pdf1 =
    "Call-by-name, call-by-value and the λ-calculus [jendeley doi 10_1016_0304-3975(75)90017-1].pdf";
  const docID1 = await getDocID(pdf1, "/hoge/", false, undefined);
  expect(docID1).toStrictEqual({
    arxiv: undefined,
    doi: "10.1016/0304-3975(75)90017-1",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });

  const pdf3 =
    "Emerging-MPEG-Standards-for-Point-Cloud-Compression [jendeley doi 10_1109_JETCAS_2018_2885981].pdf";
  const docID3 = await getDocID(pdf3, "/hoge/", false, undefined);
  expect(docID3).toStrictEqual({
    arxiv: undefined,
    doi: "10.1109/JETCAS.2018.2885981",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });

  const pdf10 =
    "[John C. Reynolds] Separation Logic A Logic for Shared Mutable Data Structures [jendeley doi 10_1109_LICS_2002_1029817].pdf";
  const docID10 = await getDocID(pdf10, "/hoge/", false, undefined);
  expect(docID10).toStrictEqual({
    arxiv: undefined,
    doi: "10.1109/LICS.2002.1029817",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });
});

test("Complicated book-like doi from path", async () => {
  const pdf =
    "MultistageProgramming/[Oleg Kiselyov] The Design and Implementation of BER MetaOCaml [jendeley doi 10_1007_978-3-319-07151-0_6].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual({
    arxiv: undefined,
    doi: "10.1007/978-3-319-07151-0_6",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });
});

test("Complicated book-like doi from path", async () => {
  const pdf =
    "[Paul Blain Levy] Call By Push Value [jendeley doi 10_1007_978-94-007-0954-6].pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual({
    arxiv: undefined,
    doi: "10.1007/978-94-007-0954-6",
    isbn: undefined,
    path: undefined,
    url: undefined,
  });
});

test.skip("Lonely planet China", async () => {
  const pdf = "lonelyplanet-china-15-full-book.pdf";
  const docID = await getDocID(pdf, "/hoge/", false, undefined);
  expect(docID).toStrictEqual({
    arxiv: undefined,
    doi: undefined,
    isbn: "9781786575227",
    path: undefined,
    url: undefined,
  });
});

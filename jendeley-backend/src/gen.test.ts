import {
  getDocID,
  getDocIDFromTexts,
  getJson,
  getTitleFromPath,
  getDocIDFromTitle,
} from "./gen";

test.skip("DOI from title", async () => {
  const pdf =
    "/papers/[Thomas van Noort, Peter Achten, Rinus Plasmeijer]Ad-hoc Polymorphism and Dynamic Typing in a Statically Typed Functional Language.pdf";
  const docID = await getDocIDFromTitle(pdf);
  expect(docID?.doi).toBe("10.1145/1863495.1863505");
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
  const docID = await getDocID(pdf, "/hoge/", false, null);
  const t = await getJson(docID, pdf);
  expect(t).toBeTruthy();
  if (t == null) return;
  const json = t[0];
  expect(json).toBeTruthy();
  if (json == null) return;
  expect(json["title"]).toBe(
    "DistributedLearning/[Jeffrey Dean] Large Scale Distributed Deep Networks [jendeley no id].pdf"
  );
});

test("ISBN from text", async () => {
  const docID1 = await getDocIDFromTexts([
    "ISBN 0-262-16209-1 (hc. : alk. paper)",
  ]);
  expect(docID1.isbn).toBe("0262162091");

  const docID2 = await getDocIDFromTexts([
    "ISBN: 0262162091 (hc. : alk. paper)",
  ]);
  expect(docID2.isbn).toBe("0262162091");
});

test("no_id from path", async () => {
  const pdf4 = "hoge_no_id.pdf";
  const docID4 = await getDocID(pdf4, "/hoge/", false, null);
  expect(docID4).toStrictEqual({
    arxiv: null,
    doi: null,
    isbn: null,
    path: "hoge_no_id.pdf",
  });
});

test("arXiv from URL", async () => {
  const pdf = "hoge.pdf";
  const url = "https://arxiv.org/pdf/2212.07677.pdf";
  const docID = await getDocID(pdf, "/hoge/", false, url);
  expect(docID).toStrictEqual({
    arxiv: "2212.07677",
    doi: null,
    isbn: null,
    path: null,
  });
});

test("ISBN from path", async () => {
  const pdf5 = "hoge_isbn_9781467330763.pdf";
  const docID5 = await getDocID(pdf5, "/hoge/", false, null);
  expect(docID5).toStrictEqual({
    arxiv: null,
    doi: null,
    isbn: "9781467330763",
    path: null,
  });
});

test("DOI from path", async () => {
  const pdf6 = "hoge_doi_10_1145_3290364.pdf";
  const docID6 = await getDocID(pdf6, "/hoge/", false, null);
  expect(docID6).toStrictEqual({
    arxiv: null,
    doi: "10.1145/3290364",
    isbn: null,
    path: null,
  });

  const pdf7 =
    "A Dependently Typed Assembly Language_doi_10_1145_507635_507657.pdf";
  const docID7 = await getDocID(pdf7, "/hoge/", false, null);
  expect(docID7).toStrictEqual({
    arxiv: null,
    doi: "10.1145/507635.507657",
    isbn: null,
    path: null,
  });
});

test("Complicated doi from path", async () => {
  const pdf2 =
    "DependentType/[EDWIN BRADY] Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation_doi_10_1017_S095679681300018X.pdf";
  const docID2 = await getDocID(pdf2, "/hoge/", false, null);
  expect(docID2).toStrictEqual({
    arxiv: null,
    doi: "10.1017/S095679681300018X",
    isbn: null,
    path: null,
  });

  const pdf4 =
    "MemoryModel/[Scott Owens, Susmit Sarkar, Peter Sewell] A Better x86 Memory Model x86-TSO_doi_10_1007_978-3-642-03359-9_27.pdf";
  const docID4 = await getDocID(pdf4, "/hoge/", false, null);
  expect(docID4).toStrictEqual({
    arxiv: null,
    doi: "10.1007/978-3-642-03359-9_27",
    isbn: null,
    path: null,
  });

  const pdf5 =
    "Riffle An Efficient Communication System with Strong Anonymity_doi_10_1515_popets-2016-0008.pdf";
  const docID5 = await getDocID(pdf5, "/hoge/", false, null);
  expect(docID5).toStrictEqual({
    arxiv: null,
    doi: "10.1515/popets-2016-0008",
    isbn: null,
    path: null,
  });

  const pdf7 = "[Peter Dybjer] Inductive families_doi_10_1007_BF01211308.pdf";
  const docID7 = await getDocID(pdf7, "/hoge/", false, null);
  expect(docID7).toStrictEqual({
    arxiv: null,
    doi: "10.1007/BF01211308",
    isbn: null,
    path: null,
  });

  const pdf9 =
    "[Henk Barendregt] Lambda Calculus with Types_doi_10_1017_CBO9781139032636.pdf";
  const docID9 = await getDocID(pdf9, "/hoge/", false, null);
  expect(docID9).toStrictEqual({
    arxiv: null,
    doi: "10.1017/CBO9781139032636",
    isbn: null,
    path: null,
  });
});

test("Complicated journal-like doi from path", async () => {
  const pdf1 =
    "Call-by-name, call-by-value and the λ-calculus_doi_10_1016_0304-3975(75)90017-1.pdf";
  const docID1 = await getDocID(pdf1, "/hoge/", false, null);
  expect(docID1).toStrictEqual({
    arxiv: null,
    doi: "10.1016/0304-3975(75)90017-1",
    isbn: null,
    path: null,
  });

  const pdf3 =
    "Emerging-MPEG-Standards-for-Point-Cloud-Compression_doi_10_1109_JETCAS_2018_2885981.pdf";
  const docID3 = await getDocID(pdf3, "/hoge/", false, null);
  expect(docID3).toStrictEqual({
    arxiv: null,
    doi: "10.1109/JETCAS.2018.2885981",
    isbn: null,
    path: null,
  });

  const pdf10 =
    "[John C. Reynolds] Separation Logic A Logic for Shared Mutable Data Structures_doi_10_1109_LICS_2002_1029817.pdf";
  const docID10 = await getDocID(pdf10, "/hoge/", false, null);
  expect(docID10).toStrictEqual({
    arxiv: null,
    doi: "10.1109/LICS.2002.1029817",
    isbn: null,
    path: null,
  });
});

test("Complicated book-like doi from path", async () => {
  const pdf6 =
    "MultistageProgramming/[Oleg Kiselyov] The Design and Implementation of BER MetaOCaml_doi_10_1007_978-3-319-07151-0_6.pdf";
  const docID6 = await getDocID(pdf6, "/hoge/", false, null);
  expect(docID6).toStrictEqual({
    arxiv: null,
    doi: "10.1007/978-3-319-07151-0_6",
    isbn: null,
    path: null,
  });

  const pdf11 =
    "[Paul Blain Levy] Call By Push Value_doi_10_1007_978-94-007-0954-6.pdf";
  const docID11 = await getDocID(pdf11, "/hoge/", false, null);
  expect(docID11).toStrictEqual({
    arxiv: null,
    doi: "10.1007/978-94-007-0954-6",
    isbn: null,
    path: null,
  });
});

test.skip("Lonely planet China", async () => {
  const pdf8 = "lonelyplanet-china-15-full-book.pdf";
  const docID8 = await getDocID(pdf8, "/hoge/", false, null);
  expect(docID8).toStrictEqual({
    arxiv: null,
    doi: null,
    isbn: "9781786575227",
    path: null,
  });
});

import { getJson, getTitleFromPath } from "./gen";
import { DocID, getDocID, getDocIDFromTexts, getDocIDFromTitle } from "./docid";
import { Either, genRight } from "./either";

function rightDoi(doi: string): Either<string, DocID> {
  return genRight({ docIDType: "doi", doi: doi });
}

function rightIsbn(isbn: string) {
  return genRight({ docIDType: "isbn", isbn: isbn });
}

function rightPath(path: string[]) {
  return genRight({ docIDType: "path", path: path });
}

function rightArxiv(arxiv: string) {
  return genRight({ docIDType: "arxiv", arxiv: arxiv });
}

test.skip("DOI from title", async () => {
  const pdf = [
    "/papers/[Thomas van Noort, Peter Achten, Rinus Plasmeijer] Ad-hoc Polymorphism and Dynamic Typing in a Statically Typed Functional Language.pdf",
  ];
  const docID = await getDocIDFromTitle(pdf, ["hoge"]);
  expect(docID).toBe(rightDoi("10.1145/1863495.1863505"));
});

test("Title from path", async () => {
  const pdf = [
    "DependentType/[EDWIN BRADY] Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation.pdf",
  ];
  const title = getTitleFromPath(pdf);
  expect(title).toBe(
    "Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation"
  );
});

// test("JSON from path", async () => {
//   const pdf = [
//     "DistributedLearning/[Jeffrey Dean] Large Scale Distributed Deep Networks [jendeley no id].pdf",
//   ];
//   const docID = await getDocID(pdf, ["hoge"], false, undefined);
//
//   if (docID._tag === "right") {
//     const t = await getJson(docID.right, pdf);
//     if (t._tag === "left") return;
//     const json = t.right.dbEntry;
//     if (json.idType !== "path") return;
//     expect(json.title).toBe(
//       "DistributedLearning/[Jeffrey Dean] Large Scale Distributed Deep Networks [jendeley no id].pdf"
//     );
//   }
// });

test("ISBN from text", async () => {
  const docID = getDocIDFromTexts(["ISBN 0-262-16209-1 (hc. : alk. paper)"]);
  expect(docID).toStrictEqual([{ docIDType: "isbn", isbn: "0262162091" }]);
});

test("ISBN from text 2", async () => {
  const docID = getDocIDFromTexts(["ISBN: 0262162091 (hc. : alk. paper)"]);
  expect(docID).toStrictEqual([{ docIDType: "isbn", isbn: "0262162091" }]);
});

test("jendeley no id from path", async () => {
  const pdf = ["hoge [jendeley no id].pdf"];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightPath(["hoge [jendeley no id].pdf"]));
});

test("arXiv from URL", async () => {
  const pdf = ["hoge.pdf"];
  const url = "https://arxiv.org/pdf/2212.07677.pdf";
  const docID = await getDocID(pdf, ["hoge"], false, url);
  expect(docID).toStrictEqual(rightArxiv("2212.07677"));
});

test("arXiv from path", async () => {
  const pdf = [
    "A Program Logic for First-Order Encapsulated WebAssembly [jendeley arxiv 1811_03479v3].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightArxiv("1811.03479v3"));
});

test("ISBN from path", async () => {
  const pdf = ["hoge [jendeley isbn 9781467330763].pdf"];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightIsbn("9781467330763"));
});

test("ISBN from path", async () => {
  const pdf = ["hoge [jendeley   isbn   9781467330763].pdf"];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightIsbn("9781467330763"));
});

test("DOI from path", async () => {
  const pdf = ["hoge [jendeley doi 10_1145_3290364].pdf"];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1145/3290364"));
});

test("DOI from path", async () => {
  const pdf = [
    "Everything Old is New Again Binary Security of WebAssembly [jendeley doi 10_5555_3489212_3489225].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.5555/3489212.3489225"));
});

test("Complicated doi from path", async () => {
  const pdf = [
    "DependentType/[EDWIN BRADY] Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation [jendeley doi 10_1017_S095679681300018X].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1017/S095679681300018X"));
});

test("Complicated doi from path", async () => {
  const pdf = [
    "MemoryModel/[Scott Owens, Susmit Sarkar, Peter Sewell] A Better x86 Memory Model x86-TSO [jendeley doi 10_1007_978-3-642-03359-9_27].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1007/978-3-642-03359-9_27"));
});

test("Complicated doi from path", async () => {
  const pdf = [
    "Riffle An Efficient Communication System with Strong Anonymity [jendeley doi 10_1515_popets-2016-0008].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1515/popets-2016-0008"));
});

test("Complicated doi from path", async () => {
  const pdf = [
    "[Peter Dybjer] Inductive families [jendeley doi 10_1007_BF01211308].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1007/BF01211308"));
});

test("Complicated doi from path", async () => {
  const pdf = [
    "[Henk Barendregt] Lambda Calculus with Types [jendeley doi 10_1017_CBO9781139032636].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1017/CBO9781139032636"));
});

test("Complicated journal-like doi from path", async () => {
  const pdf = [
    "Call-by-name, call-by-value and the λ-calculus [jendeley doi 10_1016_0304-3975(75)90017-1].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1016/0304-3975(75)90017-1"));
});

test("Complicated journal-like doi from path 2", async () => {
  const pdf = [
    "Emerging-MPEG-Standards-for-Point-Cloud-Compression [jendeley doi 10_1109_JETCAS_2018_2885981].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1109/JETCAS.2018.2885981"));
});

test("Complicated journal-like doi from path 3", async () => {
  const pdf = [
    "[John C. Reynolds] Separation Logic A Logic for Shared Mutable Data Structures [jendeley doi 10_1109_LICS_2002_1029817].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1109/LICS.2002.1029817"));
});

test("Complicated journal-like doi from path 4", async () => {
  const pdf = [
    "Call-by-name, call-by-value and the λ-calculus [jendeley doi 10_1016_0304-3975(75)90017-1].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1016/0304-3975(75)90017-1"));
});

test("Complicated journal-like doi from path 5", async () => {
  const pdf = [
    "Emerging-MPEG-Standards-for-Point-Cloud-Compression [jendeley doi 10_1109_JETCAS_2018_2885981].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1109/JETCAS.2018.2885981"));
});

test("Complicated journal-like doi from path 6", async () => {
  const pdf = [
    "[John C. Reynolds] Separation Logic A Logic for Shared Mutable Data Structures [jendeley doi 10_1109_LICS_2002_1029817].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1109/LICS.2002.1029817"));
});

test("Complicated book-like doi from path 7", async () => {
  const pdf = [
    "MultistageProgramming/[Oleg Kiselyov] The Design and Implementation of BER MetaOCaml [jendeley doi 10_1007_978-3-319-07151-0_6].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1007/978-3-319-07151-0_6"));
});

test("Complicated book-like doi from path 8", async () => {
  const pdf = [
    "[Paul Blain Levy] Call By Push Value [jendeley doi 10_1007_978-94-007-0954-6].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1007/978-94-007-0954-6"));
});

test("DOI from path https://github.com/akawashiro/jendeley/issues/258", async () => {
  const pdf = [
    "27-2-573 [jendeley doi 10_1093_nar_27_2_573].pdf",
  ];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightDoi("10.1093/nar/27.2.573"));
});

test.skip("Lonely planet China", async () => {
  const pdf = ["lonelyplanet-china-15-full-book.pdf"];
  const docID = await getDocID(pdf, ["hoge"], false, undefined);
  expect(docID).toStrictEqual(rightIsbn("9781786575227"));
});

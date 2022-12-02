import exp from 'constants';
import {getDocID, getDocIDFromTexts, getJson} from './gen'

test('ISBN from text', async () => {
    const docID1 = await getDocIDFromTexts(['ISBN 0-262-16209-1 (hc. : alk. paper)']);
    expect(docID1.isbn).toBe("0262162091");

    const docID2 = await getDocIDFromTexts(['ISBN: 0262162091 (hc. : alk. paper)']);
    expect(docID2.isbn).toBe("0262162091");
});

test('no_id from path', async () => {
    const pdf4 = '/hoge/hoge_no_id.pdf';
    const docID4 = await getDocID(pdf4, "/hoge/");
    expect(docID4).toStrictEqual({"arxiv": null, "doi": null, "isbn": null, "path": "hoge_no_id.pdf"});
});

test('ISBN from path', async () => {
    const pdf5 = '/hoge/hoge_isbn_9781467330763.pdf';
    const docID5 = await getDocID(pdf5, "/hoge/");
    expect(docID5).toStrictEqual({"arxiv": null, "doi": null, "isbn": "9781467330763", "path": null});
});

test('DOI from path', async () => {
    const pdf6 = '/hoge/hoge_doi_10_1145_3290364.pdf';
    const docID6 = await getDocID(pdf6, "/hoge/");
    expect(docID6).toStrictEqual({"arxiv": null, "doi": "10.1145/3290364", "isbn": null, "path": null});

    const pdf7 = '/hoge/A Dependently Typed Assembly Language_doi_10_1145_507635_507657.pdf';
    const docID7 = await getDocID(pdf7, "/hoge/");
    expect(docID7).toStrictEqual({"arxiv": null, "doi": "10.1145/507635.507657", "isbn": null, "path": null});
});

test('Complicated doi from path', async () => {
    const pdf1 = "/hoge/Call-by-name, call-by-value and the λ-calculus_doi_10_1016_0304-3975(75)90017-1.pdf";
    const docID1 = await getDocID(pdf1, "/hoge/");
    expect(docID1).toStrictEqual({"arxiv": null, "doi": "10.1016/0304-3975(75)90017-1", "isbn": null, "path": null});

    const pdf2 = "/hoge/DependentType/[EDWIN BRADY] Idris, a General Purpose Dependently Typed Programming Language- Design and Implementation_doi_10_1017_S095679681300018X.pdf";
    const docID2 = await getDocID(pdf2, "/hoge/");
    expect(docID2).toStrictEqual({"arxiv": null, "doi": "10.1017/S095679681300018X", "isbn": null, "path": null});

    const pdf3 = "/hoge/Emerging-MPEG-Standards-for-Point-Cloud-Compression_doi_10_1109_JETCAS_2018_2885981.pdf";
    const docID3 = await getDocID(pdf3, "/hoge/");
    expect(docID3).toStrictEqual({"arxiv": null, "doi": "10.1109/JETCAS.2018.2885981", "isbn": null, "path": null});

    const pdf4 = "/hoge/MemoryModel/[Scott Owens, Susmit Sarkar, Peter Sewell] A Better x86 Memory Model x86-TSO_doi_10_1007_978-3-642-03359-9_27.pdf";
    const docID4 = await getDocID(pdf4, "/hoge/");
    expect(docID4).toStrictEqual({"arxiv": null, "doi": "10.1007/978-3-642-03359-9_27", "isbn": null, "path": null});

    const pdf5 = "/hoge/Riffle An Efficient Communication System with Strong Anonymity_doi_10_1515_popets-2016-0008.pdf";
    const docID5 = await getDocID(pdf5, "/hoge/");
    expect(docID5).toStrictEqual({"arxiv": null, "doi": "10.1515/popets-2016-0008", "isbn": null, "path": null});

    const pdf6 = "/hoge/MultistageProgramming/[Oleg Kiselyov] The Design and Implementation of BER MetaOCaml_doi_10_1007_978-3-319-07151-0_6.pdf";
    const docID6 = await getDocID(pdf6, "/hoge/");
    expect(docID6).toStrictEqual({"arxiv": null, "doi": "10.1007/978-3-319-07151-0_6", "isbn": null, "path": null});
});

test.skip('Lonely planet China', async () => {
    const pdf8 = '/hoge/lonelyplanet-china-15-full-book.pdf';
    const docID8 = await getDocID(pdf8, "/hoge/");
    expect(docID8).toStrictEqual({"arxiv": null, "doi": null, "isbn": "9781786575227", "path": null});
});

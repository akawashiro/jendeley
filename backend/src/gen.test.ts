import exp from 'constants';
import {getDocID, getDocIDFromTexts, getJson} from './gen'

test('genDocID', async () => {
    const docID1 = await getDocIDFromTexts(['ISBN 0-262-16209-1 (hc. : alk. paper)']);
    expect(docID1.isbn).toBe("0262162091");

    const docID2 = await getDocIDFromTexts(['ISBN: 0262162091 (hc. : alk. paper)']);
    expect(docID2.isbn).toBe("0262162091");

    // const pdf3 = '/home/akira/Dropbox/papers/fusion/ConvFusion A Model for Layer Fusion in Convolutional Neural Networks [Luc Waeijen, Savvas Sioutas, Maurice Peemen, Menno Lindwer, Henk Corporaal].pdf';
    // const docID3 = await getDocID(pdf3, "/home/akira/Dropbox/papers");
    // expect(docID3.doi != null).toBe(true);
    // const json3 = await getJson(docID3, pdf3);
    // expect(json3 != null).toBe(true);

    const pdf4 = '/home/akira/Dropbox/papers/hoge_no_id.pdf';
    const docID4 = await getDocID(pdf4, "/home/akira/Dropbox/papers/");
    expect(docID4).toStrictEqual({"arxiv": null, "doi": null, "isbn": null, "path": "hoge_no_id.pdf"});

    const pdf5 = '/home/akira/Dropbox/papers/hoge_isbn_9781467330763.pdf';
    const docID5 = await getDocID(pdf5, "/home/akira/Dropbox/papers/");
    expect(docID5).toStrictEqual({"arxiv": null, "doi": null, "isbn": "9781467330763", "path": null});

    const pdf6 = '/home/akira/Dropbox/papers/hoge_doi_10_1145_3290364.pdf';
    const docID6 = await getDocID(pdf6, "/home/akira/Dropbox/papers/");
    expect(docID6).toStrictEqual({"arxiv": null, "doi": "10.1145/3290364", "isbn": null, "path": null});
});

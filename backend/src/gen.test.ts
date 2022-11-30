import exp from 'constants';
import {getDocIDFromTexts} from './gen'

test('TAPL ISBN', async () => {
    const docID1 = await getDocIDFromTexts(['ISBN 0-262-16209-1 (hc. : alk. paper)']);
    console.log(docID1);
    expect(docID1.isbn != null).toBe(true);

    const docID2 = await getDocIDFromTexts(['ISBN: 0262162091 (hc. : alk. paper)']);
    console.log("docID2 = ", docID2);
    expect(docID2.isbn != null).toBe(true);
});

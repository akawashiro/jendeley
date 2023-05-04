import { fuzzySearch } from "./fuzzysearch";

test("fuzzy search", () => {
  const text = "wantedwtd";
  const query = "wtd";
  const matches = fuzzySearch(text, query);
  let match_strs = matches.map((m) => {
    return text.slice(m.start, m.end + 1);
  });
  expect(match_strs).toStrictEqual(["wtd", "wanted"]);
});

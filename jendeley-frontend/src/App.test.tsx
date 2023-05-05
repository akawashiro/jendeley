import { fuzzySearch } from "./fuzzysearch";

test("fuzzy search", () => {
  const text = "wantedwtdwnted";
  const query = "wtd";
  const matches = fuzzySearch(text, query);
  let match_strs = matches.map((m) => {
    return text.slice(m.start, m.end + 1);
  });
  expect(match_strs).toStrictEqual(["wtd", "wnted", "wanted"]);
});

test("fuzzy search long", () => {
  const text =
    "t they are never selected during the search. Architecture Search.We compare our implementation of architecture search with other popular approache hgoe neural architecture search";
  const query = "neural architecture search";
  const matches = fuzzySearch(text, query);
  console.log(matches);
  let match_strs = matches.map((m) => {
    return text.slice(m.start, m.end + 1);
  });
  expect(match_strs).toStrictEqual([
    "neural architecture search",
    "ng the search. Architecture Search.We compare our implementation of architecture search",
  ]);
});

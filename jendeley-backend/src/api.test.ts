import { getTitleFromUrl } from "./api";
import { genRight } from "./either";

test("title from nodejs", async () => {
  const title = await getTitleFromUrl("https://nodejs.org/en/");
  expect(title).toStrictEqual(genRight("Node.js"));
});

test("title from python", async () => {
  const title = await getTitleFromUrl("https://www.python.org/");
  expect(title).toStrictEqual(genRight("Welcome to Python.org"));
});

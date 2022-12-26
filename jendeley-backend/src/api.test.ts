import { getTitleFromUrl } from "./api";

test("title from nodejs", async () => {
  const title = await getTitleFromUrl("https://nodejs.org/en/");
  expect(title).toBe("Node.js");
});

test("title from python", async () => {
  const title = await getTitleFromUrl("https://www.python.org/");
  expect(title).toBe("Welcome to Python.org");
});

import { get_title_from_url } from "./api";

test("title from nodejs", async () => {
  const title = await get_title_from_url("https://nodejs.org/en/");
  expect(title).toBe("Node.js");
});

test("title from python", async () => {
  const title = await get_title_from_url("https://www.python.org/");
  expect(title).toBe("Welcome to Python.org");
});

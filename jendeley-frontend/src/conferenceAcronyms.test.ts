import { getAcronyms } from "./conferenceAcronyms";

test("PLDI", () => {
  expect(
    getAcronyms(
      "PLDI '19: 40th ACM SIGPLAN Conference on Programming Language Design and Implementation"
    )
  ).toStrictEqual("PLDI19");
});

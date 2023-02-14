import { getAcronyms } from "./conferenceAcronyms";

test("PLDI long", () => {
  expect(
    getAcronyms(
      "PLDI '19: 40th ACM SIGPLAN Conference on Programming Language Design and Implementation"
    )
  ).toStrictEqual("PLDI19");
});

test("PLDI short", () => {
  expect(
    getAcronyms(
      "PLDI02: ACM SIGPLAN 2002 Conference on Programming Language Design and Implementation"
    )
  ).toStrictEqual("PLDI02");
});

test("CVPR", () => {
  expect(
    getAcronyms(
      "2019 IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)"
    )
  ).toStrictEqual("CVPR19");
});

test("CVPR long", () => {
  expect(
    getAcronyms(
      "2015 IEEE Conference on Computer Vision and Pattern Recognition (CVPR)"
    )
  ).toStrictEqual("CVPR15");
});

test("SC", () => {
  expect(
    getAcronyms(
      "SC '21: The International Conference for High Performance Computing, Networking, Storage and Analysis"
    )
  ).toStrictEqual("SC21");
});

test("CC", () => {
  expect(
    getAcronyms(
      "CC '22: 31st ACM SIGPLAN International Conference on Compiler Construction"
    )
  ).toStrictEqual("CC22");
});

test("INTERACT", () => {
  expect(
    getAcronyms(
      "2011 INTERACT-15: 15th Workshop on Interaction between Compilers and Computer Architectures"
    )
  ).toStrictEqual("INTERACT11");
});

test("POPL", () => {
  expect(
    getAcronyms(
      "POPL '17: The 44th Annual ACM SIGPLAN Symposium on Principles of Programming Languages"
    )
  ).toStrictEqual("POPL17");
});

test("ICFP", () => {
  expect(
    getAcronyms(
      "ICFP'16: ACM SIGPLAN International Conference on Functional Programming"
    )
  ).toStrictEqual("ICFP16");
});

test("CGO", () => {
  expect(
    getAcronyms(
      "CGO '16: 14th Annual IEEE/ACM International Symposium on Code Generation and Optimization"
    )
  ).toStrictEqual("CGO16");
});

test("SPLASH", () => {
  expect(
    getAcronyms(
      "SPLASH '16: Conference on Systems, Programming, Languages, and Applications: Software for Humanity"
    )
  ).toStrictEqual("SPLASH16");
});

test("TLDI", () => {
  expect(
    getAcronyms(
      "TLDI07: International Workshop on Types in Language Design and Implementation 2007"
    )
  ).toStrictEqual("TLDI07");
});

test("PEPM", () => {
  expect(
    getAcronyms("PEPM07: Partial Evaluation and Program Manipulation")
  ).toStrictEqual("PEPM07");
});

test("SOSP", () => {
  expect(
    getAcronyms(
      "SOSP '19: ACM SIGOPS 27th Symposium on Operating Systems Principles"
    )
  ).toStrictEqual("SOSP19");
});

test("CPP", () => {
  expect(getAcronyms("CPP '18: Certified Proofs and Programs")).toStrictEqual(
    "CPP18"
  );
});

test("ASPLOS", () => {
  expect(
    getAcronyms(
      "ASPLOS '19: Architectural Support for Programming Languages and Operating Systems"
    )
  ).toStrictEqual("ASPLOS19");
});

test("HASP", () => {
  expect(
    getAcronyms(
      "HASP '19: Workshop on Hardware and Architectural Support for Security and Privacy"
    )
  ).toStrictEqual("HASP19");
});

test("ISMM", () => {
  expect(
    getAcronyms(
      "ISMM '21: 2021 ACM SIGPLAN International Symposium on Memory Management"
    )
  ).toStrictEqual("ISMM21");
});

test("ICSE", () => {
  expect(
    getAcronyms(
      "2013 35th International Conference on Software Engineering (ICSE)"
    )
  ).toStrictEqual("ICSE13");
});

test("EuroSys", () => {
  expect(
    getAcronyms("EuroSys '15: Tenth EuroSys Conference 2015")
  ).toStrictEqual("EuroSys15");
});

test("LICS", () => {
  expect(
    getAcronyms(
      "2008 23rd Annual IEEE Symposium on Logic in Computer Science (LICS 2008)"
    )
  ).toStrictEqual("LICS08");
});

test("IROS", () => {
  expect(
    getAcronyms(
      "2015 IEEE/RSJ International Conference on Intelligent Robots and Systems (IROS)"
    )
  ).toStrictEqual("IROS15");
});

test("ICCV", () => {
  expect(
    getAcronyms(
      "2019 IEEE/CVF International Conference on Computer Vision (ICCV)"
    )
  ).toStrictEqual("ICCV19");
});

test("ICPP", () => {
  expect(
    getAcronyms(
      "ICPP 2019: 48th International Conference on Parallel Processing"
    )
  ).toStrictEqual("ICPP19");
});

test("CGO short", () => {
  expect(
    getAcronyms(
      "2017 IEEE/ACM International Symposium on Code Generation and Optimization (CGO)"
    )
  ).toStrictEqual("CGO17");
});

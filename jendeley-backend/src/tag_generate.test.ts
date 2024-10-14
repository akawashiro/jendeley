import { genTags } from "./tag_generate";
import { isRight } from "./either";
import {OLLAMA_SERVER} from "./constants";

const SAMPLE_TITLE = "JiuJITsu: Removing Gadgets with Safe Register Allocation for JIT Code Generation";
const SAMPLE_TEXT =
  "Code-reuse attacks have the capability to craft malicious instructions from small code fragments, commonly referred to as “gadgets.” These gadgets are generated by JIT (Just-In-Time) engines as integral components of native instructions, with the flexibility to be embedded in various fields, including Displacement. In this article, we introduce a novel approach for potential gadget insertion, achieved through the manipulation of ModR/M and SIB bytes via JavaScript code. This manipulation influences a JIT engine’s register allocation and code generation algorithms. These newly generated gadgets do not rely on constants and thus evade existing constant blinding schemes. Furthermore, they can be combined with 1-byte constants, a combination that proves to be challenging to defend against using conventional constant blinding techniques. To showcase the feasibility of our approach, we provide proof-of-concept (POC) code for three distinct types of gadgets. Our research underscores the potential for attackers to exploit ModR/M and SIB bytes within JIT-generated native instructions. In response, we propose a practical defense mechanism to mitigate such attacks. We introduce JiuJITsu, a security-enhanced register allocation scheme designed to prevent harmful register assignments during the JIT code generation phase, thereby thwarting the generation of these malicious gadgets. We conduct a comprehensive analysis of JiuJITsu’s effectiveness in defending against code-reuse attacks. Our findings demonstrate that it incurs a runtime overhead of under 1% when evaluated using JetStream2 benchmarks and real-world websites.";

test("Generate tags from text", async () => {
  const title = await genTags(OLLAMA_SERVER, SAMPLE_TITLE, SAMPLE_TEXT, ["JIT"]);
  const isTag = isRight(title);
  expect(isTag).toBe(true);
});

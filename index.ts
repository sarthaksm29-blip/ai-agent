import { ChatOllama } from "@langchain/ollama";
import { tool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import fs from "fs-extra"; // Corrected ESM import

// 1. Define Tools
const createFile = tool(
  async ({ fileName, content }) => {
    try {
      await fs.outputFile(fileName, content);
      return `SUCCESS: Created file "${fileName}".`;
    } catch (err: any) {
      return `ERROR: Could not create file: ${err.message}`;
    }
  },
  {
    name: "create_file",
    description: "Use this to create a new file with text content.",
    schema: z.object({
      fileName: z.string().describe("The name and extension of the file"),
      content: z.string().describe("The text content to put in the file"),
    }),
  },
);

const readFile = tool(
  async ({ fileName }) => {
    try {
      const data = await fs.readFile(fileName, "utf-8");
      return `FILE CONTENT:\n${data}`;
    } catch (err: any) {
      return `ERROR: File not found.`;
    }
  },
  {
    name: "read_file",
    description: "Use this to read the contents of an existing file.",
    schema: z.object({
      fileName: z.string().describe("The name of the file to read"),
    }),
  },
);

// 2. Initialize Model & Agent
const llm = new ChatOllama({
  model: "qwen3:4b", // Ensure you have pulled this: ollama pull qwen3:4b
  temperature: 0,
});

const tools = [createFile, readFile];

// We add a state modifier to help Qwen3 follow the ReAct pattern strictly
const agent = createAgent({
  llm,
  tools,
});

// 3. Run
async function main() {
  console.log("--- Agent is starting ---");
  const result = await agent.invoke({
    messages: [
      new HumanMessage(
        "Create a file called note.txt with the text 'Qwen is awesome' and then read it.",
      ),
    ],
  });

  // Get the last message which is the agent's final answer
  console.log("\nAgent Response:");
  console.log(result.messages[result.messages.length - 1].content);
}

main();
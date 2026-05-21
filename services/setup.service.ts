import { checkbox } from "@inquirer/prompts";
import { AGENT_CONFIG } from "../constants";
import { join } from "path";
import { readFile, appendFile, mkdir, readdir } from "fs/promises";
import { dirname } from "path";

const INSTRUCTION_PATH = join(import.meta.dir, "../INSTRUCTION.md");

const checkAgentInstalled = async (agentPath: string) => {
  try {
    const path = `${process.env.HOME}/${agentPath}`;
    await readdir(path);
    return true;
  } catch (e) {
    return false;
  }
};

export const setup = async () => {
  console.log("\n🔧 Agent Skills Manager — Setup\n");

  // 1. Detect which agents are installed
  const detected: { key: string; name: string; agentFile: string }[] = [];

  for (const [key, config] of Object.entries(AGENT_CONFIG)) {
    const installed = await checkAgentInstalled(config.path);
    if (installed) {
      detected.push({ key, name: config.name, agentFile: config.agentFile });
    }
  }

  if (detected.length === 0) {
    console.log("⚠️  No supported agents detected on this machine.");
    return;
  }

  console.log(`Detected agents: ${detected.map((d) => d.name).join(", ")}\n`);

  // 2. Ask user to confirm which agents to set up
  const selected = await checkbox({
    message: "Which agents would you like to set up?",
    choices: detected.map((d) => ({
      value: d.key,
      name: d.name,
      checked: true,
    })),
  });

  if (selected.length === 0) {
    console.log("\nNo agents selected. Setup cancelled.");
    return;
  }

  // 3. Read instruction content
  const instruction = await readFile(INSTRUCTION_PATH, "utf-8");

  // 4. For each selected agent, check if instruction already exists and append if not
  for (const key of selected) {
    const config = AGENT_CONFIG[key];
    if (!config) continue;
    const agentFilePath = `${process.env.HOME}/${config.agentFile}`;

    try {
      // Ensure directory exists
      await mkdir(dirname(agentFilePath), { recursive: true });

      // Read existing content (or empty if file doesn't exist)
      let existingContent = "";
      try {
        existingContent = await Bun.file(agentFilePath).text();
      } catch {
        // file doesn't exist yet
      }

      // Check if instruction is already present
      if (existingContent.includes(instruction.trim())) {
        console.log(`  ℹ ${config.name}: already configured, skipping.`);
        continue;
      }

      // Append instruction to end of file
      const separator = existingContent.length > 0 && !existingContent.endsWith("\n") ? "\n\n" : existingContent.length > 0 ? "\n" : "";
      await appendFile(agentFilePath, separator + instruction);
      console.log(`  ✓ ${config.name}: instructions written to ~/${config.agentFile}`);
    } catch (err) {
      console.error(`  ✗ ${config.name}: failed to write — ${err}`);
    }
  }

  console.log("\n✅ Setup complete!\n");
};

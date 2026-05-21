import { multiselect, intro, outro, log, isCancel } from "@clack/prompts";
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
  intro("Agent Skills Manager — Setup");

  const detected: { key: string; name: string; agentFile: string }[] = [];

  for (const [key, config] of Object.entries(AGENT_CONFIG)) {
    const installed = await checkAgentInstalled(config.path);
    if (installed) {
      detected.push({ key, name: config.name, agentFile: config.agentFile });
    }
  }

  if (detected.length === 0) {
    log.warning("No supported agents detected on this machine.");
    outro("Nothing to set up.");
    return;
  }

  log.info(`Detected agents: ${detected.map((d) => d.name).join(", ")}`);

  const selected = await multiselect({
    message: "Which agents would you like to set up? (space to select, enter to confirm)",
    options: detected.map((d) => ({
      value: d.key,
      label: d.name,
    })),
  });

  if (isCancel(selected)) {
    outro("Setup cancelled.");
    return;
  }

  if (selected.length === 0) {
    outro("No agents selected.");
    return;
  }

  const instruction = await readFile(INSTRUCTION_PATH, "utf-8");

  for (const key of selected) {
    const config = AGENT_CONFIG[key];
    if (!config) continue;
    const agentFilePath = `${process.env.HOME}/${config.agentFile}`;

    try {
      await mkdir(dirname(agentFilePath), { recursive: true });

      let existingContent = "";
      try {
        existingContent = await Bun.file(agentFilePath).text();
      } catch {
        // file doesn't exist yet
      }

      if (existingContent.includes(instruction.trim())) {
        log.info(`${config.name}: already configured, skipping.`);
        continue;
      }

      const separator = existingContent.length > 0 && !existingContent.endsWith("\n") ? "\n\n" : existingContent.length > 0 ? "\n" : "";
      await appendFile(agentFilePath, separator + instruction);
      log.success(`${config.name}: instructions written to ~/${config.agentFile}`);
    } catch (err) {
      log.error(`${config.name}: failed to write — ${err}`);
    }
  }

  outro("Setup complete!");
};

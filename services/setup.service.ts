import { multiselect, intro, outro, log, isCancel } from "@clack/prompts";
import { AGENT_CONFIG } from "../constants";
import { readFile, appendFile, mkdir, readdir } from "fs/promises";
import { dirname, join } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const INSTRUCTION_PATH = join(dirname(fileURLToPath(import.meta.url)), "../INSTRUCTION.md");

const checkAgentInstalled = async (agentPath: string) => {
  try {
    await readdir(join(homedir(), agentPath));
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
    const agentFilePath = join(homedir(), config.agentFile);

    try {
      await mkdir(dirname(agentFilePath), { recursive: true });

      let existingContent = "";
      try {
        existingContent = await readFile(agentFilePath, "utf-8");
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

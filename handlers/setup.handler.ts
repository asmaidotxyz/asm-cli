const agentFileLocation = {
  opencode: ".opencode/agent"
}

// use bun api to check if agent file is exit or not
const checkAgentFile = async (fileName: string) => {
  try {
    const path = `${process.env.HOME}/${fileName}`;
    await Bun.file(path).text();
    return true;
  } catch (e) {
    return false;
  }
}

export const setupHandler = async () => {
  for (const [source, path] of Object.entries(agentFileLocation)) {
    const exists = await checkAgentFile(path);
    if (!exists) {
      console.log(`Agent file not found at ${path} for source ${source}. Please create it before running the agent.`);
    } else {
      console.log(`Agent file found at ${path} for source ${source}.`);
    }
  }
}


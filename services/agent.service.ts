
// use bun api to check if agent file is exit or not
export const checkAgentInstalled = async (fileName: string) => {
  try {
    const path = `${process.env.HOME}/${fileName}`;
    await Bun.file(path).text();
    return true;
  } catch (e) {
    return false;
  }
}



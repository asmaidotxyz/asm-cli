import type { Skill } from "../types";
import { mkdir, rm, cp, readdir, readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";
import { spawn } from "child_process";

const SKILLS_DIR = ".agents/skills";
const SKIP_DIRS = ["node_modules", ".git", "dist", "build"];

const sanitizeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9._]+/g, "-").replace(/^[.\-]+|[.\-]+$/g, "") || "unnamed-skill";

const parseName = (content: string): string | null => {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const name = match[1]!.match(/^name:\s*(.+)$/m);
  return name ? name[1]!.trim().replace(/^["']|["']$/g, "") : null;
};

const findSkillFolder = async (dir: string, skillName: string): Promise<string | null> => {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "SKILL.md" && entry.isFile()) {
      const content = await readFile(join(dir, entry.name), "utf-8");
      const name = parseName(content);
      if (name?.toLowerCase() === skillName.toLowerCase()) return dir;
    }
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP_DIRS.includes(entry.name)) {
      const result = await findSkillFolder(join(dir, entry.name), skillName);
      if (result) return result;
    }
  }

  return null;
};

const runCommand = async (command: string, args: string[]) =>
  new Promise<number>((resolve) => {
    const proc = spawn(command, args, { stdio: "ignore" });

    proc.on("error", () => resolve(1));
    proc.on("close", (code) => resolve(code ?? 1));
  });

const isGitAvailable = async () => {
  return (await runCommand("git", ["--version"])) === 0;
};

const installViaGit = async (name: string, source: string, destDir: string) => {
  const tempDir = join(tmpdir(), `asm-${Date.now()}`);
  const repoUrl = `https://github.com/${source}.git`;

  try {
    if ((await runCommand("git", ["clone", "--depth", "1", repoUrl, tempDir])) !== 0) {
      throw new Error(`Failed to clone ${repoUrl}`);
    }

    const skillFolder = await findSkillFolder(tempDir, name);
    if (!skillFolder) throw new Error(`Skill "${name}" not found`);

    await rm(destDir, { recursive: true, force: true });
    await mkdir(destDir, { recursive: true });
    await cp(skillFolder, destDir, { recursive: true });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const installViaApi = async (name: string, source: string, destDir: string) => {
  const branches = ["main", "master"];
  let tree: { path: string; type: string }[] = [];
  let branch = "";

  for (const b of branches) {
    const url = `https://api.github.com/repos/${source}/git/trees/${b}?recursive=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "asm-cli" },
    });
    if (res.ok) {
      const data = (await res.json()) as { tree: { path: string; type: string }[] };
      tree = data.tree;
      branch = b;
      break;
    }
  }

  if (!branch) throw new Error(`Failed to fetch repo tree for ${source}`);

  // find SKILL.md that matches skill.name
  const skillMdPaths = tree
    .filter((e) => e.type === "blob" && e.path.toLowerCase().endsWith("skill.md"))
    .map((e) => e.path);

  let matchedDir: string | null = null;

  for (const mdPath of skillMdPaths) {
    const rawUrl = `https://raw.githubusercontent.com/${source}/${branch}/${mdPath}`;
    const res = await fetch(rawUrl);
    if (!res.ok) continue;

    const skillName = parseName(await res.text());
    if (skillName?.toLowerCase() === name.toLowerCase()) {
      const parts = mdPath.split("/");
      matchedDir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      break;
    }
  }

  if (matchedDir === null) throw new Error(`Skill "${name}" not found`);

  // fetch and write all files under matched dir
  const prefix = matchedDir ? `${matchedDir}/` : "";
  const files = tree.filter(
    (e) => e.type === "blob" && (matchedDir === "" ? true : e.path.startsWith(prefix))
  );

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  for (const file of files) {
    const res = await fetch(`https://raw.githubusercontent.com/${source}/${branch}/${file.path}`);
    if (!res.ok) continue;

    const relativePath = matchedDir ? file.path.slice(prefix.length) : file.path;
    const filePath = join(destDir, relativePath);
    const fileDir = dirname(filePath);

    if (fileDir !== destDir) await mkdir(fileDir, { recursive: true });
    await writeFile(filePath, await res.text(), "utf-8");
  }
};

export const installSkill = async (name: string, source: string) => {
  const destDir = join(process.cwd(), SKILLS_DIR, sanitizeName(name));

  if (await isGitAvailable()) {
    await installViaGit(name, source, destDir);
  } else {
    await installViaApi(name, source, destDir);
  }
};

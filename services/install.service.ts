import type { Skill } from "../types";
import { mkdir, rm, cp, readdir, readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { tmpdir } from "os";

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

const isGitAvailable = async () => {
  try {
    const proc = Bun.spawn(["git", "--version"], { stdout: "ignore", stderr: "ignore" });
    return (await proc.exited) === 0;
  } catch {
    return false;
  }
};

const installViaGit = async (skill: Skill, destDir: string) => {
  const tempDir = join(tmpdir(), `asm-${Date.now()}`);
  const repoUrl = `https://github.com/${skill.source}.git`;

  try {
    const proc = Bun.spawn(["git", "clone", "--depth", "1", repoUrl, tempDir], {
      stdout: "ignore",
      stderr: "ignore",
    });
    if ((await proc.exited) !== 0) throw new Error(`Failed to clone ${repoUrl}`);

    const skillFolder = await findSkillFolder(tempDir, skill.name);
    if (!skillFolder) throw new Error(`Skill "${skill.name}" not found`);

    await rm(destDir, { recursive: true, force: true });
    await mkdir(destDir, { recursive: true });
    await cp(skillFolder, destDir, { recursive: true });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

const installViaApi = async (skill: Skill, destDir: string) => {
  const branches = ["main", "master"];
  let tree: { path: string; type: string }[] = [];
  let branch = "";

  for (const b of branches) {
    const url = `https://api.github.com/repos/${skill.source}/git/trees/${b}?recursive=1`;
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

  if (!branch) throw new Error(`Failed to fetch repo tree for ${skill.source}`);

  // find SKILL.md that matches skill.name
  const skillMdPaths = tree
    .filter((e) => e.type === "blob" && e.path.toLowerCase().endsWith("skill.md"))
    .map((e) => e.path);

  let matchedDir: string | null = null;

  for (const mdPath of skillMdPaths) {
    const rawUrl = `https://raw.githubusercontent.com/${skill.source}/${branch}/${mdPath}`;
    const res = await fetch(rawUrl);
    if (!res.ok) continue;

    const name = parseName(await res.text());
    if (name?.toLowerCase() === skill.name.toLowerCase()) {
      const parts = mdPath.split("/");
      matchedDir = parts.length > 1 ? parts.slice(0, -1).join("/") : "";
      break;
    }
  }

  if (matchedDir === null) throw new Error(`Skill "${skill.name}" not found`);

  // fetch and write all files under matched dir
  const prefix = matchedDir ? `${matchedDir}/` : "";
  const files = tree.filter(
    (e) => e.type === "blob" && (matchedDir === "" ? true : e.path.startsWith(prefix))
  );

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  for (const file of files) {
    const res = await fetch(`https://raw.githubusercontent.com/${skill.source}/${branch}/${file.path}`);
    if (!res.ok) continue;

    const relativePath = matchedDir ? file.path.slice(prefix.length) : file.path;
    const filePath = join(destDir, relativePath);
    const fileDir = dirname(filePath);

    if (fileDir !== destDir) await mkdir(fileDir, { recursive: true });
    await writeFile(filePath, await res.text(), "utf-8");
  }
};

export const installSkill = async (skill: Skill) => {
  const destDir = join(process.cwd(), SKILLS_DIR, sanitizeName(skill.name));

  if (await isGitAvailable()) {
    await installViaGit(skill, destDir);
  } else {
    await installViaApi(skill, destDir);
  }
};

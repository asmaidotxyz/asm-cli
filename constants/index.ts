export const VERSION = "0.1.0";
export const API_ENDPOINT = process.env.ASM_API_ENDPOINT || "https://asmai.xyz/api";

export const AGENT_CONFIG: Record<string, { name: string; path: string; agentFile: string }> = {
  opencode: {
    name: "OpenCode",
    path: ".opencode",
    agentFile: ".opencode/AGENTS.md"
  },
  "claude-code": {
    name: "Claude Code",
    path: ".claude",
    agentFile: ".claude/CLAUDE.md"
  },
  cursor: {
    name: "Cursor",
    path: ".cursor",
    agentFile: ".cursor/rules/asm.mdc"
  },
  codex: {
    name: "Codex",
    path: ".codex",
    agentFile: ".codex/AGENTS.md"
  },
  copilot: {
    name: "GitHub Copilot",
    path: ".config/github-copilot",
    agentFile: ".config/github-copilot/instructions.md"
  }
}

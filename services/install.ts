import type { Skill } from "../types";

export const installSkill = async (skill: Skill) => {
  console.log(`Installing skill: ${skill.name} from source: ${skill.source}`);
}


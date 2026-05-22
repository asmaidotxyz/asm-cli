import { installSkill } from "../services"

export const installHandler = async (name: string, source: string) => {
  try {
    await installSkill(name, source);
    console.log(`Skill "${name}" installed successfully from ${source}, you can now call skill tool with "${name}" as the tool name to use it in your task.`);
  } catch (error) {
    console.error(`Failed to install skill "${name}" from ${source}, try finish task with your own knowledge or search for another skill`);
  }
}

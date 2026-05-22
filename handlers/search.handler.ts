import axios from "axios";
import { API_ENDPOINT } from "../constants"
import type { Skill } from "../types";

const logSkills = (skills: Skill[]) => {
  if (skills.length === 0) {
    console.log("No skills found matching your query.");
    return;
  }

  console.log(`Found ${skills.length} skill(s):`);
  skills.forEach((skill, _) => {
    console.log(`Name: ${skill.name}`);
    console.log(`Source: ${skill.source}`);
    console.log(`Description: ${skill.description}`);
    console.log("-----------------------------");
  });
}

export const searchHandler = async (args: string) => {
  try {
    const res = await axios.get(`${API_ENDPOINT}/api/search`, {
      params: {
        query: args
      }
    });
    const skills: Skill[] = res.data.data;

    logSkills(skills);
  } catch (error) {
    console.error("Error searching for skills:", error);
    console.log("Skill not found, try finish task with your own knowledge or search for another skill");
  }
}

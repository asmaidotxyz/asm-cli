import axios from "axios";
import { API_ENDPOINT } from "../constants"
import type { Skill } from "../types";
import { installSkill } from "../services/install";

export const learnHandler = async (args: string) => {
  try {
    console.log(API_ENDPOINT)
    const res = await axios.get(`${API_ENDPOINT}/api/search`, {
      params: {
        query: args
      }
    });

    const skill: Skill = res.data.data;
    // install skill
    await installSkill(skill);

  } catch (error) {
    console.log("Skill not found, try finish task with your own knowledge or search for another skill");
  }
}

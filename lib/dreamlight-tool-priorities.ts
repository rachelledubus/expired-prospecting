/** Base-game Royal Tool upgrade objectives, prioritized by access and obstacle-clearing utility.
 * Each item uses its *existing* quest checkbox, shared with the character or realm trackers.
 * Exclusive DLC tools (Hourglass, Net) are not included.
 * Source: https://dreamlightvalleywiki.com/Obstacles (October 2026).
 */
import { questKey } from "./games-data";
import { dreamlightCharacterKey } from "./dreamlight-character-quests";

export type DreamlightTool = "Pickaxe" | "Shovel" | "Watering Can";
export type DreamlightUpgrade = {
 id: string;
 tool: DreamlightTool;
 clears: string;
 quest: string;
 character: string;
 characterId: string;
 requirement: string;
 instruction: string;
 dependsOn?: string[];
 source: string;
 material?: { item: string; qty: number }[];
 stage?: { id: string; stepId: string };
 questId?: string;
};

export const DREAMLIGHT_TOOL_UPGRADES: DreamlightUpgrade[] = [
 {
  id: "small-coral", tool: "Pickaxe", clears: "Small sea debris on Dazzle Beach",
  quest: "The Great Maui", character: "Maui", characterId: "maui",
  requirement: "Open Moana's realm in the Dream Castle and talk to Maui there; he can teach you this before moving to the Valley.",
  instruction: "Complete The Great Maui in the Moana realm to permanently break small sea debris with the Pickaxe.",
  stage: { id: "realm-moana", stepId: "q3" },
  source: "https://dreamlightvalleywiki.com/The_Great_Maui",
 },
 {
  id: "stumps", tool: "Shovel", clears: "Tree stumps in the Forest of Valor",
  quest: "An Icy Invitation", character: "Anna", characterId: "anna",
  requirement: "Welcome Anna from the Frozen realm, reach friendship level 2, and open the Forest of Valor.",
  instruction: "Complete An Icy Invitation with Anna, craft the Shovel Blade, and use it on tree stumps. This quest also helps you bring Elsa to the Valley.",
  questId: "an-icy-invitation",
  source: "https://dreamlightvalleywiki.com/An_Icy_Invitation",
 },
 {
  id: "small-mushrooms", tool: "Watering Can", clears: "Small mushroom patches",
  quest: "A Dark Experiment", character: "Merlin", characterId: "merlin",
  requirement: "Reach friendship level 8 with Merlin and open the Glade of Trust.",
  instruction: "Bring Merlin the quest ingredients, then water three small mushroom patches to test the permanent enchantment.",
  questId: "a-dark-experiment",
  material: [{ item: "Mushroom", qty: 10 }, { item: "Emerald", qty: 5 }, { item: "Purified Night Shard", qty: 3 }],
  source: "https://dreamlightvalleywiki.com/A_Dark_Experiment",
 },
 {
  id: "large-coral", tool: "Pickaxe", clears: "Large sea debris on Dazzle Beach",
  quest: "A Tale of Stone and Fire", character: "Maui", characterId: "maui",
  requirement: "Welcome Maui to the Valley and reach friendship level 4.",
  instruction: "Help Maui in A Tale of Stone and Fire to upgrade the Pickaxe for large sea debris.",
  questId: "a-tale-of-stone-and-fire", dependsOn: ["small-coral"],
  source: "https://dreamlightvalleywiki.com/A_Tale_of_Stone_and_Fire",
 },
 {
  id: "small-ice", tool: "Pickaxe", clears: "Small ice blocks",
  quest: "Breaking the Ice", character: "Elsa", characterId: "elsa",
  requirement: "Complete Anna's An Icy Invitation, welcome Elsa from the Frozen realm, then speak to Elsa near her ice cavern.",
  instruction: "Complete Elsa's Breaking the Ice quest and use the Warmth of Summer Potion on the Pickaxe.",
  questId: "breaking-the-ice", dependsOn: ["stumps"],
  source: "https://dreamlightvalleywiki.com/Breaking_the_Ice",
 },
 {
  id: "large-mushrooms", tool: "Watering Can", clears: "Large mushroom patches",
  quest: "The Final Trial", character: "Merlin", characterId: "merlin",
  requirement: "Reach Merlin friendship level 10, unlock WALL-E, and first complete A Dark Experiment.",
  instruction: "Craft five Purified Night Shards, have WALL-E crush them, then find Falling Water at the Glade of Trust waterfall and grow an Ice Heart from the Ice Tear Seed Merlin gives you.",
  questId: "the-final-trial", dependsOn: ["small-mushrooms"],
  material: [{ item: "Purified Night Shard", qty: 5 }, { item: "Mushroom", qty: 15 }, { item: "Falling Water", qty: 1 }, { item: "Ice Heart", qty: 1 }],
  source: "https://dreamlightvalleywiki.com/The_Final_Trial",
 },
 {
  id: "small-bones", tool: "Shovel", clears: "Small wildebeest bones in Sunlit Plateau",
  quest: "Breaking Bones", character: "Scar", characterId: "scar",
  requirement: "Unlock Scar by progressing the Sunlit Plateau story, then reach Scar friendship level 4.",
  instruction: "Complete Breaking Bones and craft the Lion's Claw Shovel Head to clear small bones for Clay.",
  questId: "breaking-bones",
  material: [{ item: "Lion's Claw", qty: 5 }, { item: "Dry Wood", qty: 5 }, { item: "Iron Ingot", qty: 5 }],
  source: "https://dreamlightvalleywiki.com/Breaking_Bones",
 },
 {
  id: "large-ice", tool: "Pickaxe", clears: "Huge ice blocks in Frosted Heights",
  quest: "The Singing Ice", character: "Elsa", characterId: "elsa",
  requirement: "Reach Elsa friendship level 6, unlock Frosted Heights, and finish Breaking the Ice.",
  instruction: "Complete The Singing Ice and apply the Cold of Winter Potion to break the larger ice barriers.",
  questId: "the-singing-ice", dependsOn: ["small-ice"],
  source: "https://dreamlightvalleywiki.com/The_Singing_Ice",
 },
 {
  id: "large-bones", tool: "Shovel", clears: "Large wildebeest bones in Sunlit Plateau",
  quest: "The Circle of Life", character: "Scar", characterId: "scar",
  requirement: "Reach Scar friendship level 7 and finish Breaking Bones.",
  instruction: "Complete The Circle of Life with Scar to clear large bones, giving you more Clay.",
  questId: "the-circle-of-life", dependsOn: ["small-bones"],
  source: "https://dreamlightvalleywiki.com/The_Circle_of_Life",
 },
 {
  id: "green-fire", tool: "Watering Can", clears: "Green fire in Forgotten Lands",
  quest: "Fire Alarm", character: "The Fairy Godmother", characterId: "the-fairy-godmother",
  requirement: "Unlock the Fairy Godmother in Forgotten Lands, then reach friendship level 2.",
  instruction: "Craft the Icy Enchantment during Fire Alarm and apply it to the Watering Can to put out green fires.",
  questId: "fire-alarm",
  material: [{ item: "Tourmaline", qty: 3 }, { item: "Snowball", qty: 15 }, { item: "Dream Shard", qty: 5 }, { item: "Purple Impatiens", qty: 5 }, { item: "Empty Vial", qty: 1 }],
  source: "https://dreamlightvalleywiki.com/Fire_Alarm",
 },
];

export function dreamlightToolUpgradeKey(gameId: string, task: DreamlightUpgrade): string {
 if (task.stage) return questKey(gameId, "dreamlight-" + task.stage.id, task.stage.stepId);
 return dreamlightCharacterKey(gameId, task.characterId, task.questId!);
}

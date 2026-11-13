/**
 * Human-checked item IDs and vendor categories from Wowhead's WoW Forever pages.
 * Reviewed 2026-11-13. These are links to item records, NOT confirmation that a
 * historical Classic loot-table entry is currently dropping on the Forever server.
 * Never synthesize a numeric item ID for an unmapped name.
 */
const known: Record<string,number> = {
  "Moss Agate":1206,
  "Pristine Leather":249427,"Pristine Hide":249428,
  "Light Leather":2318,"Medium Leather":2319,"Heavy Leather":4234,
  "Thick Leather":4304,"Rugged Leather":8170,
  "Light Hide":783,"Medium Hide":4232,"Heavy Hide":4235,"Thick Hide":8169,"Rugged Hide":8171,
  "Deviate Scale":6470,"Perfect Deviate Scale":6471,
  "Linen Cloth":2589,"Wool Cloth":2592,"Silk Cloth":4306,
  "Mageweave Cloth":4338,"Runecloth":14047,
  "Coarse Thread":2320,"Fine Thread":2321,"Silken Thread":4291,
  "Heavy Silken Thread":8343,"Rune Thread":14341,
  "Salt":4289,"Hot Spices":2692,"Soothing Spices":3713,"Mild Spices":2678,
  "Blue Dye":6260,"Black Dye":2325,"Gray Dye":4340,"Orange Dye":6261,
  "Refreshing Spring Water":159,
  "Spider's Silk":3182,"Ironweb Spider Silk":14227,
  "Small Lustrous Pearl":5498,"Iridescent Pearl":5500,
  "Elemental Earth":7067,"Elemental Air":7069,"Elemental Water":7070,
  "Deeprock Salt":8150,
  "Jade":1529,"Shadowgem":1210,"Lesser Moonstone":1705,
  "Raptor Flesh":12184,"Raptor Egg":3685
};
export const WOWHEAD_FOREVER_ITEM_IDS: Readonly<Record<string,number>> = known;
export const wowheadForeverItemUrl = (name:string): string | null => {
  const entry=Object.entries(known).find(([label])=>label.toLowerCase()===name.trim().toLowerCase());
  if(!entry)return null;
  const slug=entry[0].toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  return "https://www.wowhead.com/forever/item="+entry[1]+"/"+slug;
};

/**
 * Vendor *zones* printed on these Wowhead Forever item pages.
 * They do not certify the vendor NPC, distance, stock, or route.
 */
export const WOWHEAD_FOREVER_HORDE_VENDOR_ITEMS = [
 "Coarse Thread","Fine Thread","Silken Thread","Heavy Silken Thread","Rune Thread",
 "Mild Spices","Hot Spices","Soothing Spices","Salt",
 "Blue Dye","Gray Dye","Black Dye","Orange Dye","Refreshing Spring Water"
] as const;

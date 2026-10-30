export type CleanItem = { id: string; text: string };
export type CleanArea = { id: string; name: string; icon: string; time: string; description: string; items: CleanItem[] };

export const CLEAN_DATE = "2026-10-30";
export const CLEAN_AREAS: CleanArea[] = [
  { id: "prep", name: "Set up", icon: "🧺", time: "9:00–9:25 AM", description: "Get everything together before starting. Don't begin organizing drawers.", items: [
    { id: "prep-supplies", text: "Collect cleaners, cloths, vacuum, mop, gloves and trash bags" },
    { id: "prep-beds", text: "Strip beds and start a load of bedding or towels" },
    { id: "prep-clutter", text: "Return loose items to their rooms; don't sort or reorganize" },
    { id: "prep-pets", text: "Move dog beds, toys and bowls out of cleaning areas" },
    { id: "prep-air", text: "Set out fresh linens and ventilate while using cleaners" }
  ] },
  { id: "kitchen", name: "Kitchen", icon: "🍋", time: "9:25–10:45 AM", description: "Start with food and appliances; finish by shining the sink.", items: [
    { id: "k-fridge", text: "Toss expired food; wipe refrigerator shelves, drawers and handles" },
    { id: "k-micro", text: "Clean the microwave inside and outside" },
    { id: "k-stove", text: "Clean the stovetop, backsplash and accessible oven surfaces" },
    { id: "k-cabinets", text: "Wipe cabinet fronts, handles and appliance exteriors" },
    { id: "k-counters", text: "Clear and thoroughly wipe counters and backsplash" },
    { id: "k-sink", text: "Scrub sink, faucet and drain area" },
    { id: "k-trash", text: "Empty trash; clean the bin and replace its liner" }
  ] },
  { id: "bath", name: "Bathroom(s)", icon: "🫧", time: "11:00 AM–12:00 PM", description: "Clean all bathrooms during this block; finish floors later with the whole home.", items: [
    { id: "b-dwell", text: "Apply bathroom cleaners and follow their label dwell times" },
    { id: "b-shower", text: "Scrub showers or tubs, tiles and accessible grout" },
    { id: "b-toilet", text: "Clean and disinfect each toilet, including base and exterior" },
    { id: "b-sinks", text: "Scrub sinks, counters and faucets" },
    { id: "b-mirror", text: "Wipe mirrors, shelves, cabinet fronts and fixtures" },
    { id: "b-drains", text: "Remove hair from accessible drain covers and gather bath mats" },
    { id: "b-finish", text: "Empty bathroom bins and replace towels" }
  ] },
  { id: "bedrooms", name: "Both bedrooms", icon: "🛏️", time: "12:30–1:30 PM", description: "Dust and reset both rooms without turning closets into a separate project.", items: [
    { id: "be-dust", text: "Dust bedroom furniture, shelves and lamps" },
    { id: "be-dressers", text: "Wipe dresser tops, nightstands and handles" },
    { id: "be-mirrors", text: "Clean bedroom mirrors and accessible window sills" },
    { id: "be-under", text: "Clear and wipe accessible areas underneath beds" },
    { id: "be-closets", text: "Tidy closet floors and put stray clothes away" },
    { id: "be-linens", text: "Make both beds with clean linens" }
  ] },
  { id: "living", name: "Living + dining", icon: "🛋️", time: "1:45–2:35 PM", description: "Give extra attention to dog hair, soft furnishings and pet areas.", items: [
    { id: "l-dust", text: "Dust TV stand, tables, shelves and electronics safely" },
    { id: "l-sofa", text: "Lift sofa cushions and vacuum upholstery" },
    { id: "l-fur", text: "Remove pet hair from blankets and other soft furnishings" },
    { id: "l-dining", text: "Wipe dining table, chairs and high-touch surfaces" },
    { id: "l-entry", text: "Tidy entryway and wipe underneath movable furniture" },
    { id: "l-dogs", text: "Wash or refresh dog blankets; clean food and water bowls" }
  ] },
  { id: "details", name: "Whole-home details", icon: "✨", time: "2:35–3:20 PM", description: "Work from high surfaces down; don't worry about hard-to-reach perfection.", items: [
    { id: "d-fans", text: "Dust reachable ceiling fans and vent covers" },
    { id: "d-blinds", text: "Dust blinds and window ledges" },
    { id: "d-doors", text: "Wipe smudges from doors, handles and switches" },
    { id: "d-baseboards", text: "Clean visible baseboards, especially high-traffic areas" },
    { id: "d-corners", text: "Remove reachable cobwebs and dust from corners" }
  ] },
  { id: "floors", name: "Floors + finish", icon: "🧹", time: "3:20–5:00 PM", description: "Save vacuuming and mopping for last. Stop starting new jobs at 4:30 PM.", items: [
    { id: "f-bedroom", text: "Vacuum both bedrooms, corners and edges" },
    { id: "f-living", text: "Vacuum living and dining spaces, including under movable furniture" },
    { id: "f-kitchen", text: "Vacuum kitchen, bathrooms and entryway" },
    { id: "f-mop", text: "Mop hard floors with a floor-safe product" },
    { id: "f-dry", text: "Let floors dry before letting dogs back into the areas" },
    { id: "f-trash", text: "Empty vacuum and take out trash and recycling" },
    { id: "f-last", text: "Finish laundry, put away supplies and reset each room" }
  ] },
];

export const ALL_CLEAN_IDS = new Set(CLEAN_AREAS.flatMap(area => area.items.map(item => item.id)));
export const CLEAN_TOTAL = ALL_CLEAN_IDS.size;
export const CLEAN_BREAKS = [
  { time: "10:45–11:00 AM", label: "Water + sit-down break" },
  { time: "12:00–12:30 PM", label: "Lunch + switch laundry" },
  { time: "1:30–1:45 PM", label: "Real break before living spaces" },
];

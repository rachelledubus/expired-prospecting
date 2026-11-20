"use client";
import type { GameProgress } from "@/lib/games-data";
type Props={gameId:string;prog:GameProgress;setCheck:(key:string,value:boolean)=>void;setField:(key:string,value:string)=>void};
export default function WoWForeverVerifiedProfessions(_:Props){
  return <section className="gm-card" style={{padding:16}}>
    <h3>Wowhead Forever verified profession routes</h3>
    <p>This tab is using WoW Forever sources exclusively.</p>
    <p><a href="https://www.wowhead.com/forever/profession-leveling-guides/leatherworking">Leatherworking skill-ups</a></p>
    <p><a href="https://www.wowhead.com/forever/guide/professions/first-aid/overview">First Aid books and skills</a></p>
    <p><a href="https://www.wowhead.com/forever/guide/professions/cooking/overview-leveling">Cooking recipes and vendors</a></p>
  </section>;
}

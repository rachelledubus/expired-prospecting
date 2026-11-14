/** Manual, session-based net-gold metrics shared across WoW Forever pages.
 * Never assumes sale prices, completed auctions or drop chances. */
export type GoldSession={gold:number;minutes:number;expenses:number};
export type GoldMetrics={runs:number;totalGold:number;expenses:number;minutes:number;netGold:number;netPerHour:number};
const parse=(v:string|undefined):number|null=>{
  if(v===undefined||v.trim()==="")return null;
  const n=Number(v);
  return Number.isFinite(n)&&n>=0?n:null;
};
export function measureFarm(
  read:(suffix:string)=>string|undefined,
  farmId:string
):GoldMetrics|null {
  const base="farm-"+farmId+"-";
  const sessions:GoldSession[]=[];
  for(const n of [1,2,3]){
    const gold=parse(read(base+"run-"+n+"-gold"));
    const minutes=parse(read(base+"run-"+n+"-minutes"));
    const expenses=parse(read(base+"run-"+n+"-expenses"))??0;
    if(gold!==null&&minutes!==null&&minutes>0){
      sessions.push({gold,minutes,expenses});
    }
  }
  // Backward compatibility: previous portal stored one gross-income session.
  if(sessions.length===0){
    const gold=parse(read(base+"gold"));
    const minutes=parse(read(base+"minutes"));
    if(gold===null||minutes===null||minutes<=0)return null;
    sessions.push({gold,minutes,expenses:0});
  }
  const totalGold=sessions.reduce((n,x)=>n+x.gold,0);
  const expenses=sessions.reduce((n,x)=>n+x.expenses,0);
  const minutes=sessions.reduce((n,x)=>n+x.minutes,0);
  const netGold=totalGold-expenses;
  return {runs:sessions.length,totalGold,expenses,minutes,netGold,
    netPerHour:minutes>0?60*netGold/minutes:0};
}

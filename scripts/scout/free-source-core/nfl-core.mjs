// ATLAS free-first schedule-only adapter. Pure, portable, no network or database side effects.
// Source: nflverse/nfldata (CC BY 4.0), https://github.com/nflverse/nfldata
export const SOURCE_URL = 'https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv';
const REQUIRED = ['game_id','season','game_type','week','gameday','gametime','away_team','home_team'];
const TEAM = /^[A-Z]{2,3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function parseCsv(csv, maxRows=14000) {
  if (typeof csv !== 'string' || !csv || csv.length > 5_000_000) throw Error('CSV_SIZE_INVALID');
  const rows=[]; let cur=[],value='',quoted=false;
  for (let i=0;i<csv.length;i++) {
    const c=csv[i];
    if (quoted) {
      if(c==='"' && csv[i+1]==='"') {value+='"';i++;}
      else if(c==='"') quoted=false;
      else value+=c;
    } else if(c==='"') {
      if(value!=='') throw Error('CSV_UNEXPECTED_QUOTE');
      quoted=true;
    } else if(c===',') {cur.push(value);value='';}
    else if(c==='\n') {cur.push(value.endsWith('\r')?value.slice(0,-1):value); value=''; if(cur.some(x=>x!==''))rows.push(cur);cur=[];if(rows.length>maxRows+1)throw Error('CSV_ROW_LIMIT');}
    else if(c==='\r') { if(csv[i+1]!=='\n') throw Error('CSV_CR_INVALID'); }
    else value+=c;
  }
  if(quoted) throw Error('CSV_UNTERMINATED_QUOTE');
  if(cur.length||value){cur.push(value);rows.push(cur);}
  if(rows.length<2) throw Error('CSV_EMPTY');
  const cols=rows[0].map(x=>x.trim().replace(/^\uFEFF/,''));
  if(cols.length>90||new Set(cols).size!==cols.length || REQUIRED.some(c=>!cols.includes(c)))throw Error('CSV_SCHEMA_INVALID');
  for(let i=1;i<rows.length;i++)if(rows[i].length!==cols.length)throw Error('CSV_COLUMN_MISMATCH:'+i);
  return rows.slice(1).map(row=>Object.fromEntries(cols.map((key,i)=>[key,row[i]])));
}

export function easternKickoffUtc(day, time) {
  if(!DATE.test(day)||!TIME.test(time))throw Error('KICKOFF_FORMAT_INVALID');
  const localMs=Date.parse(day+'T'+time+':00Z');
  if(!Number.isFinite(localMs)||new Date(localMs).toISOString().slice(0,10)!==day)throw Error('KICKOFF_DATE_INVALID');
  const formatOffset=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',timeZoneName:'shortOffset'});
  const offsetStr=formatOffset.formatToParts(new Date(localMs+5*3600*1000)).find(x=>x.type==='timeZoneName')?.value;
  const m=/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offsetStr||'');
  if(!m)throw Error('TIMEZONE_OFFSET_UNKNOWN');
  const offset=(m[1]==='-'?-1:1)*(Number(m[2])*60+Number(m[3]||0));
  const utc=new Date(localMs-offset*60_000);
  // Verify roundtrip: DST ambiguities or shifted times are quarantined, not guessed.
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(utc);
  const ob=Object.fromEntries(parts.map(p=>[p.type,p.value]));
  if(`${ob.year}-${ob.month}-${ob.day}T${ob.hour}:${ob.minute}`!==`${day}T${time}`)throw Error('KICKOFF_TIMEZONE_ROUNDTRIP_FAIL');
  return utc.toISOString();
}

export function normalizeSchedule(csv, {season,week,retrievedAt}={}) {
  if(!Number.isInteger(season)||season<1999||season>2100||!Number.isInteger(week)||week<1||week>18)throw Error('INVALID_SCOPE');
  const now=new Date(retrievedAt||new Date());
  if(!Number.isFinite(now.valueOf()) || !String(retrievedAt||now.toISOString()).match(/(?:Z|[+-]\d\d:\d\d)$/))throw Error('INVALID_OBSERVED_AT');
  if(now.getTime()>Date.now()+60_000)throw Error('FUTURE_OBSERVED_AT');
  const data=parseCsv(csv);
  let selected=data.filter(r=>r.season===String(season)&&r.week===String(week)&&r.game_type==='REG');
  if(selected.length===0||selected.length>18)throw Error('NO_OR_TOO_MANY_WEEK_GAMES');
  const ids=new Set(),matchups=new Set();
  const records=[];
  for(const r of selected){
    const {game_id,away_team,home_team,gameday,gametime}=r;
    const expected=`${season}_${String(week).padStart(2,'0')}_${away_team}_${home_team}`;
    if(!TEAM.test(away_team)||!TEAM.test(home_team)||away_team===home_team||game_id!==expected)throw Error('GAME_IDENTITY_INVALID');
    const kickoff=easternKickoffUtc(gameday,gametime);
    if(ids.has(game_id)||matchups.has(`${away_team}:${home_team}:${kickoff}`))throw Error('DUPLICATE_GAME');
    if(new Date(kickoff).getUTCFullYear()<season||new Date(kickoff).getUTCFullYear()>season+1)throw Error('KICKOFF_OUT_OF_SEASON');
    ids.add(game_id);matchups.add(`${away_team}:${home_team}:${kickoff}`);
    records.push({
      game_id,season,week,away_team,home_team,start_at_utc:kickoff,
      provider_local_kickoff:`${gameday}T${gametime}:00`,provider_timezone:'America/New_York',
      source:'nflverse/nfldata',source_url:SOURCE_URL,observed_at:now.toISOString(),source_published_at:null,
      source_freshness_proven:false,historical_pit_verified:false,independent_schedule_verified:false,
      truth_label:'SCOUT_REFERENCE_ONLY',verification_state:'UNVERIFIED',executable_price_verified:false,
      sportsbook_offer:null,model_probability:null,production_authority:false,human_final_gate_authority:false,
    });
  }
  return records.sort((a,b)=>a.start_at_utc.localeCompare(b.start_at_utc)||a.game_id.localeCompare(b.game_id));
}
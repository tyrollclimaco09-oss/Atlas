#!/usr/bin/env python3
"""ATLAS Week 7 prospective NFL QB attempts SHADOW packet, strictly pre-kickoff."""
import csv,gzip,hashlib,io,json,os,sys,urllib.request
from collections import defaultdict
from datetime import datetime,timezone,timedelta
from statistics import mean

URL_PBP="https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz"
URL_SCHED="https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=7&dates=2026"
SCOPE_WEEK=7
MIN_LEAD_SECONDS=1800
MAX_BYTES={URL_PBP:9_000_000,URL_SCHED:2_500_000}
def reject(ok,reason):
    if not ok:raise ValueError(reason)
def url_read(url):
    reject(url in MAX_BYTES,"UNKNOWN_SOURCE_URL")
    request=urllib.request.Request(url,headers={"User-Agent":"ATLAS-PREGAME-W7-FORECAST-SHADOW/1","Accept":"application/json,application/octet-stream"})
    with urllib.request.urlopen(request,timeout=24) as response:
        body=response.read(MAX_BYTES[url]+1)
        reject(response.status==200,"UPSTREAM_NOT_200")
    reject(0<len(body)<=MAX_BYTES[url],"UPSTREAM_SIZE_LIMIT")
    return body,hashlib.sha256(body).hexdigest()
def clock_utc(s):
    s=str(s).replace("Z","+00:00")
    t=datetime.fromisoformat(s)
    reject(t.tzinfo is not None,"SOURCE_GAME_MISSING_TZ")
    return t.astimezone(timezone.utc)
def get_games(schedule):
    events=schedule.get("events")
    reject(isinstance(events,list) and 12<=len(events)<=16,"EXPECTED_WEEK7_COMPLETE_EVENT_CENSUS")
    out=[];seen=set();teams=set()
    for e in events:
        comp=(e.get("competitions") or [{}])[0]
        sides=comp.get("competitors") or []
        reject(len(sides)==2,"SCHEDULE_TEAM_COUNT")
        t={x.get("homeAway"):x.get("team",{}).get("abbreviation") for x in sides}
        reject(t.keys()=={"home","away"} and all(t.values()),"GAME_TEAM_IDENTITY")
        d=clock_utc(e.get("date") or comp.get("date"))
        ident=str(e.get("id") or "")
        reject(ident.isdigit() and ident not in seen,"GAME_ID_UNIQUE")
        seen.add(ident)
        for v in t.values():reject(v not in teams,"DUPLICATE_WEEK7_TEAM:"+str(v));teams.add(v)
        out.append({"event_id":ident,"home":t["home"],"away":t["away"],"kickoff_utc":d.isoformat(),
          "status":e.get("status",{}).get("type",{}).get("state","UNKNOWN")})
    return sorted(out,key=lambda x:(x["kickoff_utc"],x["event_id"]))
def history_from_pbp(rows):
    per_game=defaultdict(int);names={};byteam=defaultdict(list)
    for r in rows:
        if str(r.get("season")) not in ("2026","2026.0"):continue
        try:week=int(float(r.get("week","")))
        except (ValueError,TypeError):continue
        if not 1<=week<7:continue
        if r.get("play_type")=="no_play":continue
        if str(r.get("pass_attempt")) not in ("1","1.0"):continue
        team=r.get("posteam");player=str(r.get("passer_player_id") or "").strip()
        name=str(r.get("passer_player_name") or "").strip()
        game=r.get("game_id") or ""
        if not team or not player or player=="NA" or not game:continue
        key=(team,player,week,game)
        per_game[key]+=1;names[key]=name
    for (team,player,week,game),n in per_game.items():
        byteam[team].append({"player_id":player,"player_name":names[(team,player,week,game)],"week":week,
          "game_id":game,"pass_attempts":n})
    return byteam
def select_team(team,history):
    games=history.get(team,[])
    reject(all(x["week"]<7 for x in games),"FUTURE_LEAKED_HISTORY")
    recent=max((x["week"] for x in games),default=None)
    if recent is None:return {"team":team,"status":"NO_PAST_QB_ATTEMPT_DATA","forecast":None}
    latest=[x for x in games if x["week"]==recent]
    # Tie break predeclared. This is a proxy based on last observed attempts, NOT a confirmed starter.
    picked=sorted(latest,key=lambda x:(-x["pass_attempts"],x["player_id"]))[0]
    prior=sorted([x for x in games if x["player_id"]==picked["player_id"] and x["week"]<7],
                  key=lambda x:(x["week"],x["game_id"]))
    recent3=prior[-3:]
    last3=mean(x["pass_attempts"] for x in recent3)
    return {"team":team,"status":"HISTORICAL_LAST_APPEARANCE_QB_PROXY_NOT_STARTER_VERIFIED",
      "player_id":picked["player_id"],"player_name":picked["player_name"],
      "last_past_week":recent,"prior_player_games":len(prior),
      "past_game_weeks":[x["week"] for x in recent3],
      "forecast":last3,"forecast_rule":"MEAN_LAST_3_OBSERVED_PAST_GAMES",
      "selected_from_future_week7_play":False,"starter_verified":False,
      "zero_week7_attempts_retained_after_outcome":True}
def freeze(schedule,history,now):
    events=get_games(schedule)
    all_teams=sorted(set(x for e in events for x in (e["home"],e["away"])))
    candidates={team:select_team(team,history) for team in all_teams}
    allowed=[];skipped=[]
    for e in events:
        t=clock_utc(e["kickoff_utc"])
        lead=(t-now).total_seconds()
        if lead<=MIN_LEAD_SECONDS or e["status"]!="pre":
            skipped.append({**e,"reason":"NOT_PRE_KICKOFF_BUFFERED_OR_STATUS_PRE","lead_seconds_at_freeze":lead})
        else:
            allowed.append({**e,"lead_seconds_at_freeze":lead,
              "candidates":[candidates[e["away"]],candidates[e["home"]]]})
    reject(allowed,"NO_FUTURE_GAMES_AVAILABLE_TO_FREEZE")
    return {"all_week7_games":len(events),"eligible_future_games":allowed,
      "excluded_games":skipped,"all_schedule_teams":len(all_teams),
      "zero_outcome_participation_survivorship":True,
      "retains_nonselected_teams":True,"pre_kickoff_minimum_buffer_seconds":MIN_LEAD_SECONDS}
def selftest():
    e={"id":"123","date":"2026-10-25T17:00:00Z","status":{"type":{"state":"pre"}},"competitions":[{"competitors":[
       {"homeAway":"home","team":{"abbreviation":"B"}},{"homeAway":"away","team":{"abbreviation":"A"}}]}]}
    sample={"events":[dict(e,id=str(100+i),competitions=[{"competitors":[
      {"homeAway":"home","team":{"abbreviation":"H"+str(i)}},
      {"homeAway":"away","team":{"abbreviation":"A"+str(i)}}]}]) for i in range(14)]}
    hist={"H0":[{"player_id":"qb","player_name":"QB","week":6,"game_id":"past","pass_attempts":35}]}
    before=select_team("H0",hist);reject(before["forecast"]==35,"NO_PRIOR_BASELINE")
    got=freeze(sample,hist,clock_utc("2026-10-22T23:59:00Z"))
    reject(got["all_week7_games"]==14 and len(got["eligible_future_games"])==14,"CENSUS_INCOMPLETE")
    reject(select_team("A0",hist)["forecast"] is None,"MISSING_TEAM_NOT_RETAINED")
    mutant={"H0":hist["H0"]+[{"player_id":"new","week":7,"game_id":"future","pass_attempts":1000}]}
    try:select_team("H0",mutant)
    except ValueError as exc:reject("FUTURE_LEAKED_HISTORY" in str(exc),"FUTURE_LEAK_NOT_REJECTED")
    else:raise AssertionError("WEEK7_LABEL_ALLOWED_IN_FEATURE_HISTORY")
    try:freeze(sample,hist,clock_utc("2026-10-25T17:05:00Z"))
    except ValueError as exc:reject("NO_FUTURE_GAMES" in str(exc),"TIME_GUARD_MISMATCH")
    else:raise AssertionError("POST_KICKOFF_FREEZE_ACCEPTED")
    print("ATLAS_NFL_W7_PROSPECTIVE_CONTRACT=PASS")
def main():
    if "--self-test" in sys.argv:selftest();return
    # Snapshot begins before network retrieval; stricter than observed time at completion.
    started=datetime.now(timezone.utc)
    pbp_bytes,pbp_hash=url_read(URL_PBP)
    schedule_bytes,sc_hash=url_read(URL_SCHED)
    rows=[]
    with gzip.GzipFile(fileobj=io.BytesIO(pbp_bytes)) as z:
        with io.TextIOWrapper(z,encoding="utf-8-sig",newline="") as text_input:
            reader=csv.DictReader(text_input)
            need={"season","week","game_id","play_type","pass_attempt","posteam","passer_player_id","passer_player_name"}
            reject(need<=set(reader.fieldnames or []),"PBP_HEADERS_MISSING")
            for i,r in enumerate(reader):
                reject(i<160000,"PBP_ROWS_LIMIT")
                if str(r.get("season")) in ("2026","2026.0"):rows.append({k:r.get(k) for k in need})
    schedule=json.loads(schedule_bytes)
    result=freeze(schedule,history_from_pbp(rows),started)
    observed=datetime.now(timezone.utc)
    report={"schema":"atlas.nfl.w7.earliest_pre_kickoff_priceblind_shadow.v1",
      "research_only":True,"packet_created_utc":observed.isoformat(),
      "source_observation_started_utc":started.isoformat(),
      "github_runner_id":os.getenv("GITHUB_RUN_ID"),"github_head_sha":os.getenv("GITHUB_SHA"),
      "nflverse_sha256":pbp_hash,"espn_week7_schedule_sha256":sc_hash,
      "source_urls":[URL_PBP,URL_SCHED],"past_weeks_allowed":[1,2,3,4,5,6],
      "schedule_reconciliation":result,
      "player_selection":"PREVIOUS_APPEARANCE_HIGHEST_PASS_ATTEMPTS_PROXY_PER_TEAM",
      "injuries_and_starting_status_verified":False,"player_roster_current_verified":False,
      "real_observation_pre_kickoff_for_included_games":True,
      "externally_cryptographically_signed_freeze":False,
      "contemporaneous_odds_not_checked":True,"positive_ev_established":False,
      "calibrator_eligible":False,"production_authority":False,
      "automatic_wagers":False,"paid_odds_credits":0,
      "outcomes_absent_at_freeze":True}
    reject(all(clock_utc(e["kickoff_utc"])>observed+timedelta(seconds=MIN_LEAD_SECONDS)
      for e in result["eligible_future_games"]),"BUFFER_LOST_DURING_SNAPSHOT")
    with open("atlas-nfl-week7-prospective-shadow.json","w",encoding="utf-8") as f:
        json.dump(report,f,sort_keys=True,indent=2);f.write("\n")
    print("ATLAS_NFL_W7_PROSPECTIVE "+json.dumps({"created":observed.isoformat(),
       "games_scheduled":result["all_week7_games"],
       "games_pregame":len(result["eligible_future_games"]),
       "games_rejected":[{"id":x["event_id"],"reason":x["reason"]} for x in result["excluded_games"]],
       "candidates":[{"game_id":e["event_id"],"kickoff":e["kickoff_utc"],"away":e["away"],"home":e["home"],
         "qb_proxies":[{"team":p["team"],"name":p.get("player_name"),"id":p.get("player_id"),
           "estimate":p.get("forecast"),"prior_games":p.get("prior_player_games")} for p in e["candidates"]]}
          for e in result["eligible_future_games"]],
       "source_hashes":[pbp_hash,sc_hash],"github_run":os.getenv("GITHUB_RUN_ID"),
       "pre_kickoff":True,"starter_identity_verified":False,
       "authority":"SHADOW_ONLY"},sort_keys=True))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("ATLAS_NFL_W7_FREEZE_BLOCKED "+str(e),file=sys.stderr)
        sys.exit(1)

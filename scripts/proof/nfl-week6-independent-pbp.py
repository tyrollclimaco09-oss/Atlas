#!/usr/bin/env python3
"""Bounded independent 2026 Week 6 nflverse PBP study; never wager or mutate DB."""
import csv
import gzip
import hashlib
import io
import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone

NFLVERSE="https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz"
ESPN="https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872996"
GAME="2026_06_HOU_JAX"
ALL_FIELDS=["season","week","game_id","home_team","away_team","qtr","play_id","posteam",
            "play_type","pass_attempt","rush_attempt","qb_dropback","sack","qb_scramble",
            "no_play","penalty","passer_player_name","rusher_player_name","receiver_player_name"]
def fetch(url,limit):
    if url not in (NFLVERSE,ESPN):
        raise ValueError("EXTERNAL_HOST_NOT_ALLOWLISTED")
    req=urllib.request.Request(url,headers={"User-Agent":"ATLAS-NFL-PBP-EVIDENCE/1","Accept":"application/octet-stream,application/json"})
    with urllib.request.urlopen(req,timeout=24) as r:
        data=r.read(limit+1)
    if not data or len(data)>limit:
        raise ValueError("SOURCE_SIZE_BOUNDARY")
    return data,hashlib.sha256(data).hexdigest(),datetime.now(timezone.utc).isoformat()
def flag(row,col):
    v=str(row.get(col,"")).strip()
    return v in ("1","1.0","True","true")
def norm_plays(rows):
    distinct=set()
    ptype=Counter();quarters=Counter();teams=Counter();issues=Counter();stats=Counter()
    for r in rows:
        if r.get("game_id")!=GAME or str(r.get("week")) not in ("6","6.0") or str(r.get("season")) not in ("2026","2026.0"):
            raise ValueError("NFLVERSE_WEEK_OR_GAME_CONFLICT")
        if r.get("home_team")!="JAX" or r.get("away_team")!="HOU":
            raise ValueError("NFLVERSE_HOME_AWAY_CONFLICT")
        uid=str(r.get("play_id",""))
        if not uid or uid in distinct:issues["empty_or_duplicate_play_ids"]+=1
        distinct.add(uid)
        q=str(r.get("qtr",""));quarters[q]+=1
        team=str(r.get("posteam",""))
        teams[team if team else "UNKNOWN"]+=1
        typ=str(r.get("play_type","")).strip()
        ptype[typ if typ else "UNKNOWN"]+=1
        for k in ("pass_attempt","rush_attempt","qb_dropback","sack","qb_scramble","no_play","penalty"):
            if flag(r,k):stats[k]+=1
        if team and team not in ("JAX","HOU"):
            issues["outside_game_team"]+=1
    return {"row_count":len(rows),"unique_play_ids":len(distinct),
            "play_type_counts":dict(ptype),"qtr_counts":dict(quarters),"posteam_counts":dict(teams),
            "binary_event_indicators":dict(stats),"issues":dict(issues)}
def espn_reference(summary):
    game_id=str(summary.get("header",{}).get("id") or summary.get("header",{}).get("competitions",[{}])[0].get("id"))
    if game_id!="401872996":raise ValueError("ESPN_EVENT_IDENTITY_CONFLICT")
    teams=summary.get("boxscore",{}).get("teams",[])
    names={str(t.get("team",{}).get("id")):str(t.get("team",{}).get("abbreviation","")).upper() for t in teams}
    if names.get("30")!="JAX" or names.get("34")!="HOU":
        raise ValueError("ESPN_TEAM_IDENTITY_CONFLICT_"+str(names))
    drives=summary.get("drives",{}).get("previous",[])
    if not isinstance(drives,list) or not drives:raise ValueError("ESPN_COMPLETED_DRIVES_MISSING")
    plays=[p for d in drives for p in d.get("plays",[])]
    cats=Counter(str(p.get("type",{}).get("text","UNKNOWN")) for p in plays)
    # Predeclared event-type mapping; these are whole-game event counts, not per-actor IDs.
    pass_types=("Pass Reception","Pass Incompletion","Passing Touchdown","Pass Interception Return")
    rush_types=("Rush","Rushing Touchdown")
    return {"game_id":game_id,"home_team":"JAX","away_team":"HOU","espn_team_ids":names,
        "derived_espn_pass_attempt_events":sum(cats.get(t,0) for t in pass_types),
        "derived_espn_rush_attempt_events":sum(cats.get(t,0) for t in rush_types),
        "pass_type_mapping":list(pass_types),"rush_type_mapping":list(rush_types),
        "completed_drives":len(drives),"observed_plays":len(plays),
        "source_consistent_candidate_types":{
            "Pass Reception":cats.get("Pass Reception",0),
            "Pass Incompletion":cats.get("Pass Incompletion",0),
            "Rush":cats.get("Rush",0)},
        "all_play_types":dict(cats)}
def selftest():
    sample=[{"season":"2026","week":"6","game_id":GAME,"home_team":"JAX","away_team":"HOU",
             "play_id":"10","qtr":"1","posteam":"HOU","play_type":"pass","pass_attempt":"1",
             "qb_dropback":"1","sack":"0","no_play":"0"},
            {"season":"2026","week":"6","game_id":GAME,"home_team":"JAX","away_team":"HOU",
             "play_id":"11","qtr":"1","posteam":"HOU","play_type":"run","rush_attempt":"1",
             "no_play":"0"}]
    got=norm_plays(sample)
    assert got["row_count"]==2 and got["binary_event_indicators"]["pass_attempt"]==1
    assert got["binary_event_indicators"]["rush_attempt"]==1
    assert got["issues"]=={}
    assert norm_plays(sample+[sample[0]])["issues"]["empty_or_duplicate_play_ids"]==1
    bad=dict(sample[0],play_id="12",posteam="NE")
    assert norm_plays(sample+[bad])["issues"]["outside_game_team"]==1
    espn_ok={"header":{"id":"401872996"},"boxscore":{"teams":[
        {"team":{"id":"30","abbreviation":"JAX"}},
        {"team":{"id":"34","abbreviation":"HOU"}}]},
        "drives":{"previous":[{"plays":[{"id":"1","type":{"text":"Rush"}}]}]}}
    assert espn_reference(espn_ok)["home_team"]=="JAX"
    assert espn_reference(espn_ok)["derived_espn_rush_attempt_events"]==1
    assert espn_reference(espn_ok)["derived_espn_pass_attempt_events"]==0
    espn_wrong=json.loads(json.dumps(espn_ok))
    espn_wrong["boxscore"]["teams"][0]["team"]["abbreviation"]="NE"
    try:espn_reference(espn_wrong)
    except ValueError as e:assert "ESPN_TEAM_IDENTITY_CONFLICT" in str(e)
    else:raise AssertionError("NEW_ENGLAND_IDENTITY_FALSELY_ACCEPTED")
    incorrect=[dict(sample[0],week="7")]
    try:norm_plays(incorrect)
    except ValueError as e: assert "GAME_CONFLICT" in str(e)
    else:raise AssertionError("WEEK7_MISLABEL_NOT_REJECTED")
    print("ATLAS_NFL_PBP_INDEPENDENT_OFFLINE=PASS")
def main():
    if "--self-test" in sys.argv:
        selftest();return
    zipped,pbp_hash,pbp_at=fetch(NFLVERSE,9_000_000)
    rows=[];headers=[];available_weeks=Counter();week6_games=set();hou_examples=set()
    with gzip.GzipFile(fileobj=io.BytesIO(zipped)) as gz:
        with io.TextIOWrapper(gz,encoding="utf-8-sig",newline="") as s:
            reader=csv.DictReader(s);headers=list(reader.fieldnames or [])
            for n,r in enumerate(reader):
                if n>160000:raise ValueError("DATASET_ROW_LIMIT")
                if str(r.get("season","")) in ("2026","2026.0"):
                    week=str(r.get("week",""))
                    available_weeks[week]+=1
                    if week in ("6","6.0"):
                        week6_games.add(str(r.get("game_id","")))
                    if "HOU" in str(r.get("game_id","")) and len(hou_examples)<20:
                        hou_examples.add(str(r.get("game_id","")))
                if r.get("game_id")==GAME:rows.append({k:r.get(k) for k in ALL_FIELDS})
                if len(rows)>500:raise ValueError("GAME_PLAY_COUNT_LIMIT")
    if not rows:
        state="WEEK6_NOT_IN_PLAY_BY_PLAY_RELEASE" if not any(x in available_weeks for x in ("6","6.0")) else "EXPECTED_GAME_ID_NOT_IN_WEEK6"
        report={"schema":"atlas.nfl.week6.independent-pbp-availability.v1",
          "classification":"SOURCE_COVERAGE_AUDIT_NOT_PLAYER_PROOF",
          "nflverse_url":NFLVERSE,"nflverse_sha256":pbp_hash,
          "nflverse_observed_at_utc":pbp_at,
          "weeks_2026":dict(available_weeks),
          "week6_game_ids":sorted(week6_games)[:35],
          "hou_game_id_examples":sorted(hou_examples),
          "expected_game_id":GAME,"status":state,
          "independent_week6_pbp_verified":False,
          "play_id_one_to_one_verified":False,
          "production_authority":False,"calibrator_eligible":False,
          "execution_authority":False,"odds_api_credits":0,"database_written":False}
        with open("atlas-nfl-week6-independent-pbp.json","w",encoding="utf-8") as f:
            json.dump(report,f,indent=2,sort_keys=True);f.write("\n")
        print("ATLAS_NFL_PBP_SOURCE_COVERAGE "+json.dumps({
          "status":state,"weeks_2026":dict(available_weeks),
          "week6_game_ids":sorted(week6_games)[:35],
          "hou_games":sorted(hou_examples)},sort_keys=True))
        return
    esbytes,es_hash,es_at=fetch(ESPN,4_000_000)
    espn=espn_reference(json.loads(esbytes))
    independent=norm_plays(rows)
    volume={
        "espn_pass_attempt_events":espn["derived_espn_pass_attempt_events"],
        "nflverse_pass_attempt_flags":independent["binary_event_indicators"].get("pass_attempt",0),
        "espn_rush_attempt_events":espn["derived_espn_rush_attempt_events"],
        "nflverse_rush_attempt_flags":independent["binary_event_indicators"].get("rush_attempt",0)
    }
    volume["game_pass_attempt_count_matches"]=volume["espn_pass_attempt_events"]==volume["nflverse_pass_attempt_flags"]
    volume["game_rush_attempt_count_matches"]=volume["espn_rush_attempt_events"]==volume["nflverse_rush_attempt_flags"]
    volume["scope"]="GAME_LEVEL_EVENT_CATEGORY_TOTALS_ONLY_NOT_PLAYER_OR_PLAY_ID_PARITY"
    proof={"schema":"atlas.nfl.week6.independent-pbp-census.v1",
       "classification":"TWO_SOURCE_POSTGAME_COVERAGE_AUDIT_NO_MODEL",
       "nflverse_game_id":GAME,"espn_event_id":espn["game_id"],
       "nflverse_url":NFLVERSE,"nflverse_sha256":pbp_hash,"nflverse_observed_at_utc":pbp_at,
       "espn_url":ESPN,"espn_sha256":es_hash,"espn_observed_at_utc":es_at,
       "nflverse_columns_expected_present":[x for x in ALL_FIELDS if x in headers],
       "nflverse":independent,"espn":espn,"cross_source_game_attempt_totals":volume,
       "player_actor_ids_event_aligned":False,
       "play_id_one_to_one_verified":False,
       "official_play_completeness_verified":False,
       "calibrator_eligible":False,"production_authority":False,
       "execution_authority":False,"odds_api_credits":0,"database_written":False}
    with open("atlas-nfl-week6-independent-pbp.json","w",encoding="utf-8") as f:
        json.dump(proof,f,indent=2,sort_keys=True);f.write("\n")
    print("ATLAS_NFL_INDEPENDENT_PBP "+json.dumps({
      "nflverse":independent,"espn_summary":espn,
      "game_id":GAME,"hash":pbp_hash,"attempt_parity":volume,
      "actor_mapping_verified":False,"play_id_pairing_verified":False},sort_keys=True))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("ATLAS_NFL_PBP_BLOCKED "+str(e),file=sys.stderr)
        sys.exit(1)

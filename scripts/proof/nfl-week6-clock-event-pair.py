#!/usr/bin/env python3
"""ATLAS NFL bounded clock/team/type event correspondence, SHADOW only."""
import csv
import gzip
import hashlib
import io
import json
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone

GAME = "2026_06_HOU_JAX"
URL_NFL = "https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz"
URL_ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872996"
ID_TO_TEAM = {"30":"JAX","34":"HOU"}
TYPES = {"Pass Reception":"PASS","Pass Incompletion":"PASS","Rush":"RUSH"}

def check(v,msg):
    if not v:raise ValueError(msg)
def load(url,limit):
    check(url in (URL_NFL,URL_ESPN),"SOURCE_URL_NOT_ALLOWLISTED")
    req=urllib.request.Request(url,headers={"Accept":"application/json,application/octet-stream",
       "User-Agent":"ATLAS-NFL-WEEK6-CLOCK-IDENTITY/1"})
    with urllib.request.urlopen(req,timeout=24) as response:
        data=response.read(limit+1)
    check(data and len(data)<=limit,"SOURCE_SIZE")
    return data,hashlib.sha256(data).hexdigest()
def clock_display(v):
    m=re.fullmatch(r"(\d{1,2}):(\d\d)",str(v or ""))
    return int(m[1])*60+int(m[2]) if m and int(m[2])<60 else None
def clock_float(v):
    try:x=float(v)
    except (ValueError,TypeError):return None
    if not 0<=x<=900:return None
    if abs(x-round(x))>0.10:return None
    return int(round(x))
def normalize_espn(summary):
    teams=summary.get("boxscore",{}).get("teams",[])
    actual={str(t.get("team",{}).get("id")):str(t.get("team",{}).get("abbreviation","")) for t in teams}
    check(actual.get("30")=="JAX" and actual.get("34")=="HOU","ESPN_GAME_OPPONENT_INVALID")
    check(str(summary.get("header",{}).get("id"))=="401872996","ESPN_GAME_ID_INVALID")
    drive=summary.get("drives",{}).get("previous",[])
    check(isinstance(drive,list) and len(drive)>10,"ESPN_DRIVE_MISSING")
    eligible=[],excluded=Counter()
    for d in drive:
        for p in d.get("plays",[]):
            kind=TYPES.get(p.get("type",{}).get("text"))
            if not kind:excluded["TYPE_EXCLUDED"]+=1;continue
            if p.get("isPenalty") is True or p.get("isTurnover") is True:
                excluded["PENALTY_OR_TURNOVER"]+=1;continue
            team=ID_TO_TEAM.get(str(d.get("team",{}).get("id")))
            start=ID_TO_TEAM.get(str(p.get("start",{}).get("team",{}).get("id")))
            if not team or start!=team:excluded["SOURCE_TEAM_MISMATCH"]+=1;continue
            q=p.get("period",{}).get("number")
            tm=clock_display(p.get("clock",{}).get("displayValue"))
            if not isinstance(q,int) or q<1 or q>4 or tm is None:
                excluded["UNKNOWN_CLOCK_OR_PERIOD"]+=1;continue
            eligible.append({"play_id":str(p.get("id")),"q":q,"sec":tm,"team":team,
             "kind":kind,"type":p.get("type",{}).get("text")})
    return eligible,dict(excluded)
def normalize_nflverse(rows):
    eligible=[],excluded=Counter()
    for r in rows:
        check(r.get("game_id")==GAME and str(r.get("week")) in ("6","6.0"),"NFL_GAME_ID_MISMATCH")
        team=r.get("posteam")
        if team not in ("JAX","HOU"):excluded["UNKNOWN_POSSESSION"]+=1;continue
        if str(r.get("no_play")) in ("1","1.0"):excluded["NO_PLAY"]+=1;continue
        passing=str(r.get("pass_attempt")) in ("1","1.0")
        rushing=str(r.get("rush_attempt")) in ("1","1.0")
        if passing==rushing:excluded["NOT_EXACTLY_ONE_ATTEMPT_FLAG"]+=1;continue
        q=clock_float(r.get("qtr"));tm=clock_float(r.get("quarter_seconds_remaining"))
        if q is None or tm is None or q not in (1,2,3,4):
            excluded["UNKNOWN_CLOCK_OR_QUARTER"]+=1;continue
        eligible.append({"play_id":str(r.get("play_id")),"q":q,"sec":tm,
          "team":team,"kind":"PASS" if passing else "RUSH","type":str(r.get("play_type",""))})
    return eligible,dict(excluded)
def matching(a,b):
    ga=defaultdict(list);gb=defaultdict(list)
    for p in a:ga[(p["q"],p["sec"],p["team"],p["kind"])].append(p)
    for p in b:gb[(p["q"],p["sec"],p["team"],p["kind"])].append(p)
    pairs=[];ambiguous=[];missing_a=[];missing_b=[]
    for key in sorted(set(ga)|set(gb)):
        x,y=ga.get(key,[]),gb.get(key,[])
        if len(x)==len(y)==1:
            pairs.append({"q":key[0],"remaining_seconds":key[1],"team":key[2],"kind":key[3],
                          "espn_play_id":x[0]["play_id"],"nflverse_play_id":y[0]["play_id"]})
        elif x and y:
            ambiguous.append({"q":key[0],"sec":key[1],"team":key[2],"kind":key[3],
                              "espn_count":len(x),"nflverse_count":len(y)})
        elif x:missing_a.extend(x)
        else:missing_b.extend(y)
    return {"unique_correspondences":len(pairs),"exact_clock_key_pairs":pairs,
            "ambiguous_keys":ambiguous,"espn_only":missing_a,"nflverse_only":missing_b,
            "ambiguous_count":len(ambiguous),
            "espn_only_count":len(missing_a),"nflverse_only_count":len(missing_b),
            "strict_match_is_actor_proof":False,"source_admin_events_equivalent":False}
def selftest():
    esp=[{"play_id":"e1","q":1,"sec":600,"team":"HOU","kind":"PASS"},
         {"play_id":"e2","q":1,"sec":580,"team":"JAX","kind":"RUSH"}]
    other=[{"play_id":"n1","q":1,"sec":600,"team":"HOU","kind":"PASS"},
           {"play_id":"n2","q":1,"sec":580,"team":"JAX","kind":"PASS"}]
    a=matching(esp,other)
    assert a["unique_correspondences"]==1 and a["espn_only_count"]==1 and a["nflverse_only_count"]==1
    assert a["strict_match_is_actor_proof"] is False
    assert matching(esp,other+[other[0]])["ambiguous_count"]==1
    assert clock_display("00:09")==9 and clock_display("INVALID") is None
    assert clock_float("600.0")==600 and clock_float("junk") is None
    fake={"header":{"id":"401872996"},"boxscore":{"teams":[
      {"team":{"id":"30","abbreviation":"NE"}},{"team":{"id":"34","abbreviation":"HOU"}}]},
      "drives":{"previous":[{"plays":[]}]*11}}
    try:normalize_espn(fake)
    except ValueError as e:assert "OPPONENT_INVALID" in str(e)
    else:raise AssertionError("WRONG_OPPONENT_ACCEPTED")
    print("ATLAS_NFL_CLOCK_PAIR_TESTS=PASS")
def main():
    if "--self-test" in sys.argv:
        selftest();return
    b,hb=load(URL_NFL,9_000_000)
    rows=[]
    with gzip.GzipFile(fileobj=io.BytesIO(b)) as z:
        with io.TextIOWrapper(z,encoding="utf-8-sig",newline="") as inp:
            reader=csv.DictReader(inp)
            required={"game_id","week","posteam","play_id","qtr","quarter_seconds_remaining",
              "pass_attempt","rush_attempt","no_play"}
            missing=sorted(required-set(reader.fieldnames or []))
            print("ATLAS_NFL_CLOCK_SCHEMA "+json.dumps({"field_names":list(reader.fieldnames or [])[:120],"missing_required":missing},sort_keys=True))
            check(not missing,"NFLVERSE_REQUIRED_COLUMNS_ABSENT_"+",".join(missing))
            for i,line in enumerate(reader):
                check(i<160000,"NFLVERSE_SIZE_ROWS")
                if line.get("game_id")==GAME:
                    rows.append({k:line.get(k) for k in required|{"play_type"}})
                    check(len(rows)<500,"NFL_GAME_TOO_MANY_ROWS")
    check(rows,"NFL_WEEK6_NOT_AVAILABLE")
    e,he=load(URL_ESPN,4_000_000)
    a,excluded_a=normalize_espn(json.loads(e))
    n,excluded_n=normalize_nflverse(rows)
    result=matching(a,n)
    receipt={"schema":"atlas.nfl.week6.clock-event-correspondence.shadow.v1",
      "classification":"STRICT_CLOCK_TEAM_KIND_CORRESPONDENCE_NOT_ACTOR_CERTIFICATION",
      "game":"2026_06_HOU_JAX","observed_at_utc":datetime.now(timezone.utc).isoformat(),
      "nflverse_sha256":hb,"espn_sha256":he,
      "espn_restricted_candidates":len(a),"nflverse_attempt_candidates":len(n),
      "espn_rejections":excluded_a,"nflverse_rejections":excluded_n,
      "comparison":{k:(v[:30] if isinstance(v,list) else v) for k,v in result.items()
                    if k!="exact_clock_key_pairs"},
      "example_matched_pairs":result["exact_clock_key_pairs"][:20],
      "complete_pairwise_coverage_proven":False,"player_actor_match_proven":False,
      "calibrator_eligible":False,"production_authority":False,
      "execution_authority":False,"paid_odds_calls":0}
    with open("atlas-nfl-week6-clock-pairing.json","w",encoding="utf8") as f:
        json.dump(receipt,f,sort_keys=True,indent=2);f.write("\n")
    print("ATLAS_NFL_CLOCK_PAIR "+json.dumps({
      "espn_candidates":len(a),"nflverse_candidates":len(n),
      "matched":result["unique_correspondences"],"ambiguous_keys":result["ambiguous_count"],
      "espn_only":result["espn_only_count"],"nflverse_only":result["nflverse_only_count"],
      "espn_rejections":excluded_a,"nflverse_rejections":excluded_n,
      "actor_proof":False,"nflverse_sha":hb},sort_keys=True))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("ATLAS_NFL_CLOCK_PAIR_BLOCKED "+str(e),file=sys.stderr)
        sys.exit(1)

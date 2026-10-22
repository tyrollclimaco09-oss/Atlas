#!/usr/bin/env python3
"""ATLAS: independent NFL Week 6 player-volume parity proof. No odds or writes."""
import csv, gzip, hashlib, io, json, re, sys, urllib.request
from datetime import datetime, timezone

ESPN = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/"
NFLVERSE = "https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2026.csv.gz"
TARGET = {"cjstroud": ("passing", "C/ATT", "attempts"), "woodymarks": ("rushing", "CAR", "carries")}

def norm(x):
    return re.sub(r"[^a-z0-9]", "", str(x).lower())

def load(url, cap):
    req=urllib.request.Request(url,headers={"Accept":"application/json,application/octet-stream","User-Agent":"ATLAS-NFL-INDEPENDENT-WEEK6-RESEARCH/1"})
    with urllib.request.urlopen(req,timeout=20) as x:
        data=x.read(cap+1)
    if not data or len(data)>cap:
        raise ValueError("EXTERNAL_SOURCE_SIZE_LIMIT")
    return data,hashlib.sha256(data).hexdigest()

def espn_volumes(summary, team_id):
    out={}
    teams=summary.get("boxscore",{}).get("players",[])
    for team in teams:
        if str(team.get("team",{}).get("id"))!=str(team_id):
            continue
        for group in team.get("statistics",[]):
            group_name=str(group.get("name","")).lower()
            labels=group.get("labels",[])
            for athlete in group.get("athletes",[]):
                name=norm(athlete.get("athlete",{}).get("displayName",""))
                if name not in TARGET:
                    continue
                kind,label,_=TARGET[name]
                if kind!=group_name or label not in labels:
                    continue
                stats=athlete.get("stats",[])
                if len(stats)!=len(labels):
                    continue
                val=stats[labels.index(label)]
                if label=="C/ATT":
                    m=re.fullmatch(r"(\d+)/(\d+)",str(val))
                    got=int(m.group(2)) if m else None
                else:
                    got=int(val) if str(val).isdigit() else None
                if got is not None:
                    out[name]=got
    return out

def nflverse_volumes(rows):
    results={}
    for row in rows:
        if row.get("season")!="2026" or row.get("week")!="6" or row.get("team")!="HOU":
            continue
        name=norm(row.get("player_display_name",""))
        if name in TARGET:
            field=TARGET[name][2]
            val=row.get(field)
            if val:
                v=float(val)
                if v.is_integer():results[name]=int(v)
    return results

def selftest():
    src={"boxscore":{"players":[{"team":{"id":"34"},"statistics":[
      {"name":"passing","labels":["C/ATT"],"athletes":[{"athlete":{"displayName":"C.J. Stroud"},"stats":["23/35"]}]},
      {"name":"rushing","labels":["CAR"],"athletes":[{"athlete":{"displayName":"Woody Marks"},"stats":["15"]}]}]}]}}
    assert espn_volumes(src,"34")=={"cjstroud":35,"woodymarks":15}
    rr=[{"season":"2026","week":"6","team":"HOU","player_display_name":"C.J. Stroud","attempts":"35"},
        {"season":"2026","week":"6","team":"HOU","player_display_name":"Woody Marks","carries":"15"}]
    assert nflverse_volumes(rr)=={"cjstroud":35,"woodymarks":15}
    rr[1]["week"]="5"
    assert len(nflverse_volumes(rr))==1
    print("ATLAS_NFL_WEEK6_OFFLINE_IDENTITY_TEST=PASS")

def main():
    if "--self-test" in sys.argv:
        selftest();return
    board_bytes,board_hash=load(ESPN+"scoreboard?week=6&seasontype=2&year=2026",2_500_000)
    board=json.loads(board_bytes)
    events=[e for e in board.get("events",[]) if e.get("status",{}).get("type",{}).get("completed") is True
      and any(str(t.get("team",{}).get("id"))=="34" for c in e.get("competitions",[]) for t in c.get("competitors",[]))]
    if len(events)!=1:
        raise ValueError("WEEK6_HOU_GAME_NOT_UNIQUE_"+str(len(events)))
    event=events[0];eid=str(event["id"])
    summary_bytes,summary_hash=load(ESPN+"summary?event="+eid,3_500_000)
    summary=json.loads(summary_bytes)
    sid=summary.get("header",{}).get("id") or (summary.get("header",{}).get("competitions") or [{}])[0].get("id")
    if str(sid)!=eid:
        raise ValueError("SUMMARY_EVENT_MISMATCH")
    esp=espn_volumes(summary,"34")
    gz,nfl_hash=load(NFLVERSE,1_500_000)
    raw=gzip.decompress(gz)
    if len(raw)>6_000_000:raise ValueError("EXPANDED_SOURCE_TOO_LARGE")
    rows=list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
    nf=nflverse_volumes(rows)
    comparisons=[]
    for name in TARGET:
        comparisons.append({"name":name,"espn":esp.get(name),"nflverse":nf.get(name),
          "matched":name in esp and name in nf and esp[name]==nf[name]})
    status="MATCH" if all(v["matched"] for v in comparisons) else "MISSING_OR_CONFLICT"
    report={
      "schema":"atlas.nfl.week6.crosssource.v1","classification":"POSTGAME_INDEPENDENT_SOURCE_CHECK",
      "week":6,"season":2026,"game_id":eid,"provider_a":"ESPN_UNOFFICIAL",
      "provider_b":"nflverse","observed_at_utc":datetime.now(timezone.utc).isoformat(),
      "scoreboard_sha256":board_hash,"espn_summary_sha256":summary_hash,"nflverse_release_sha256":nfl_hash,
      "source_published_at_verified":False,
      "comparison":comparisons,"status":status,
      "not_pregame":True,"not_a_complete_nfl_pbp_audit":True,
      "calibrator_eligible":False,"execution_authority":False,"production_authority":False,
      "odds_api_credits":0}
    with open("atlas-nfl-week6-crosssource-proof.json","w",encoding="utf-8") as f:
        json.dump(report,f,indent=2,sort_keys=True);f.write("\n")
    print("ATLAS_NFL_WEEK6_INDEPENDENT "+json.dumps({
      "status":status,"game_id":eid,"comparison":comparisons,
      "nflverse_sha256":nfl_hash},sort_keys=True))
    if status!="MATCH":raise ValueError("WEEK6_CROSSSOURCE_NOT_CORROBORATED")

if __name__=="__main__":
    main()

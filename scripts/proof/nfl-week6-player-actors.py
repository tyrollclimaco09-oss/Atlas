#!/usr/bin/env python3
"""ATLAS Week 6 NFL player-actor *candidate* cross-check, source-identity bounded."""
import csv,gzip,hashlib,io,json,re,sys,urllib.request
from collections import Counter,defaultdict
from datetime import datetime,timezone

PBP="https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz"
ESPN="https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872996"
GAME="2026_06_HOU_JAX"
COLUMNS=("game_id","week","posteam","play_id","pass_attempt","rush_attempt",
         "passer_player_id","rusher_player_id","passer_player_name","rusher_player_name",
         "receiver_player_id","receiver_player_name","no_play","play_type",
         "qtr","quarter_seconds_remaining")
def require(c,message):
    if not c:raise ValueError(message)
def download(url,cap):
    require(url in (PBP,ESPN),"DISALLOWED_URL")
    req=urllib.request.Request(url,headers={"Accept":"application/octet-stream,application/json",
      "User-Agent":"ATLAS-NFL-PLAYER-IDENTITY-SHADOW/1"})
    with urllib.request.urlopen(req,timeout=25) as r:
        b=r.read(cap+1)
    require(len(b)>0 and len(b)<=cap,"SOURCE_SIZE_BOUNDS")
    return b,hashlib.sha256(b).hexdigest()
def normalize_name(s):
    return re.sub(r"[^a-z]","",str(s).lower())
def extract_espn_player_attempts(summary):
    require(str(summary.get("header",{}).get("id"))=="401872996","ESPN_GAME_ID")
    teams=summary.get("boxscore",{}).get("players",[])
    hou=[x for x in teams if str(x.get("team",{}).get("id"))=="34"]
    require(len(hou)==1,"HOU_PLAYERS_NOT_UNIQUE")
    data={}
    for grp in hou[0].get("statistics",[]):
        category=str(grp.get("name","")).lower()
        labels=grp.get("labels",[])
        for a in grp.get("athletes",[]):
            name=a.get("athlete",{}).get("displayName","")
            key="stroud" if "stroud" in normalize_name(name) else "marks" if "marks" in normalize_name(name) else None
            if not key:continue
            stats=a.get("stats",[])
            if len(stats)!=len(labels):continue
            if category=="passing" and key=="stroud" and "C/ATT" in labels:
                val=str(stats[labels.index("C/ATT")])
                m=re.fullmatch(r"(\d+)/(\d+)",val)
                if m:data["stroud_espn_pass_attempts"]=int(m.group(2))
            if category=="rushing" and key=="marks" and "CAR" in labels:
                val=str(stats[labels.index("CAR")])
                if val.isdigit():data["marks_espn_carries"]=int(val)
    return data
def actor_rows(rows):
    passes=Counter();rushes=Counter();unknown=Counter();examples=defaultdict(set);source_ids=defaultdict(set)
    for r in rows:
        require(r.get("game_id")==GAME and str(r.get("week")) in ("6","6.0"),"WRONG_GAME_OR_WEEK")
        if r.get("posteam") not in ("HOU","JAX"):continue
        if r.get("play_type")=="no_play":continue
        p=str(r.get("pass_attempt")) in ("1","1.0")
        rush=str(r.get("rush_attempt")) in ("1","1.0")
        if p==rush:continue
        kind="PASS" if p else "RUSH"
        actor_field="passer_player_id" if p else "rusher_player_id"
        name_field="passer_player_name" if p else "rusher_player_name"
        actor=str(r.get(actor_field) or "").strip()
        name=str(r.get(name_field) or "").strip()
        if not actor or actor in ("NA","nan"):
            unknown[kind]+=1;continue
        key=(r["posteam"],actor)
        if p:passes[key]+=1
        else:rushes[key]+=1
        if name:examples[(kind,)+key].add(name)
        source_ids[(kind,)+key].add(str(r.get("play_id")))
    def serialize(c,kind):
        return [{"team":team,"source_player_id":pid,"attempts":value,
             "source_player_names":sorted(examples.get((kind,team,pid),[])),
             "example_play_ids":sorted(source_ids.get((kind,team,pid),set()),key=lambda x:float(x))[:8]}
            for (team,pid),value in c.most_common()]
    return {"pass_actors":serialize(passes,"PASS"),"rush_actors":serialize(rushes,"RUSH"),
      "missing_actor_ids":dict(unknown),
      "pass_attempts_with_valid_actor":sum(passes.values()),
      "rush_attempts_with_valid_actor":sum(rushes.values())}
def identify_named_unique(records,needle):
    found=[x for x in records if x["team"]=="HOU" and any(needle in normalize_name(name)
                  for name in x["source_player_names"])]
    return found[0] if len(found)==1 else None
def selftest():
    rows=[{"game_id":GAME,"week":"6","posteam":"HOU","play_type":"pass",
      "pass_attempt":"1","rush_attempt":"0","passer_player_id":"00-1234",
      "passer_player_name":"C.Stroud","play_id":"1"},
      {"game_id":GAME,"week":"6","posteam":"HOU","play_type":"run",
       "pass_attempt":"0","rush_attempt":"1","rusher_player_id":"00-4321",
       "rusher_player_name":"W.Marks","play_id":"2"}]
    d=actor_rows(rows)
    assert identify_named_unique(d["pass_actors"],"stroud")["attempts"]==1
    assert identify_named_unique(d["rush_actors"],"marks")["attempts"]==1
    assert d["missing_actor_ids"]=={}
    bad=dict(rows[0],week="7")
    try:actor_rows([bad])
    except ValueError as e:assert "WRONG_GAME" in str(e)
    else:raise AssertionError("BAD_WEEK_ACCEPTED")
    print("ATLAS_NFL_ACTOR_OFFLINE=PASS")
def main():
    if "--self-test" in sys.argv:selftest();return
    compressed,pbp_hash=download(PBP,9_000_000)
    rows=[];header=[]
    with gzip.GzipFile(fileobj=io.BytesIO(compressed)) as z:
        with io.TextIOWrapper(z,encoding="utf-8-sig",newline="") as t:
            reader=csv.DictReader(t);header=list(reader.fieldnames or [])
            require(set(COLUMNS)-{"no_play"}<=set(header),"NFLVERSE_PLAYER_FIELDS_MISSING_"+str(sorted((set(COLUMNS)-{"no_play"})-set(header))))
            for count,r in enumerate(reader):
                require(count<160000,"TOO_MANY_SOURCE_ROWS")
                if r.get("game_id")==GAME:
                    rows.append({k:r.get(k) for k in COLUMNS})
                    require(len(rows)<=500,"GAME_SOURCE_ROWS_LIMIT")
    require(len(rows)>=100,"GAME_NOT_FOUND")
    esp,esp_hash=download(ESPN,4_000_000)
    source=extract_espn_player_attempts(json.loads(esp))
    actors=actor_rows(rows)
    stroud=identify_named_unique(actors["pass_actors"],"stroud")
    marks=identify_named_unique(actors["rush_actors"],"marks")
    result={"schema":"atlas.nfl.week6.actor-source-crosscheck.shadow.v1",
      "classification":"PLAYER_NAME_AND_TEAM_SOURCE_AGREEMENT_NOT_CROSS_PROVIDER_ID_PROOF",
      "game_id":GAME,"observed_at_utc":datetime.now(timezone.utc).isoformat(),
      "nflverse_sha256":pbp_hash,"espn_sha256":esp_hash,
      "espn_reference":source,"nflverse_actors":actors,
      "nflverse_hou_stroud":stroud,"nflverse_hou_marks":marks,
      "stroud_total_agreement":stroud is not None and stroud["attempts"]==source.get("stroud_espn_pass_attempts"),
      "marks_total_agreement":marks is not None and marks["attempts"]==source.get("marks_espn_carries"),
      "cross_provider_person_id_mapping_verified":False,
      "complete_play_actor_coverage_verified":False,
      "real_time_pregame_forecast":False,
      "calibrator_eligible":False,"execution_authority":False,
      "production_authority":False,"odds_credits":0}
    with open("atlas-nfl-week6-actor-volume.json","w",encoding="utf-8") as w:
        json.dump(result,w,sort_keys=True,indent=2);w.write("\n")
    print("ATLAS_NFL_ACTOR_VOLUMES "+json.dumps({
      "ESPN":source,"nflverse_stroud":stroud,"nflverse_marks":marks,
      "stroud_agrees":result["stroud_total_agreement"],
      "marks_agrees":result["marks_total_agreement"],
      "unknown_actor_ids":actors["missing_actor_ids"],"passers":len(actors["pass_actors"]),
      "rushers":len(actors["rush_actors"]),"cross_provider_id_proved":False},sort_keys=True))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("ATLAS_NFL_ACTOR_BLOCKED "+str(e),file=sys.stderr);sys.exit(1)

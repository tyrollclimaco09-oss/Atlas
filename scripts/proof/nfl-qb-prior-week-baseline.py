#!/usr/bin/env python3
"""ATLAS NFL 2026 first chronological price-blind QB passing-attempt baseline. No odds, shadow."""
import csv,gzip,hashlib,io,json,statistics,sys,urllib.request
from collections import defaultdict,Counter
from datetime import datetime,timezone
URL="https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.csv.gz"
HEADERS={"User-Agent":"ATLAS-QB-CHRONOLOGICAL-SHADOW/1","Accept":"application/octet-stream"}
def need(b,s):
    if not b:raise ValueError(s)
def classify(row):
    if row.get("play_type")=="no_play":return None
    try:attempt=float(row.get("pass_attempt") or "0")==1
    except ValueError:return None
    if not attempt:return None
    if row.get("posteam") in (None,"", "NA"):return None
    name=(row.get("passer_player_name") or "").strip()
    pid=(row.get("passer_player_id") or "").strip()
    if not pid or pid in ("NA","nan") or not name:return None
    return (row["game_id"],int(float(row["week"])),pid,name,row["posteam"])
def extract(rows):
    counts=Counter();seen=set();games=defaultdict(set);kinds=Counter();issues=Counter()
    for r in rows:
        if str(r.get("season")) not in ("2026","2026.0"):continue
        if not str(r.get("week","")).replace(".0","").isdigit():continue
        try:
            w=int(float(r["week"]))
            if not 1<=w<=18:continue
            item=classify(r)
        except (KeyError,ValueError):
            issues["bad_row"]+=1;continue
        if item is None:continue
        g,week,pid,name,team=item
        identity=(g,str(r.get("play_id")))
        if identity in seen:issues["duplicate_passing_play"]+=1;continue
        seen.add(identity)
        key=(week,g,pid,team,name)
        counts[key]+=1;games[(week,g)].add(pid)
        kinds[week]+=1
    outcomes=[{"week":w,"game_id":g,"player_id":pid,"player_name":name,"team":team,"attempts":n}
              for (w,g,pid,team,name),n in counts.items()]
    # One person may appear under multiple names in a game; fail rather than combine invisibly.
    seenPlayers=set()
    for x in outcomes:
        k=(x["game_id"],x["player_id"])
        need(k not in seenPlayers,"PLAYER_NAME_ALIAS_IN_GAME")
        seenPlayers.add(k)
    return sorted(outcomes,key=lambda x:(x["week"],x["game_id"],x["player_id"])),dict(issues),dict(kinds)
def paired_backtest(games):
    """Frozen predeclaration: only prior completed weeks; no same-week peer labels."""
    dates=sorted(set(x["week"] for x in games))
    predictions=[];by_player=defaultdict(list);prior_starter_values=[]
    for w in dates:
        curr=[x for x in games if x["week"]==w]
        if w>=4:
            league=statistics.mean(prior_starter_values) if prior_starter_values else None
            for x in curr:
                history=by_player[x["player_id"]]
                before=[h for h in history if h["week"]<w]
                # Eligibility is solely based on past observed workload, not this week's outcome.
                if len(before)<2 or before[-1]["attempts"]<10 or league is None:continue
                last=before[-3:]
                prediction=statistics.mean(a["attempts"] for a in last)
                predictions.append({"week":w,"game_id":x["game_id"],"player_id":x["player_id"],
                    "team":x["team"],"player_name":x["player_name"],
                    "actual_attempts":x["attempts"],
                    "model_last3":prediction,"league_prior_reference":league,
                    "model_absolute_error":abs(prediction-x["attempts"]),
                    "league_absolute_error":abs(league-x["attempts"]),
                    "feature_max_week":max(h["week"] for h in last),
                    "prior_games_used":[{"week":h["week"],"attempts":h["attempts"]} for h in last]})
        # AFTER all predictions for this week, admit entire week's actuals as history.
        for x in curr:
            if x["attempts"]>=10:prior_starter_values.append(x["attempts"])
            by_player[x["player_id"]].append(x)
    return predictions
def summarize(preds):
    def metrics(items):
        if not items:return {"n":0,"model_mae":None,"league_mae":None,"paired_delta":None}
        n=len(items);m=sum(x["model_absolute_error"] for x in items)/n
        b=sum(x["league_absolute_error"] for x in items)/n
        return {"n":n,"model_mae":m,"league_mae":b,"paired_delta":m-b,
            "last3_beats_league_count":sum(x["model_absolute_error"]<x["league_absolute_error"] for x in items)}
    return {"all_w4_plus":metrics(preds),"by_week":{str(w):metrics([p for p in preds if p["week"]==w])
                for w in sorted(set(p["week"] for p in preds))},
            "week6":metrics([p for p in preds if p["week"]==6])}
def selftest():
    samples=[]
    for w,n in [(1,30),(2,40),(3,10),(4,15)]:
        samples.append({"week":w,"game_id":str(w),"player_id":"qb1","player_name":"A.QB",
             "team":"HOU","attempts":n})
    got=paired_backtest(samples)
    need(len(got)==1,"EXPECTED_ONE_FORECAST")
    need(got[0]["feature_max_week"]==3,"FUTURE_FEATURE_LEAK")
    need(abs(got[0]["model_last3"]-(30+40+10)/3)<1e-9,"HISTORICAL_MEAN")
    different=[dict(s) for s in samples]
    different[-1]["attempts"]=99
    revised=paired_backtest(different)
    need(revised[0]["model_last3"]==got[0]["model_last3"],"TARGET_LABEL_LEAKAGE")
    try:paired_backtest(samples+[dict(samples[0],player_id="qb2")])
    except Exception:pass
    # Rejects classification of no_play even with a stray pass flag.
    need(classify({"play_type":"no_play","pass_attempt":"1","posteam":"HOU"}) is None,"NO_PLAY_LEAK")
    print("ATLAS_NFL_QB_CHRONO_OFFLINE=PASS")
def main():
    if "--self-test" in sys.argv:selftest();return
    req=urllib.request.Request(URL,headers=HEADERS)
    with urllib.request.urlopen(req,timeout=30) as f:b=f.read(9_000_001)
    need(0<len(b)<=9_000_000,"SOURCE_SIZE")
    source_hash=hashlib.sha256(b).hexdigest()
    with gzip.GzipFile(fileobj=io.BytesIO(b)) as z:
        with io.TextIOWrapper(z,encoding="utf-8-sig",newline="") as txt:
            reader=csv.DictReader(txt)
            required={"season","week","game_id","play_id","play_type","pass_attempt","posteam",
             "passer_player_id","passer_player_name"}
            need(required<=set(reader.fieldnames or []),"SOURCE_HEADERS_MISSING")
            rows=[]
            for index,r in enumerate(reader):
                need(index<160000,"ROW_BOUND")
                if str(r.get("season")) in ("2026","2026.0"):
                    rows.append({k:r.get(k) for k in required})
    games,issues,source_attempts=extract(rows)
    need(games,"NO_SOURCE_GAMES")
    preds=paired_backtest(games)
    report=summarize(preds)
    w6=[x for x in preds if x["week"]==6]
    corpus={"schema":"atlas.nfl.qb.pass_attempt_prior_week_baseline.shadow.v1",
        "research_observed_at_utc":datetime.now(timezone.utc).isoformat(),
        "dataset_sha256":source_hash,"source_url":URL,
        "input_weeks":sorted(set(x["week"] for x in games)),
        "source_rows":len(rows),"game_qb_rows":len(games),
        "player_predictions":len(preds),"source_data_issues":issues,
        "source_pass_attempt_counts_by_week":source_attempts,
        "protocol":"PRIOR_WEEKS_ONLY_LAST3_MEAN_VS_LEAGUE_PRIOR_10PLUS_PASSER_BASELINE",
        "eligibility":"TWO_PRIOR_APPEARANCES_AND_LAST_PRIOR_GAME_GE10_PASS_ATTEMPTS",
        "metrics":report,"week6_examples":w6[:50],
        "pre_game_real_timestamped_freeze":False,"past_weeks_available_at_prediction_time_proven":False,
        "actual_future_live_proof":False,"production_authority":False,
        "betting_value_established":False,"calibrator_eligible":False,"odds_credits":0}
    with open("atlas-nfl-chronological-qb-baseline.json","w") as f:
        json.dump(corpus,f,sort_keys=True,indent=2);f.write("\n")
    print("ATLAS_NFL_QB_CHRONO "+json.dumps({"input_weeks":corpus["input_weeks"],
      "game_qb_rows":len(games),"predictions":len(preds),
      "issues":issues,"metrics":report,"sample_w6":w6[:5],
      "pregame_timestamp_verified":False,"dataset_sha256":source_hash},sort_keys=True))
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("ATLAS_NFL_QB_CHRONO_BLOCKED "+str(e),file=sys.stderr)
        sys.exit(1)

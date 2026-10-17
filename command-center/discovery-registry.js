/* ATLAS research census, review-only and device-local. Not a Ledger or betting interface. */
(function(root){
'use strict';
const SCHEMA='atlas.discovery.v1', MAX=5000, MAX_BYTES=8_000_000;
const clone=x=>JSON.parse(JSON.stringify(x));
const str=x=>typeof x==='string'?x.trim():'';
function identity(c){
 const s=c?.scout||c;
 if(!s||!str(s.event)||!str(s.startsAt)||!str(s.market)||!str(s.selection))throw Error('Complete event/time/market/selection required');
 return [s.event,s.startsAt,s.market,s.selection].map(x=>str(x).toLowerCase()).join('|');
}
function empty(){return {schema:SCHEMA,revision:0,records:[],events:[]};}
function validate(db){
 if(!db||db.schema!==SCHEMA||!Array.isArray(db.records)||!Array.isArray(db.events)||db.records.length>MAX||db.events.length>MAX*4)throw Error('Invalid or oversized discovery registry');
 const ids=new Set();
 for(const rec of db.records){
   if(!rec||typeof rec!=='object'||typeof rec.key!=='string'||rec.key!==identity(rec.scout)||ids.has(rec.key)||!Array.isArray(rec.observations)||rec.observations.length>200)throw Error('Invalid or duplicate discovery record');
   ids.add(rec.key);
 }
 if(JSON.stringify(db).length>MAX_BYTES)throw Error('Registry exceeds 8 MB; export and archive before adding more');
 return db;
}
function ingest(db,packet,now=new Date().toISOString()){
 validate(db);
 if(!packet||packet.schema!=='atlas.research.v1'||packet.phase!=='research'||!str(packet.runId)||!Array.isArray(packet.candidates)||packet.candidates.length<1||packet.candidates.length>8)throw Error('Expected one research packet with 1–8 candidates');
 if(!Number.isFinite(Date.parse(now)))throw Error('Invalid observation time');
 const next=clone(db), seen=new Set();
 for(const c of packet.candidates){
   const key=identity(c);if(seen.has(key))throw Error('Duplicate candidate within packet');seen.add(key);
   const source=clone(c.scout);
   const obs={at:now,runId:packet.runId,verify:clone(c.verify||{}),oracle:clone(c.oracle||{}),disposition:'DISCOVERED'};
   let record=next.records.find(r=>r.key===key);
   if(record){record.observations.push(obs);}
   else {record={key,scout:source,firstSeenAt:now,observations:[obs]};next.records.push(record);}
   next.events.push({at:now,runId:packet.runId,key,action:record.observations.length===1?'DISCOVERED':'REOBSERVED'});
 }
 next.revision++;return validate(next);
}
function merge(current,incoming){
 validate(current);validate(incoming);
 const next=clone(current);
 const byKey=new Map(next.records.map(r=>[r.key,r]));
 const eventIds=new Set(next.events.map(e=>JSON.stringify([e.at,e.runId,e.key,e.action])));
 for(const source of incoming.records){
   const existing=byKey.get(source.key);
   if(!existing){
     const record=clone(source);next.records.push(record);byKey.set(record.key,record);
   }else{
     const seen=new Set(existing.observations.map(o=>JSON.stringify(o)));
     for(const observation of source.observations){
       const token=JSON.stringify(observation);
       if(!seen.has(token)){existing.observations.push(clone(observation));seen.add(token);}
     }
     if(source.firstSeenAt<existing.firstSeenAt)existing.firstSeenAt=source.firstSeenAt;
   }
 }
 for(const e of incoming.events){
   const token=JSON.stringify([e.at,e.runId,e.key,e.action]);
   if(!eventIds.has(token)){next.events.push(clone(e));eventIds.add(token);}
 }
 next.revision=Math.max(current.revision,incoming.revision)+1;
 return validate(next);
}
function page(db,{offset=0,limit=50,query=''}={}){
 validate(db);
 if(!Number.isSafeInteger(offset)||offset<0||!Number.isSafeInteger(limit)||limit<1||limit>100)throw Error('Invalid discovery page');
 const q=str(query).toLowerCase();
 const records=db.records.filter(r=>!q||[r.scout.event,r.scout.selection,r.scout.market].some(v=>str(v).toLowerCase().includes(q)));
 return {total:records.length,offset,limit,records:clone(records.slice(offset,offset+limit))};
}
function census(db){
 validate(db);
 const byRun={};
 for(const e of db.events)byRun[e.runId]=(byRun[e.runId]||0)+1;
 return {unique:db.records.length,observations:db.events.length,byRun};
}
function exportJSON(db){validate(db);return JSON.stringify(db,null,2);}
function importJSON(raw){if(typeof raw!=='string'||raw.length>MAX_BYTES)throw Error('Registry import too large');return validate(JSON.parse(raw));}
root.AtlasDiscovery={SCHEMA,empty,validate,identity,ingest,merge,page,census,exportJSON,importJSON};
if(typeof module!=='undefined'&&module.exports)module.exports=root.AtlasDiscovery;
})(typeof globalThis!=='undefined'?globalThis:this);

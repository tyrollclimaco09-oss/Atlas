#!/usr/bin/env node
'use strict';
// Offline stdin -> JSON. --demo uses labeled synthetic data. Never writes a ledger.
const {readFileSync}=require('node:fs');
const {scanOfflineReferencePacket}=require('./market-reference-scanner.cjs');
try{
 const args=process.argv.slice(2);
 if(args.length>1||args.length===1&&args[0]!=='--demo')throw Error('REFERENCE_CLI_ARGUMENTS_INVALID');
 let packet;
 if(args[0]==='--demo')packet=require('./fixtures/reference-snapshot.cjs').packet();
 else{
  const raw=readFileSync(0,'utf8');
  if(Buffer.byteLength(raw,'utf8')>8_000_000)throw Error('REFERENCE_INPUT_TOO_LARGE');
  try{packet=JSON.parse(raw);}catch{throw Error('REFERENCE_INPUT_JSON_INVALID');}
 }
 const result=scanOfflineReferencePacket(packet);
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
 if(['INGESTION_ERROR','VALIDATION_FAILED'].includes(result.status))process.exitCode=1;
}catch(error){
 // Do not print input bytes, URLs, credentials or arbitrary JSON parse errors.
 const code=/^[A-Z_]+$/.test(error.message)?error.message:'REFERENCE_SCAN_FAILED';
 process.stderr.write('ATLAS_OFFLINE_REFERENCE_ERROR: '+code+'\n');process.exitCode=2;
}

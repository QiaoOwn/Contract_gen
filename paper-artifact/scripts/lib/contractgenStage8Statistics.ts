export function statistics8(units:any[]){
  if(units.length!==15||new Set(units.map(u=>`${u.operationId}/${u.arm}`)).size!==15)throw Error('Expected 15 unique units');
  return ['A','B','C','D','E'].map(arm=>{
    const rows=units.filter(u=>u.arm===arm);
    return {arm,planned:rows.length,knownBehavioral:rows.filter(r=>typeof r.behavioralPass==='boolean').length,
      observedPasses:rows.filter(r=>r.behavioralPass===true).length,
      observedFailures:rows.filter(r=>r.behavioralPass===false).length,
      rateAmongKnown:rows.some(r=>typeof r.behavioralPass==='boolean')?rows.filter(r=>r.behavioralPass===true).length/rows.filter(r=>typeof r.behavioralPass==='boolean').length:null,
      logicalCalls:rows.reduce((sum,r)=>sum+(r.cost?.logicalCalls??0),0),
      notEvaluated:rows.filter(r=>r.behavioralPass==null).length,
      errors:['CG-OMISSION','CG-CLAUSE','CG-TARGET','CG-CREATE-USE','CG-PARAMETER','CG-STATE','CG-BRANCH','CG-CONTRACT'].map(id=>({id,status:'NOT_ASSESSED'})),
      performanceClaim:'No rate inferred from missing or Mock observations'};
  });
}
function verdict8(row:any,id:string):boolean|null{
 const witnesses=(row.diagnostics?.business??[]).filter((b:any)=>b.id===id).flatMap((b:any)=>b.observations??[]);
 if(witnesses.some((w:any)=>w.verdict==='witnessed-violation'&&w.evidence?.length))return true;
 if(witnesses.some((w:any)=>w.verdict==='witnessed-satisfied'&&w.evidence?.length))return false;
 return null;
}
export function tables8(terminal:{results:any[];kind:string}){
  const rows=terminal.results;
  const tableA=statistics8(rows).map(summary=>{
    const units=rows.filter(r=>r.arm===summary.arm);
    const measure=(get:(r:any)=>unknown)=>{const values=units.map(get),known=values.filter(v=>typeof v==='boolean');
      return {passed:known.filter(Boolean).length,known:known.length,planned:units.length,notEvaluated:units.length-known.length,rate:known.length?known.filter(Boolean).length/known.length:null};};
    const average=(key:string)=>units.every(r=>typeof r.cost?.[key]==='number')?units.reduce((s,r)=>s+r.cost[key],0)/units.length:null;
    return {...summary,protocol:measure(r=>r.common?.publicProtocolValid),parse:measure(r=>r.common?.evaluation?.syntaxValid),
      type:measure(r=>r.common?.evaluation?.modelTypeValid),preExec:measure(r=>r.common?.evaluation?.preExecValid),
      inputTokensPerOperation:average('inputTokens'),outputTokensPerOperation:average('outputTokens'),callsPerOperation:average('logicalCalls'),latencyMsPerOperation:average('latencyMs')};
  });
  const tableB=[['A','C'],['C','D'],['D','E']].map(([from,to])=>{
    const pairs=rows.filter(r=>r.arm===from).map(a=>({a,b:rows.find(b=>b.arm===to&&b.operationId===a.operationId)}));
    const known=pairs.filter(p=>typeof p.a.behavioralPass==='boolean'&&typeof p.b?.behavioralPass==='boolean');
    const difference=(id:string)=>{const assessed=pairs.map(p=>[verdict8(p.a,id),verdict8(p.b,id)]).filter(v=>v.every(x=>typeof x==='boolean'));
      return {pairedKnown:assessed.length,delta:assessed.length?assessed.reduce((s,v)=>s+Number(v[1])-Number(v[0]),0)/assessed.length:null};};
    return {from,to,pairedKnown:known.length,planned:pairs.length,deltaPass:known.length?known.reduce((s,p)=>s+Number(p.b.behavioralPass)-Number(p.a.behavioralPass),0)/known.length:null,
      deltaOmission:difference('CG-OMISSION'),deltaTarget:difference('CG-TARGET'),deltaState:difference('CG-STATE'),interpretation:from==='C'?'B/R joint contribution':'Descriptive pilot contrast; no statistical inference'};
  });
  const tableC=['A','B','C','D','E'].map(arm=>({arm,categories:['CG-OMISSION','CG-CLAUSE','CG-TARGET','CG-CREATE-USE','CG-PARAMETER','CG-STATE','CG-BRANCH','CG-CONTRACT'].map(id=>{
    const evidence=rows.filter(r=>r.arm===arm).flatMap(r=>r.diagnostics?.business?.filter((b:any)=>b.id===id).flatMap((b:any)=>b.observations)??[]);
    const values=rows.filter(r=>r.arm===arm).map(r=>verdict8(r,id)),known=values.filter(v=>typeof v==='boolean');
    return {id,evidence,denominator:values.length,assessed:known.length,violations:known.filter(Boolean).length,notAssessed:values.length-known.length,status:known.length?'FINITE_WITNESSES':'NOT_ASSESSED'};
  })}));
  return {kind:terminal.kind,mockPerformanceMustNotBeReported:terminal.kind==='MOCK_INTERFACE_ONLY',tableA,tableB,tableC};
}

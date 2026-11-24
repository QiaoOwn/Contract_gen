import json
from pathlib import Path
from collections import Counter
r=Path(__file__).resolve().parents[2]
def load(p): return json.loads((r/p).read_text(encoding="utf-8-sig"))
report={"RQ1":[],"RQ2_summary_check":load("paper-experiment-data/RQ2/statistics.json"),"RQ3":[]}
for row in load("paper-experiment-data/RQ1/statistics.json")["rows"]:
    ops=row["operations"]; assert len(ops)==len({x["operationId"] for x in ops})==114
    counts={k:sum(x.get(k) is True for x in ops) for k in ["syntaxValid","preExecValid","behaviorPassed"]}
    report["RQ1"].append({"method":row["method"],"denominator":114,**counts})
records=load("paper-experiment-data/RQ3/unified-data-v1/records.json")
for method in sorted({x["method"] for x in records}):
    rows=[x for x in records if x["method"]==method]; assert len(rows)==len({x["sampleId"] for x in rows})==68
    report["RQ3"].append({"method":method,"denominator":68,"contexts":len({x["operationId"] for x in rows}),**{k:sum(x.get(k) is True for x in rows) for k in ["preExec","methodAccepted","acceptedOraclePassed"]}})
report["RQ3_paired_behavior"]={}
groups={m:{x["sampleId"]:x["acceptedOraclePassed"] for x in records if x["method"]==m} for m in {x["method"] for x in records}}
for m,g in groups.items():
    report["RQ3_paired_behavior"][m]=dict(Counter(str((groups["ContractGenRepair"][k],v)) for k,v in g.items()))
print(json.dumps(report,indent=2))

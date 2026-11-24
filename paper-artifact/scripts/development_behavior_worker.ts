import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {formatStructuredRequirement,getBenchmarkRequirement} from '../src/rm2pt/benchmarkRequirements';
import {narrativeDevelopmentProfile} from '../src/app/service/developmentBehavior/narrativeDevelopmentProfiles';
import {
  developmentRegistry,
  runRegisteredDevelopment,
  verifyDevelopmentSources,
} from '../src/app/service/developmentBehavior/registry';

async function main() {
  const [candidate, output, requirementFile, operationId] = process.argv.slice(2);
  if (!candidate || !output || !requirementFile || !operationId)
    throw new Error(
      'Expected candidate module, report path, actual generation requirement and registered operation id'
    );
  const registration = developmentRegistry.require(operationId);
  verifyDevelopmentSources(registration);
  const OriginalDate = Date;
  const epoch = OriginalDate.parse(registration.fixedClock);
  globalThis.Date = new Proxy(OriginalDate, {
    construct(target, argumentsList) {
      return Reflect.construct(target, argumentsList.length ? argumentsList : [epoch]);
    },
    apply() {
      return new OriginalDate(epoch).toString();
    },
    get(target, key) {
      return key === 'now' ? () => epoch : Reflect.get(target, key);
    },
  });
  try {
    const module = await import(pathToFileURL(candidate).href);
    const actualRequirement=fs.readFileSync(requirementFile,'utf8');
    const profile=narrativeDevelopmentProfile(operationId,actualRequirement);
    if(profile&&(profile.obligations.length!==registration.obligations.length||profile.obligations.some(o=>!registration.obligations.some(r=>r.id===o.id&&r.clause===o.clause))))
      throw Error('Public Narrative mapping does not match registered source obligations');
    // Older scenario modules verify their registered Structured source text. This
    // evaluation-only view never changes the actual Narrative sent to the model.
    let handlerRequirement=actualRequirement;
    let report;
    try{report=await runRegisteredDevelopment(registration,module,actualRequirement);}
    catch(error){
      // Retry only the legacy source-text admission guard, never a candidate
      // execution failure or a source/model verification error.
      if(!profile||!(error instanceof Error)||!/(?:requirement|input).*differs/i.test(error.message))throw error;
      handlerRequirement=formatStructuredRequirement(getBenchmarkRequirement(registration.project,registration.useCase,registration.operation));
      report=await runRegisteredDevelopment(registration,module,handlerRequirement);
    }
    fs.writeFileSync(output, JSON.stringify({...report,inputAlignment:{
      actualNarrativeSha256:createHash('sha256').update(actualRequirement).digest('hex'),
      profileVersion:profile?.profileVersion??null,
      handlerView:handlerRequirement===actualRequirement?'actual-generation-requirement':'registered-source-evaluation-view',
      modelInputChanged:false,
    }}, null, 2) + '\n');
  } finally {
    globalThis.Date = OriginalDate;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

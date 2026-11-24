import profiles from '../../../../config/narrative-development-profiles-v1.json';
import extensions from '../../../../config/narrative-development-profile-extensions-v1.json';
import approved from '../../../../data/narrative_v4_114_20261121/public-profiles.json';
import {ccHash} from '../crossClauseGraph';

export function narrativeDevelopmentProfile(operationId:string,requirement:string){
 const profile=[...profiles.profiles,...extensions.profiles,...approved.profiles].find(p=>p.operationId===operationId&&p.requirement===requirement);
 if(!profile||profile.requirement!==requirement)return null;
 const obligations=profile.obligations.map(o=>{
  const start=profile.requirement.indexOf(o.text);
  if(start<0||profile.requirement.indexOf(o.text,start+1)>=0)throw Error('Ambiguous public requirement span');
  return {...o,start,end:start+o.text.length};
 });
 return {...profile,obligations,profileVersion:profiles.profiles.includes(profile as any)?profiles.version:extensions.profiles.includes(profile as any)?extensions.version:approved.version,sourceHash:ccHash(profile.requirement),
  provenance:'author-compiled-public-narrative-obligation-spans' as const};
}

import fs from 'node:fs';
import {parse as parseEnv} from 'dotenv';
import {read} from './lib/m4LiveAdapter';
import {preview6, authorize6, execute6, httpTransport6} from './lib/contractgenStage6';

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(['--preview', '--output', '--execute-paid', '--authorization']);
  for (let i = 0; i < args.length; i++) {
    if (!allowed.has(args[i])) throw new Error(`Unsupported option: ${args[i]}`);
    if (args[i] !== '--execute-paid') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Missing option value');
      i++;
    }
  }
  const value = (name: string, fallback = '') => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
  const output = value('--output', 'results/contractgen-stage6a-preview-v1');
  if (!args.includes('--execute-paid')) {
    if (args.includes('--authorization')) throw new Error('Authorization is not an execution switch');
    console.log(JSON.stringify(await preview6(output))); return;
  }
  const preview = value('--preview'), authFile = value('--authorization');
  if (!preview || !authFile) throw new Error('Paid mode requires frozen preview AND new authorization');
  const env = {...(fs.existsSync('.env') ? parseEnv(fs.readFileSync('.env')) : {}),
    ...(fs.existsSync('.env.local') ? parseEnv(fs.readFileSync('.env.local')) : {}), ...process.env};
  const endpoint = env.OPENAI_BASE_URL, apiKey = env.OPENAI_API_KEY || env.API_KEY;
  if (!endpoint || !apiKey) throw new Error('Missing endpoint/key; no probe sent');
  const authorization = read(authFile), identity = authorize6(preview, output, authorization, endpoint);
  const transport = httpTransport6(endpoint, apiKey, identity.sampling);
  console.log(JSON.stringify(await execute6(preview, output, transport, false, {authorization, endpoint})));
}
main().catch(error => {console.error(String(error)); process.exitCode = 1;});

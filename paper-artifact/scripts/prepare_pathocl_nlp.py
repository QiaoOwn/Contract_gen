"""Freeze PathOCL's source-only spaCy terms; never read contracts or Oracles."""
import hashlib
import json
from pathlib import Path

import spacy

ROOT = Path('data/narrative_v3_114/generation')
OUT = Path('results/pathocl-nlp-v1/terms.json')


def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()


def main():
    if OUT.exists():
        raise RuntimeError('Fresh NLP artifact required; do not overwrite frozen terms')
    rows = [json.loads(line) for line in (ROOT / 'requirements.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
    assert len(rows) == 114
    models = {r['operationId']: json.loads((ROOT / 'models' / r['operationId'] / 'typed-model.json').read_text(encoding='utf-8')) for r in rows}
    names = sorted({name for m in models.values() for e in m['index']['entities'] for name in [e['name'], *[f['name'] for f in e['features']]]})
    nlp = spacy.load('en_core_web_sm')
    identifiers = {}
    for name, doc in zip(names, nlp.pipe(names)):
        identifiers[name] = sorted({t.lemma_.lower() for t in doc if not t.is_space and not t.is_punct})
    records = {}
    for row, doc in zip(rows, nlp.pipe([r['description'] for r in rows])):
        tokens = [{'text': t.text, 'pos': t.pos_, 'lemma': t.lemma_.lower(), 'start': t.idx, 'end': t.idx + len(t.text)}
                  for t in doc if t.pos_ in {'NOUN', 'ADJ'}]
        records[row['operationId']] = {'queryTerms': sorted({t['lemma'] for t in tokens}), 'tokens': tokens,
                                      'requirementSha256': hashlib.sha256(row['description'].encode()).hexdigest()}
    data = {'version': 'pathocl-spacy-terms-v1', 'scriptSha256': sha(__file__), 'inputSha256': sha(ROOT / 'requirements.jsonl'),
            'modelsSha256': {id: sha(ROOT / 'models' / id / 'typed-model.json') for id in models},
            'nlp': {'library': 'spacy', 'version': spacy.__version__, 'model': 'en_core_web_sm', 'modelVersion': nlp.meta['version'],
                    'queryPos': ['NOUN', 'ADJ'], 'properties': 'Lemma sets of class, attribute and selected next-edge role names; no types or cardinality'},
            'identifierLemmas': identifiers, 'records': records}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open('x', encoding='utf-8') as file:
        json.dump(data, file, ensure_ascii=True, indent=2)
    print(json.dumps({'operations': len(records), 'identifiers': len(identifiers), 'output': str(OUT), 'realModelCalls': 0}))


if __name__ == '__main__':
    main()

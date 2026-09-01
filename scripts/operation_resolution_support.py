"""Explicit, source-pinned resolution overlays and versioned oracle copies."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'data/operation_revision'


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_utf8_lf(path, content):
    """Write generated source byte-stably on Windows and Unix."""
    path.write_bytes(content.replace('\r\n', '\n').encode('utf-8'))


def resolution_path(project, use_case):
    return WORK / 'resolutions' / project / (use_case + '.json')


def load_resolution(source):
    parts = Path(source['source']['path']).parts
    project, use_case = parts[-2], Path(parts[-1]).stem
    path = resolution_path(project, use_case)
    if not path.exists():
        return None
    return load_entry(path, source['name'], set())


def load_entry(path, name, seen):
    key = (str(path), name)
    if key in seen:
        raise ValueError('Resolution alias cycle')
    seen.add(key)
    entry = json.loads(path.read_text(encoding='utf-8')).get(name)
    if entry and 'reuse_resolution' in entry:
        project, use_case, operation = entry['reuse_resolution']
        return load_entry(resolution_path(project, use_case), operation, seen)
    return entry


def upstream_reference(source, resolution):
    item = resolution.get('upstream')
    if not item:
        return None
    manifest = json.loads((WORK / 'upstream_rm2pt/manifest.json').read_text(encoding='utf-8'))
    pinned = next(p for p in manifest['files'] if p['path'] == item['path'])
    path = ROOT / item['path']
    if checksum(path) != pinned['sha256']:
        raise ValueError('Upstream snapshot changed')
    text = path.read_text(encoding='utf-8')
    if item['quote'] not in text or ('::' + source['name'] + '(') not in item['quote']:
        raise ValueError('Upstream operation evidence mismatch')
    return {**pinned, 'quote': item['quote'],
            'start_line': text[:text.index(item['quote'])].count('\n') + 1,
            'assessment': resolution['assessment'],
            'scope': 'Pinned original formal specification; embedded RM2DOC prose is generated from that specification, not independent human NL evidence'}


def apply_resolution(annotation, source):
    resolution = load_resolution(source)
    if not resolution:
        return annotation
    upstream_reference(source, resolution)
    allowed = {'status', 'reference_accepted', 'intent', 'pre', 'post', 'features', 'difficulty',
               'difficulty_basis', 'missing', 'conflicts', 'description_audit', 'reference_audit',
               'effects_audit', 'scenarios', 'review_findings'}
    updates = resolution.get('updates', {})
    if set(updates) - allowed:
        raise ValueError('Resolution cannot edit metadata or arbitrary annotation fields')
    revised = copy.deepcopy(annotation)
    revised.update(updates)
    revised['resolution'] = resolution
    revised['previous_issues'] = annotation.get('missing', []) + annotation.get('conflicts', [])
    if resolution.get('oracle_edits'):
        assessments = resolution['scenario_assessments']
        if len(assessments) != len(revised['scenarios']):
            raise ValueError('Audit every revised oracle scenario')
        revised['scenarios'] = [[kind, targets, assessment]
                                for (kind, targets, _), assessment in zip(revised['scenarios'], assessments)]
    return revised


def oracle_content(source, resolution):
    text = (ROOT / source['test_path']).read_text(encoding='utf-8')
    for edit in resolution['oracle_edits']:
        if not edit['reason'] or text.count(edit['before']) != edit.get('count', 1):
            raise ValueError('Oracle patch does not match its reviewed source: ' + edit['before'])
        text = text.replace(edit['before'], edit['after'])
    if resolution.get('set_assertions'):
        text = "import {expectSameMembers} from '../helpers/setOracle';\n" + text
    return text


def materialize_oracle(source, resolution):
    if not resolution.get('oracle_edits'):
        return None
    folder = WORK / 'oracles_v2' / Path(source['test_path']).parent.name
    folder.mkdir(parents=True, exist_ok=True)
    content = oracle_content(source, resolution)
    write_utf8_lf(folder / 'index.test.ts', content)
    entry = Path(source['test_path']).with_name('entry').as_posix()
    write_utf8_lf(folder / 'entry.ts', "// Existing implementation, used only for oracle regression checks.\nexport * from '../../../../" + entry + "';\n")
    return folder / 'index.test.ts'


def check_oracle(source, resolution):
    path = WORK / 'oracles_v2' / Path(source['test_path']).parent.name / 'index.test.ts'
    if path.read_text(encoding='utf-8') != oracle_content(source, resolution):
        raise ValueError('V2 oracle differs from the reviewed patch')
    return path


if __name__ == '__main__':
    import argparse
    import revise_operations_v2 as revision
    parser = argparse.ArgumentParser(description='Apply one fully reviewed use case and its V2 oracle patches')
    parser.add_argument('--project', required=True)
    parser.add_argument('--use-case', required=True)
    args = parser.parse_args()
    for source in revision.sources(args.project, args.use_case)['operations']:
        resolution = load_resolution(source)
        if resolution:
            upstream_reference(source, resolution)
            materialize_oracle(source, resolution)
    revision.apply_group(args.project, args.use_case, refresh=True)

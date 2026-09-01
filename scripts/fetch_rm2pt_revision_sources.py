"""Download unmodified, commit-pinned official sources for offline annotation."""
import hashlib
import json
from pathlib import Path
import urllib.request

COMMIT = "3c08c41dc8671f857169e82cce662a075a306aa3"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/operation_revision/upstream_rm2pt"
FILES = {
    "Airport": ("AirMS/RequirementsModel/airms.remodel", "AirMS/Document/RequirementDocument.md"),
    "AutomatedTellerMachine": ("ATM/RequirementsModel/atm.remodel", "ATM/Document/RequirementDocument.md"),
    "CoCoME": ("CoCoME/RequirementsModel/cocome.remodel", "CoCoME/Document/RequirementDocument.md"),
    "LibraryManagementSystem": ("LibraryMS/Requirementmodel/library.remodel", "LibraryMS/Document/RequirementDocument.md"),
    "LoanProcessingSystem": ("LoanPS/requirementmodel/loan.remodel", "LoanPS/Document/RequirementDocument.md"),
}


def main():
    records = []
    for project, paths in FILES.items():
        for remote in paths:
            url = f"https://raw.githubusercontent.com/RM2PT/CaseStudies/{COMMIT}/{remote}"
            with urllib.request.urlopen(url, timeout=60) as response:
                data = response.read()
            path = OUT / project / Path(remote).name
            path.parent.mkdir(parents=True, exist_ok=True)
            if path.exists() and path.read_bytes() != data:
                raise ValueError(f"Refusing to replace a different upstream snapshot: {path}")
            path.write_bytes(data)
            records.append({"project": project, "path": path.relative_to(ROOT).as_posix(),
                            "remote_path": remote, "url": url, "commit": COMMIT,
                            "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)})
            print(project, Path(remote).name, len(data), flush=True)
    (OUT / "manifest.json").write_text(json.dumps({"repository": "https://github.com/RM2PT/CaseStudies",
        "commit": COMMIT, "files": records, "license_note": "Retained upstream authorship; no new license grant or independent semantic certification inferred."}, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

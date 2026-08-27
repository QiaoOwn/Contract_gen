#!/usr/bin/env python3
"""Build a deterministic, secret-checked Zenodo artifact archive."""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import re
import subprocess
import sys
import zipfile
from pathlib import Path, PurePosixPath


SECRET_PATTERNS = {
    "OpenAI-style token": re.compile(rb"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "assigned API key": re.compile(
        rb"(?i)\bapi[_-]?key\b\s*[:=]\s*['\"]?[A-Za-z0-9._-]{16,}"
    ),
    "bearer token": re.compile(rb"(?i)\bbearer\s+[A-Za-z0-9._-]{20,}"),
    "private key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
}

SENSITIVE_NAMES = {
    ".env",
    ".env.local",
    "id_rsa",
    "id_ed25519",
    "credentials.json",
}

TEXT_SCAN_LIMIT = 20 * 1024 * 1024
FIXED_ZIP_TIME = (2020, 1, 1, 0, 0, 0)


def run_git(root: Path, *args: str) -> list[str]:
    completed = subprocess.run(
        ["git", *args],
        cwd=root,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return [
        line.decode("utf-8", errors="surrogateescape")
        for line in completed.stdout.split(b"\0")
        if line
    ]


def load_ignore_patterns(path: Path) -> list[str]:
    patterns: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#"):
            patterns.append(line.replace("\\", "/"))
    return patterns


def matches_pattern(path: str, pattern: str) -> bool:
    normalized = path.lstrip("./")
    pattern = pattern.lstrip("./")
    if pattern.endswith("/"):
        prefix = pattern.rstrip("/")
        return normalized == prefix or normalized.startswith(prefix + "/")
    if "/" not in pattern:
        return any(fnmatch.fnmatch(part, pattern) for part in normalized.split("/"))
    return fnmatch.fnmatch(normalized, pattern) or PurePosixPath(normalized).match(pattern)


def collect_files(root: Path, patterns: list[str]) -> list[Path]:
    tracked = run_git(root, "ls-files", "-z")
    untracked = run_git(root, "ls-files", "--others", "--exclude-standard", "-z")
    selected: list[Path] = []
    for relative in sorted(set(tracked + untracked)):
        normalized = relative.replace("\\", "/")
        source = root / relative
        if not source.is_file():
            continue
        if any(matches_pattern(normalized, pattern) for pattern in patterns):
            continue
        selected.append(source)
    return selected


def scan_for_secrets(root: Path, files: list[Path]) -> list[str]:
    findings: list[str] = []
    for source in files:
        relative = source.relative_to(root).as_posix()
        lower_name = source.name.lower()
        if lower_name in SENSITIVE_NAMES or lower_name.startswith(".env."):
            findings.append(f"sensitive filename: {relative}")
            continue
        if source.stat().st_size > TEXT_SCAN_LIMIT:
            continue
        data = source.read_bytes()
        if b"\x00" in data[:8192]:
            continue
        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(data):
                findings.append(f"{label}: {relative}")
    return findings


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_archive(root: Path, files: list[Path], output: Path, prefix: str) -> None:
    manifest_lines = []
    for source in files:
        relative = source.relative_to(root).as_posix()
        manifest_lines.append(f"{sha256(source)}  {relative}")

    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for source in files:
            relative = source.relative_to(root).as_posix()
            info = zipfile.ZipInfo(f"{prefix}/{relative}", FIXED_ZIP_TIME)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o100644 & 0xFFFF) << 16
            archive.writestr(info, source.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

        manifest = "\n".join(manifest_lines) + "\n"
        info = zipfile.ZipInfo(f"{prefix}/SHA256SUMS", FIXED_ZIP_TIME)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = (0o100644 & 0xFFFF) << 16
        archive.writestr(info, manifest.encode("utf-8"), compress_type=zipfile.ZIP_DEFLATED)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", default="0.9.0", help="Artifact version")
    parser.add_argument("--output-dir", default="release", help="Output directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate without writing a ZIP")
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    ignore_file = root / ".artifactignore"
    if not ignore_file.exists():
        print("ERROR: .artifactignore is missing", file=sys.stderr)
        return 2

    files = collect_files(root, load_ignore_patterns(ignore_file))
    findings = scan_for_secrets(root, files)
    if findings:
        print("ERROR: possible secrets detected; archive was not created:", file=sys.stderr)
        for finding in findings:
            print(f"  - {finding}", file=sys.stderr)
        return 3

    total_bytes = sum(path.stat().st_size for path in files)
    print(f"Selected files: {len(files)}")
    print(f"Uncompressed size: {total_bytes / (1024 * 1024):.2f} MiB")
    print("Secret scan: passed")
    if args.dry_run:
        return 0

    version = args.version.removeprefix("v")
    name = f"ContractGen-artifact-v{version}"
    output = root / args.output_dir / f"{name}.zip"
    build_archive(root, files, output, name)
    digest = sha256(output)
    checksum_path = output.with_suffix(output.suffix + ".sha256")
    checksum_path.write_text(f"{digest}  {output.name}\n", encoding="ascii")
    print(f"Archive: {output}")
    print(f"Archive size: {output.stat().st_size / (1024 * 1024):.2f} MiB")
    print(f"SHA-256: {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

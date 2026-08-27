# Zenodo Pre-Submission Checklist

This guide freezes the ContractGen replication package for archival on Zenodo.
The canonical experiment snapshot is `results/contractgen-study-v6/`.

## 1. Complete scholarly metadata

Before creating a public release:

1. Choose and add the project license. Do not reuse the license of bundled
   third-party software as the license of ContractGen.
2. Copy `.zenodo.json.example` to `.zenodo.json` and replace every placeholder.
3. Copy `CITATION.cff.example` to `CITATION.cff` and replace every placeholder.
4. List creators in paper-author order and add validated ORCID and affiliation
   data where available.
5. Add the paper DOI later as a related identifier with the relation
   `isSupplementTo` or `isDocumentedBy`, as appropriate.

The GitHub repository is public. Never commit `.env`, API keys, provider URLs
containing credentials, private prompts, or reviewer-only correspondence.

## 2. Freeze and validate the snapshot

Run the project checks documented in `ARTIFACT_README.md`, then inspect the Git
working tree. Commit only the intended source, benchmark, documentation, and
canonical v6 results. Tag the exact commit used for the Zenodo record.

Validate the planned archive without writing it:

```powershell
python script/build_zenodo_archive.py --version 0.9.0 --dry-run
```

Build the upload bundle:

```powershell
python script/build_zenodo_archive.py --version 0.9.0
```

The command creates:

- `release/ContractGen-artifact-v0.9.0.zip`
- `release/ContractGen-artifact-v0.9.0.zip.sha256`

The ZIP contains a `SHA256SUMS` inventory for all archived files. The builder
stops if it sees sensitive filenames or common credential patterns.
The bundled USE 7.5.0 third-party distribution is excluded; its version and
installation requirements remain documented in `ARTIFACT_README.md`.

## 3. Create the Zenodo draft

1. Sign in to Zenodo and create a new upload.
2. Select **Software** as the resource type.
3. Upload the ZIP and its external `.sha256` file.
4. Enter the title, creators, description, version, language, keywords, license,
   and the GitHub URL from `.zenodo.json`.
5. Reserve a DOI while the record is still a draft if the DOI must appear in the
   manuscript or artifact documentation.
6. Save and preview the draft. Do not press **Publish** until the archive,
   metadata, author order, license, and access policy have been checked.

For submission-time review, keeping the record as an unpublished draft avoids
freezing a premature public version. If a citable but non-public-file record is
required, Zenodo also supports restricted files; the record metadata remains
public after publication.

## 4. Final publication and versioning

At the submission or acceptance milestone chosen by the authors:

1. Record the Git commit and tag in the description or release notes.
2. Publish the Zenodo record to register the version DOI.
3. Add the DOI badge and citation to the repository and manuscript.
4. For later substantive changes, create a new Zenodo version instead of
   replacing the archived experiment files.

## Recommended description

> This replication package accompanies "Contract Gen: Verification-Driven OCL
> Contract Generation." It contains the ContractGen implementation, the frozen
> 114-instance operation benchmark, prompts and transformation rules, experiment
> runners, canonical raw outputs, analysis tables, and differential-validation
> materials used to support RQ1-RQ3. Reproduction scope and known limitations are
> documented in ARTIFACT_README.md and ARTIFACT_MANIFEST.md.

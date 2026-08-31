# Custom Contribution Calendar — Setup

Repository target:
`mhmadrezapahlevi/mhmadrezapahlevi`

## 1. Upload these files

Copy these paths into the profile repository:

- `scripts/generate-calendar.mjs`
- `.github/workflows/contribution-calendar.yml`

## 2. Commit to `main`

Do not create the `output` branch manually. The workflow will create/update it.

## 3. Run the workflow

Open GitHub → Actions → Generate Contribution Calendar → Run workflow.

The workflow should finish with all steps green and create/update:

`output/github-contribution-calendar.svg`

## 4. Add the README snippet

Paste the contents of `README-snippet.md` into your profile README.

## Notes

The generator uses GitHub GraphQL `contributionsCollection.contributionCalendar` and builds a static SVG. The repository's `GITHUB_TOKEN` is used only inside Actions. Public contribution data works without creating another personal access token. Private/internal contribution counts may require a token with additional user scope; this template intentionally avoids asking you to store a personal token.

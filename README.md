<h1 align="center">🎈 up</h1>
<p align="center">
  Pretty simple, opinionated CLI command to bump versions with a focus on monorepos.
</p>

```sh
pnpm add -DW @robdvins/up
```

## What it does

- Fetch tags locally.
- Select new version for each modified package.
- Update packages that rely on each other.

## Usage

```json
{
  "scripts": {
    "release": "up -w"
  }
}
```

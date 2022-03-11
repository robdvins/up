import path from 'path'
import fs from 'fs-extra'
import fg from 'fast-glob'
import { hasModifiedFolder } from './git'

export interface PackageMeta {
  name: string
  version: string
  // Absolute filepath.
  filepath: string
  // Relative filepath to the root project.
  relative: string
  hasChanges: boolean
  // Raw package.json Object.
  raw: Record<string, any>
  // Other packages that depend on this.
  dependents: PackageMeta[]
}

export async function loadPackage(relative: string): Promise<PackageMeta> {
  const filepath = path.resolve(process.cwd(), relative)
  const raw = await fs.readJson(filepath)

  return {
    name: raw.name,
    version: raw.version,
    filepath,
    relative,
    hasChanges: await hasModifiedFolder(path.dirname(relative)),
    raw,
    dependents: []
  }
}

export async function loadModifiedPackages() {
  const packagesPaths = await fg('./**/*/package.json', {
    onlyFiles: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/public/**']
  })

  const packages = await Promise.all(packagesPaths.map((relative) => loadPackage(relative)))
  buildDependencyGraph(packages)
  return packages.filter((pkg) => pkg.hasChanges)
}

function buildDependencyGraph(packages: PackageMeta[]) {
  for (const pkg of packages) {
    pkg.dependents = packages.filter((p) => p.raw.dependencies?.[pkg.name] || p.raw.devDependencies?.[pkg.name])
  }
}

function updateDependent(dependent: PackageMeta, type: string, pkg: PackageMeta) {
  const deps = dependent.raw[type]
  if (!deps) return
  if (!deps[pkg.name]) return

  deps[pkg.name] = pkg.version
}

export function updatePackagesVersion(packages: PackageMeta[], versions: Record<string, string>) {
  for (const pkg of packages) {
    pkg.raw.version = versions[pkg.name]

    pkg.dependents.forEach((p) => {
      updateDependent(p, 'dependencies', pkg)
      updateDependent(p, 'devDependencies', pkg)
    })
  }
}

export function writePackage(pkg: PackageMeta) {
  const { filepath, raw, dependents } = pkg
  return [
    fs.writeJson(filepath, raw, { spaces: 2 }),
    ...dependents.map((dept) => fs.writeJson(dept.filepath, dept.raw, { spaces: 2 }))
  ]
}

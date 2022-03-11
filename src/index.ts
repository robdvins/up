import fs from 'fs-extra'
import pc from 'picocolors'
import prompts from 'prompts'
import semver from 'semver'
import { hasUntrackedFiles, isOutdated } from './git'
import { loadModifiedPackages, PackageMeta, updatePackagesVersion, writePackage } from './packages'
import { isEmptyArray, terminate } from './utils'

export interface CommandOptions {
  branch: string
  write: boolean
}

async function packageSelection(packages: PackageMeta[]) {
  const response = await prompts(
    {
      type: 'multiselect',
      name: 'value',
      message: 'The following packages have been modified, which ones do you want to upgrade?',
      choices: packages.map((pkg) => ({
        title: pkg.name,
        value: pkg
      })),
      instructions: false,
      hint: '- Space to select. Return to submit'
    },
    { onCancel: () => terminate('Aborted!') }
  )

  return response.value as PackageMeta[]
}

async function versionSelection(packages: PackageMeta[]) {
  const types: semver.ReleaseType[] = ['major', 'minor', 'patch']

  const versions = (oldVersion: string) =>
    types.reduce((obj, type) => {
      obj[type] = semver.inc(oldVersion, type) ?? ''
      return obj
    }, {} as Record<semver.ReleaseType, string>)

  const responses = await prompts(
    packages.map((pkg) => ({
      type: 'select',
      name: pkg.name,
      message: `Select new version for ${pc.cyan(pkg.name)}`,
      choices: types.map((type) => ({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} (${versions(pkg.version)[type]})`,
        value: versions(pkg.version)[type]
      }))
    })),
    { onCancel: () => terminate('Aborted!') }
  )

  return responses as Record<string, string>
}

export async function up(opts: CommandOptions) {
  // Git checks
  // Check for git repo.
  if (!fs.pathExistsSync('.git')) terminate('Git not initialized! 😢')
  // Check for untracked files.
  if (!(await hasUntrackedFiles())) terminate('Untracked files present.')
  // Check if branch is outdated with remote.
  if (await isOutdated(opts.branch)) terminate('Git branch is not in sync with remote.')

  // Prompts
  const packages = await loadModifiedPackages()
  if (isEmptyArray(packages)) terminate('No packages to update.')
  const selectedPackages = await packageSelection(packages)
  if (isEmptyArray(selectedPackages)) terminate('No packages selected.')
  const versions = await versionSelection(selectedPackages)

  let dependentsMsg = ''
  let finalMsg = ''

  if (!opts.write) {
    dependentsMsg = 'for upgrading to'
    finalMsg = `Run ${pc.magenta('up -w')} to write package.json files.\n`
  } else {
    dependentsMsg = 'upgraded to'
    finalMsg = `${pc.magenta('Changes wrote to package.json files.')}\n`
    updatePackagesVersion(selectedPackages, versions)
    await Promise.all(selectedPackages.flatMap((pkg) => writePackage(pkg)))
  }

  console.log('')
  selectedPackages.forEach(({ name, version, relative, dependents }) => {
    console.log(`${pc.cyan(name)} ${pc.gray(relative)}`)
    console.log(`  ${pc.gray(version + '  →')}  ${versions[name]}`)
    console.log(`  ${pc.yellow(dependents.length)} ${pc.gray(`dependents ${dependentsMsg} ${versions[name]}`)}\n`)
  })
  console.log(finalMsg)
}

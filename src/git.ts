import { execa } from 'execa'

export async function hasUntrackedFiles() {
  return !!(await execa('git', ['status', '--porcelain'])).stdout
}

export async function isOutdated(branch: string) {
  const outdatedRegex = new RegExp(`Your branch is ahead of 'origin/${branch}'`, 'i')
  return outdatedRegex.test((await execa('git', ['status', '-uno'], { stdio: 'pipe', shell: true })).stdout)
}

export async function hasModifiedFolder(folder: string) {
  const lastTag = await getLastTag()
  if (!lastTag) return true

  const { stdout: hasChanges } = await execa('git', ['diff', lastTag, '--', folder], { stdio: 'pipe' })
  return !!hasChanges
}

export async function getLastTag() {
  try {
    const { stdout: lastTag } = await execa('git', ['describe', '--tags', '--abbrev=0'], { stdio: 'pipe' })
    return lastTag
  } catch (error) {
    return null
  }
}

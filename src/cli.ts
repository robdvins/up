import { createRequire } from 'module'
import sade from 'sade'
import { CommandOptions, up } from './index'

const require = createRequire(import.meta.url)

const program = sade('up', true)

program
  .version(require('../package.json').version)
  .describe('Update version from modified packages.')
  .option('-b, --branch', 'Checks the expected branch for versioning.', 'main')
  .option('-w, --write', 'Write package.json files.', false)
  .action((opts: CommandOptions) => up(opts))

program.parse(process.argv)

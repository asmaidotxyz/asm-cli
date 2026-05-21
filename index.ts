import { program } from 'commander';
import { VERSION } from './constants';
import { installHandler } from './handlers';

program.
  name('my-cli')
  .description('A simple CLI tool')
  .version(VERSION);

program.command('learn')
  .description('Learn something new')
  .argument('<param>', 'topic to learn about')
  .action(installHandler);

program.parse()

import { program } from 'commander';
import { VERSION } from './constants';
import { learnHandler } from './handlers';

program.
  name('my-cli')
  .description('A simple CLI tool')
  .version(VERSION);

program.command('learn')
  .description('Learn something new')
  .argument('<param>', 'topic to learn about')
  .action(learnHandler);

program.parse()

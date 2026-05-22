import { program } from 'commander';
import { VERSION } from './constants';
import { searchHandler, setupHandler, installHandler } from './handlers';

program.
  name('aiasm')
  .description('A simple CLI tool')
  .version(VERSION);

program.command('setup')
  .description('Set up Agent Skill Management')
  .action(setupHandler);

program.command('search')
  .description('Search skill matches for a given topic')
  .argument('<param>', 'keywords')
  .action(searchHandler);

program.command('install')
  .description('Install a skill by name')
  .argument('<param>', 'skill name')
  .action(installHandler);


program.parse()

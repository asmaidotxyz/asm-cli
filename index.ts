import { program } from 'commander';
import { VERSION } from './constants';
import { searchHandler, setupHandler, installHandler } from './handlers';

const checkNewVersion = async () => {
  try {
    const response = await fetch('https://registry.npmjs.org/aiasm/latest');
    const data: any = await response.json();
    if (data.version !== VERSION) {
      console.log(`A new version of aiasm is available: ${data.version}. Run 'npm install -g aiasm' to update.`);
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
  }
};

const main = async () => {
  await checkNewVersion();

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
}

main()


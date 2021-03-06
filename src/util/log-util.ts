import { ChildProcess, spawn } from 'child_process';
import { addCommits, clearLog, updateStatus } from '../state/action-creators';
import { store } from '../state/store';
import { Screen, Status } from '../types/types';
import { GIT_LOG_ARGS, stash } from './stash';
import { searchIndex } from './search';

let gitLogProcess: ChildProcess;

export const generateLog = (screen: Screen) => {
	if (gitLogProcess) {
		gitLogProcess.stdout.removeAllListeners();
		gitLogProcess.stderr.removeAllListeners();
		gitLogProcess.removeAllListeners();

		gitLogProcess.kill();
	}

	searchIndex.clearIndex();

	store.dispatch(clearLog());

	gitLogProcess = spawn('git', [
		'log',
		'--color=always',
		...stash.get(GIT_LOG_ARGS),
	]);

	let errorString = '';

	let total = 0;

	gitLogProcess.stdout.setEncoding('utf8');
	gitLogProcess.stdout.on('data', (data: string) => {
		const lines = data.trim().split('\n');

		lines.forEach((line) => {
			searchIndex.indexLine(total, line);
			total++;
		});

		store.dispatch(addCommits(lines));
	});

	gitLogProcess.stderr.on('data', (data: string) => (errorString += data));

	gitLogProcess.on('close', (code: number) => {
		if (code > 0) {
			screen.destroy();

			process.stderr.write(
				'jack encountered an error with the call to "git log":\n\n',
			);
			process.stderr.write(errorString);

			process.exit(code);
		} else {
			store.dispatch(updateStatus(Status.LOG_COMPLETED));
		}
	});

	screen.render();
};

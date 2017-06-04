import { exec, spawn, spawnSync, SpawnSyncReturns } from 'child_process';
import * as clipboardy from 'clipboardy';
import * as opn from 'opn';
import * as path from 'path';

import { notifyError, notifyInfo, notifySuccess } from '../interface/notification';

const REPO_TOP_LEVEL: string = spawnSync('git', ['rev-parse', '--show-toplevel']).stdout.toString().split('\n')[0];

export function cherryPickCommit(SHA: string): void {
	const cherryPickSync: SpawnSyncReturns<string> = spawnSync('git', ['cherry-pick', SHA]);

	if (cherryPickSync.status !== 0) {
		notifyError(`Cherry-pick failed:\n\n${cherryPickSync.stderr.toString()}\n\nAborting cherry-pick.`);

		spawn('git', ['cherry-pick', '--abort']);
	} else {
		notifySuccess(`Successfully cherry-picked commit ${SHA} onto current branch.`);
	}
}

export function copySHAToClipboard(SHA: string): void {
	clipboardy.writeSync(SHA);

	notifySuccess(`Copied SHA to the clipboard: ${SHA}`);
}

export function openFilesFromCommit(SHA: string): void {
	exec(`git diff --name-only ${SHA}^..${SHA}`, (_error: Error, stdout: string) => {
		const files: string[] = stdout.split('\n').filter(Boolean);

		files.map((file: string) => path.join(REPO_TOP_LEVEL, file)).forEach(opn);

		notifyInfo(`Opening files:\n\n${files.join('\n')}`);
	});
}

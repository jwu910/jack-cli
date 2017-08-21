import { spawnPromise } from './promisify-child-process';

export const gitCherryPick = (SHA: string): Promise<string> =>
	spawnPromise('git', ['cherry-pick', SHA]);

export const gitCherryPickAbort = (): Promise<string> =>
	spawnPromise('git', ['cherry-pick', '--abort']);

export const gitCommitMessage = (SHA: string): Promise<string> =>
	spawnPromise('git', ['show', SHA, '-s', '--pretty=format:%s']);

export const gitDiff = (SHA1: string, SHA2: string): Promise<string> =>
	spawnPromise('git', ['diff', `${SHA1}^..${SHA2}`]);

export const gitDiffNameOnly = (SHA1: string, SHA2: string): Promise<string> =>
	spawnPromise('git', ['diff', `${SHA1}^..${SHA2}`, '--name-only']);

export const gitMergeBase = (SHA1: string, SHA2: string): Promise<string> =>
	spawnPromise('git', ['merge-base', '--is-ancestor', SHA1, SHA2]);

export const gitShow = (SHA: string): Promise<string> =>
	spawnPromise('git', [ 'show', '--patch-with-stat', SHA ]);

export const gitTopLevel = (): Promise<string> =>
	spawnPromise('git', ['rev-parse', '--show-toplevel']);

export const isAncestor = (maybeAncestorSHA: string, maybeChildSHA: string): Promise<boolean> =>
	gitMergeBase(maybeAncestorSHA, maybeChildSHA)
		.then(() => Promise.resolve(true))
		.catch(() => Promise.resolve(false));

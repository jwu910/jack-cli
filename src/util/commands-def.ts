import * as Ajv from 'ajv';
import { ErrorObject } from 'ajv';
import { readFileSync } from 'fs';
import { join } from 'path';

const ajv = new Ajv();

const commandSchema = JSON.parse(
	readFileSync(
		join(__dirname, '../lib/command-schema.json'), { encoding: 'utf8' }));

export interface ICommand {
	/**
	 * An array of strings containing the command to run and its arguments.
	 * The placeholder variables are put into this array. This array supports
	 * pipes.
	 *
	 * REQUIRED.  If it is not given, jack will exit with an error.
	 *
	 * Example: ['git', 'checkout', '[% SHA_SINGLE %]']
	 */
	commandArray: string[];

	/**
	 * A description that will display whenever the command is invoked.
	 *
	 * REQUIRED. If it is not given, jack will exit with an error.
	 */
	description: string;

	/**
	 * Whether or not the process will spawn in the foreground.  By default,
	 * commands will run in the background and notify you when they have
	 * completed.  If this property is true, jack will try to spawn it as a
	 * foreground process.
	 *
	 * Please note that if the command does not run in a pager or an editor like
	 * less or vim, the process will complete and immediately return you to
	 * jack. You can work around this by piping to less or another pager in
	 * the command array.
	 *
	 * OPTIONAL.  Default is false.
	 */
	foreground?: boolean;

	/**
	 * The key used to invoke the command from jack. This can either be a single
	 * lowercase letter, or prefixed with "C-" for a "control" modifer key, or
	 * "S-" for a "shift" modifier key
	 *
	 * REQUIRED. If it is not given, jack will exit with an error.
	 *
	 * Example: 's', 'S-x', 'C-v'
	 */
	key: string;

	/**
	 * A command to run if there is an error with the main command.  This is not
	 * usually necessary, but can be useful for cleaning up after a command that
	 * leaves garbage if it fails, such as a 'git cherry-pick' or 'git rebase'.
	 *
	 * OPTIONAL
	 *
	 * Example: ['git', 'rebase', '--abort']
	 * Example: ['git', 'cherry-pick', '--abort']
	 */
	onErrorCommand?: string[];

	/**
	 * Whether or not to refresh the log after the command has completed.
	 * This is useful for operations that change the log like `git rebase` or
	 * `git cherry-pick`.
	 *
	 * OPTIONAL. Default is false.
	 */
	refreshOnComplete?: boolean;
}

export enum Placeholder {

	/**
	 * Will be replaced by the commit message of the currently selected commit
	 *
	 * Example: "offers commit message variable for custom commands"
	 */
	COMMIT_MESSAGE = '[% COMMIT_MESSAGE %]',

	/**
	 * Will always be replaced by a revision range, even if there is no marked
	 * commit. Commands such as 'git diff' require this to show the changes for
	 * just a single commit.
	 *
	 * Single Commit Example:      4a22d67^..4a22d67
	 * With Marked Commit Example: 9103ae0^..4a22d67
	 */
	SHA_RANGE = '[% SHA_RANGE %]',

	/**
	 * Will be replaced by either a single commit SHA or a revision range if there
	 * is a marked commit.
	 *
	 * Single Commit Example:      4a22d67
	 * With Marked Commit Example: 9103ae0^..4a22d67
	 */
	SHA_SINGLE_OR_RANGE = '[% SHA_SINGLE_OR_RANGE %]',

	/**
	 * Will be replaced by the currently selected commit SHA.
	 *
	 * Single Commit Example:      4a22d67
	 * With Marked Commit Example: 4a22d67
	 */
	SHA_SINGLE = '[% SHA_SINGLE %]',
}

const RESERVED_KEYS = [...('bfgjkmoqrxy?'.split('')), 'C-c', 'S-j', 'S-k'];

// tslint:disable-next-line:only-arrow-functions
export const validateCommand = (commandOptions: ICommand): void => {
	ajv.validate(commandSchema, commandOptions);

	if (ajv.errors) {
		const message = ajv.errors.map(constructErrorMessage).join('\n');

		crash(message, commandOptions);
	}

	const { key } = commandOptions;

	if (RESERVED_KEYS.includes(key)) {
		crash(
			// tslint:disable-next-line:max-line-length
			`The key combination "${key}" is reserved. Here is the list of reserved key combinations: ${RESERVED_KEYS.join(' ')}`,
			commandOptions);
	}
};

const constructErrorMessage = (errorObject: ErrorObject) => {
	let errorMessage = '';

	const { dataPath, message, params } = errorObject;

	if (dataPath) {
		errorMessage +=
			`The parameter "${dataPath}" did not validate: `;
	}

	errorMessage += message;

	// @ts-ignore: each of these values are checked before use
	const { allowedValues, pattern } = params;

	if (allowedValues) {
		errorMessage += `\nAllowed values: ${allowedValues.join(', ')}`;
	}

	if (pattern) {
		errorMessage += `\nUse a single lower-case letter.`;
	}

	return errorMessage;
};

const crash = (errorMessage: string, command?: ICommand) => {
	process.stderr.write(
		'There was a problem registering a custom command from your ' +
		'.jack.json config file:\n\n');
	process.stderr.write(errorMessage + '\n\n');

	if (command) {
		process.stderr.write('Fix this command object:\n');
		process.stderr.write(JSON.stringify(command, null, '    ') + '\n');
	}

	process.exit(1);
};

export const COMMANDS: ICommand[] = [
	/**
	 * Open a diff
	 */
	{
		commandArray: [
			'git',
			'-p',
			'diff',
			Placeholder.SHA_RANGE,
			'--patch',
			'--stat-width=1000',
		],
		description: 'View total diff',
		foreground: true,
		key: 'd',
	},

	/**
	 * List changed files
	 */
	{
		commandArray: ['git', '-p', 'diff', Placeholder.SHA_RANGE, '--name-only'],
		description: 'View changed file names',
		foreground: true,
		key: 'n',
	},

	/**
	 * Open changes in a difftool
	 */
	{
		commandArray: ['git', 'difftool', Placeholder.SHA_RANGE],
		description: 'Open total diff in difftool',
		key: 't',
	},

	/**
	 * Attempt a cherry-pick
	 */
	{
		commandArray: ['git', 'cherry-pick', Placeholder.SHA_SINGLE_OR_RANGE],
		description: 'Cherry-pick commits',
		key: 'S-c',
		onErrorCommand: ['git', 'cherry-pick', '--abort'],
	},

	/**
	 * Begin an interactive rebase
	 */
	{
		commandArray: ['git', 'rebase', '-i', Placeholder.SHA_SINGLE + '^'],
		description: 'Perform interactive rebase',
		foreground: true,
		key: 'S-i',
		onErrorCommand: ['git', 'rebase', '--abort'],
		refreshOnComplete: true,
	},
];

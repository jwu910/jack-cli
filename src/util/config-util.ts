import * as fs from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { ICommand } from './commands-def';
import { stringToCommandArray } from './util-functions';

interface IConfig {
	blacklistPatterns?: string[];
	commands: ICommand[];
	gitShowOptions?: string;
	notificationTimeout?: number;
	searchIndexLimit?: number;
	showLineNumbers?: boolean;
	useSearchIndex?: boolean;
}
let CONFIG_FILE_PATH: string;

if (process.env.JACK_CLI_CONFIG_FILE_PATH) {
	if (!process.env.JACK_CLI_CONFIG_FILE_PATH.endsWith('.json')) {
		process.stderr.write(
			'The JACK_CLI_CONFIG_FILE_PATH environment variable must define a path to a *.json file. If this file does not exist, jack-cli will create it.',
		);

		process.exit(1);
	}

	CONFIG_FILE_PATH = process.env.JACK_CLI_CONFIG_FILE_PATH;
} else {
	CONFIG_FILE_PATH = join(homedir(), '.jack.json');
}

const DEFAULT_GIT_SHOW_OPTIONS = '--patch-with-stat --stat-width 1000 --color';
const DEFAULT_NOTIFICATION_TIMEOUT = 5000;
const DEFAULT_SEARCH_INDEX_LIMIT = 300000;
const DEFAULT_SHOW_LINE_NUMBERS = false;
const DEFAULT_USE_SEARCH_INDEX = true;

let config: IConfig;

export const getBlacklistPatterns = (): RegExp[] => {
	const blacklistPatterns = getConfig().blacklistPatterns || [];

	return blacklistPatterns.map(
		(blacklistPattern) => new RegExp(blacklistPattern),
	);
};

export const getCommands = (): ICommand[] => {
	return getConfig().commands || [];
};

export const getGitShowOptions = (): string[] => {
	const gitShowOptionsString =
		getConfig().gitShowOptions || DEFAULT_GIT_SHOW_OPTIONS;

	return stringToCommandArray(gitShowOptionsString);
};

export const getNotificationTimeout = (): number => {
	return getConfig().notificationTimeout || DEFAULT_NOTIFICATION_TIMEOUT;
};

export const getSearchIndexLimit = (): number => {
	return getConfig().searchIndexLimit || DEFAULT_SEARCH_INDEX_LIMIT;
};

export const getShowLineNumbers = (): boolean => {
	return getConfig().showLineNumbers || DEFAULT_SHOW_LINE_NUMBERS;
};

export const getUseSearchIndex = (): boolean => {
	const useSearchIndex = getConfig().useSearchIndex;

	if (useSearchIndex != undefined) {
		return useSearchIndex;
	}

	return DEFAULT_USE_SEARCH_INDEX;
};

const getConfig = (): IConfig => {
	if (!config) {
		config = readConfig();
	}

	return config;
};

const readConfig = (): IConfig => {
	const defaultConfig: IConfig = {
		blacklistPatterns: [],
		commands: [],
		gitShowOptions: DEFAULT_GIT_SHOW_OPTIONS,
		notificationTimeout: DEFAULT_NOTIFICATION_TIMEOUT,
		searchIndexLimit: DEFAULT_SEARCH_INDEX_LIMIT,
		showLineNumbers: DEFAULT_SHOW_LINE_NUMBERS,
		useSearchIndex: DEFAULT_USE_SEARCH_INDEX,
	};

	if (!fs.existsSync(CONFIG_FILE_PATH)) {
		fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(defaultConfig));

		return defaultConfig;
	}

	return require(CONFIG_FILE_PATH);
};

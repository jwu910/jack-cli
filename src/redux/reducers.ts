import * as immer from 'immer';
import { Action, ActionType, State, Status, View } from '../types/types';

immer.setAutoFreeze(false);

const COMMIT_SHA_REGEX: RegExp = new RegExp(/[0-9a-f]{7,40}\b/);
const INITIAL_STATE: State = {
	SHA: '',
	index: 0,
	indexesWithSHAs: [0],
	lines: [],
	markedSHA: '',
	status: Status.RETRIEVING_LOG,
	view: View.LIST,
};

export const reducer = (state: State = INITIAL_STATE, action: Action): State =>
	immer.produce(state, (draft) => {
		switch (action.type) {
			case ActionType.ADD_COMMITS:
				action.payload.forEach((line, index) => {
					draft.lines.push(line);

					if (COMMIT_SHA_REGEX.test(line)) {
						draft.indexesWithSHAs.push(index + state.lines.length);
					}
				});

				draft.SHA = state.SHA
					? state.SHA
					: getSHA(
							draft.lines[draft.indexesWithSHAs[state.index]],
							state.SHA,
					  );

				break;

			case ActionType.CLEAR_LOG:
				Object.assign(draft, INITIAL_STATE);
				break;

			case ActionType.MARK_SHA:
				draft.markedSHA = action.payload;
				break;

			case ActionType.UPDATE_INDEX:
				const newIndex = Math.min(
					Math.max(state.index + action.payload, 0),
					state.indexesWithSHAs.length - 1,
				);

				draft.SHA = getSHA(
					state.lines[state.indexesWithSHAs[newIndex]],
					state.SHA,
				);

				draft.index = newIndex;

				break;

			case ActionType.UPDATE_STATUS:
				draft.status = action.payload;
				break;

			case ActionType.UPDATE_VIEW:
				draft.view = action.payload;
				break;
		}
	});

const getSHA = (lineText: string, defaultValue: string): string => {
	const matches: RegExpExecArray | null = COMMIT_SHA_REGEX.exec(lineText);

	if (!matches) {
		return defaultValue;
	}

	const matchedSHA: string | null = matches[0];

	if (matchedSHA) {
		return matchedSHA;
	}

	return defaultValue;
};

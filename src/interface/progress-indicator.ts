import { doSubscribe } from '../state/store';
import { Status, TextElement, UpdateFunction } from '../types/types';
import { getTextElement } from './interface-elements';

const TOTAL_PLACEHOLDER = '---';

export const getProgressIndicator = (): TextElement => {
	const progressIndicator: TextElement = getTextElement({
		content: getStatusMessage(1, TOTAL_PLACEHOLDER),
		left: 0,
		name: 'progressIndicator',
	});

	doSubscribe(
		['index', 'status'],
		progressIndicator,
		updateProgressIndicator,
	);

	return progressIndicator;
};

const getStatusMessage = (
	left: string | number,
	right: string | number,
): string => `Commit ${left} of ${right}`;

const updateProgressIndicator: UpdateFunction<TextElement> = async ({
	element: progressIndicator,
	state: { index, indexesWithSHAs, status },
}) => {
	progressIndicator.setText(
		getStatusMessage(
			indexesWithSHAs.indexOf(index) + 1,
			status === Status.LOG_COMPLETED
				? indexesWithSHAs.length
				: TOTAL_PLACEHOLDER,
		),
	);

	return true;
};

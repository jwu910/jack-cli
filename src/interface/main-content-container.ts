import { store } from 'redux/store';
import { BoxElement } from 'types/types';
import { getCommitElement } from 'commit-view';
import { getBoxElement } from 'interface-elements';
import { getCommitListElement } from 'list-view';

let mainContentContainer: BoxElement;

export const getMainContentContainer = (): BoxElement => {
	mainContentContainer = getBoxElement({
		bottom: 1,
		left: 0,
		right: 0,
		top: 0,
	});

	const commitElement = getCommitElement();
	const commitListElement = getCommitListElement();

	mainContentContainer.append(commitElement);
	mainContentContainer.append(commitListElement);

	store.subscribe(updateView(commitElement, commitListElement));

	return mainContentContainer;
};

const updateView = (commitElement, commitListElement) => () => {
	const state = store.getState();
	const screen = commitListElement.screen;

	if (state.view === 'LIST' && screen.focused !== commitListElement) {
		commitListElement.setFront();
		commitListElement.focus();

		return screen.render();
	}

	if (state.view === 'COMMIT' && screen.focused !== commitElement) {
		commitElement.setFront();
		commitElement.focus();

		return screen.render();
	}
};

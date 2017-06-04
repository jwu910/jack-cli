import { decrementIndex, incrementIndex, viewCommit } from '../redux/action-creators';
import { store } from '../redux/store';
import { IListElement, KeyEvent } from '../types/types';
import { getListElement } from './interface-elements';

let commitListElement: IListElement;

export function getCommitListElement(): IListElement {
	if (commitListElement) {
		return commitListElement;
	}

	commitListElement = getListElement({
		bottom: 0,
		left: 0,
		mouse: true,
		right: 0,
		style: {
			selected: {
				bg: '#555',
			},
		},
		top: 0,
	});

	const handleKeypressFn = (_ch: string, key: KeyEvent) => {
		switch (key.name) {
			case 'down':
			case 'j':
				store.dispatch(incrementIndex());

				break;

			case 'k':
			case 'up':
				store.dispatch(decrementIndex());

				break;

			case 'enter':
			case 'space':
				store.dispatch(viewCommit());

				break;

			default: break;
		}
	};

	commitListElement.on('keypress', handleKeypressFn);

	commitListElement.focus();

	store.subscribe(updateCommitListElement());

	return commitListElement;
}

function updateCommitListElement() {
	let lastState = store.getState();

	return () => {
		const state = store.getState();

		const {commits, index, view} = state;

		const isListView: boolean = view === 'LIST';

		if (isListView && commitListElement.hidden) {
			commitListElement.show();
			commitListElement.focus();
		} else if (view === 'COMMIT' && commitListElement.visible) {
			commitListElement.hide();
		}

		if (commits !== lastState.commits) {
			commitListElement.setItems(commits);
		}

		if (index !== lastState.index) {
			commitListElement.select(index);
		}

		lastState = state;

		commitListElement.screen.render();
	};
}

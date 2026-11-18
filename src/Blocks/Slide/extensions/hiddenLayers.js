import { useSyncExternalStore } from '@wordpress/element';

/** Layers hidden on the canvas for this editing session only; nothing is saved, so a reload shows them all again. */

const hidden = new Set();
const listeners = new Set();

const subscribe = (listener) => {
	listeners.add(listener);

	return () => listeners.delete(listener);
};

export const setLayerHidden = (clientId, isHidden) => {
	if (isHidden) {
		hidden.add(clientId);
	} else {
		hidden.delete(clientId);
	}

	listeners.forEach(listener => listener());
};

export const useLayerHidden = (clientId) => useSyncExternalStore(subscribe, () => hidden.has(clientId));

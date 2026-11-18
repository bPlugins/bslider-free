import { useEffect, useSyncExternalStore } from '@wordpress/element';
import { dispatch, select, subscribe as subscribeStore } from '@wordpress/data';
import { findBlockElement } from './layerGeometry';

/** Layers gathered with Shift-click, any of a slide's layers rather than Gutenberg's run of neighbours; editor-only, never saved. */

const EMPTY = [];
let picked = EMPTY;
const listeners = new Set();

const subscribe = (listener) => {
	listeners.add(listener);

	return () => listeners.delete(listener);
};

const setPicked = (ids) => {
	picked = ids.length ? ids : EMPTY;
	listeners.forEach(listener => listener());
};

export const clearPicked = () => picked.length && setPicked(EMPTY);

export const usePicked = () => useSyncExternalStore(subscribe, () => picked);

export const useLayerPicked = (clientId) => useSyncExternalStore(subscribe, () => picked.includes(clientId));

// Our own canvas tools keep the picks while they work on them.
const OWN_TOOLS = '.bsb-layer-group-bar, .bsb-layer-drag-handle, .bsb-layer-rotate-handle, .bsb-layer-resize-frame';

/** The layer a Shift-click means: at the level already being picked, else the outermost, as a first click picks a whole group. */
const layerUnder = (target, anchorRoot) => {
	const editor = select('core/block-editor');
	const chain = [];
	let node = target.closest('.bsb-abs[data-block]');

	while (node && node.closest('.bsb-slide-content')) {
		chain.push(node.dataset.block);
		node = node.parentElement?.closest('.bsb-abs[data-block]');
	}

	if (!chain.length) {
		return null;
	}

	return (undefined !== anchorRoot && chain.find(id => editor.getBlockRootClientId(id) === anchorRoot)) || chain[chain.length - 1];
};

const onMouseDown = (event) => {
	if (!event.target?.closest || event.target.closest(OWN_TOOLS)) {
		return;
	}

	if (!event.shiftKey) {
		clearPicked();
		return;
	}

	const editor = select('core/block-editor');
	const selected = editor.getSelectedBlockClientIds().filter(id => editor.getBlockAttributes(id)?.bsbLayer?.position?.absolute);
	const start = picked.length ? picked : selected;
	const anchorRoot = start.length ? editor.getBlockRootClientId(start[0]) : undefined;
	const id = layerUnder(event.target, anchorRoot);

	// A flow block keeps Gutenberg's own Shift-click.
	if (!id) {
		return;
	}

	event.preventDefault();
	event.stopPropagation();

	const sameLevel = start.filter(other => editor.getBlockRootClientId(other) === editor.getBlockRootClientId(id));
	const next = sameLevel.includes(id) ? sameLevel.filter(other => other !== id) : [...sameLevel, id];
	const blockEditor = dispatch('core/block-editor');

	// One layer is an ordinary selection; two or more live here, with Gutenberg's selection cleared so its handles stand down.
	if (next.length > 1) {
		blockEditor.clearSelectedBlock();
		setPicked(next);
	} else {
		setPicked(EMPTY);

		if (next.length) {
			blockEditor.selectBlock(next[0]);
		} else {
			blockEditor.clearSelectedBlock();
		}
	}
};

const onKeyDown = (event) => {
	if ('Escape' === event.key) {
		clearPicked();
	}
};

const installed = new WeakMap();

/** One listener per canvas document, however many layers ask for it. */
export const LayerPicker = ({ clientId }) => {
	useEffect(() => {
		const doc = findBlockElement(clientId)?.ownerDocument;

		if (!doc) {
			return undefined;
		}

		const count = installed.get(doc) || 0;

		if (!count) {
			doc.addEventListener('mousedown', onMouseDown, true);
			doc.addEventListener('keydown', onKeyDown, true);
		}

		installed.set(doc, count + 1);

		return () => {
			const left = installed.get(doc) - 1;

			installed.set(doc, left);

			if (!left) {
				doc.removeEventListener('mousedown', onMouseDown, true);
				doc.removeEventListener('keydown', onKeyDown, true);
			}
		};
	}, [clientId]);

	return null;
};

// Picking any block the usual way, from List View too, ends the Shift-click set.
subscribeStore(() => {
	if (picked.length && select('core/block-editor').getSelectedBlockClientId()) {
		clearPicked();
	}
}, 'core/block-editor');

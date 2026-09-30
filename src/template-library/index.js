import { subscribe } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
// `@wordpress/element` rather than `react-dom/client`, which is the same `createRoot` by way of a
// package WordPress actually externalises. The dependency-extraction plugin (5.9.0) has cases for
// `react` and `react-dom` but none for the `react-dom/client` subpath, so importing it compiles a
// second copy of React into this bundle. That copy has its own hooks dispatcher, and the shared
// component's first `useState` then fails against a renderer it does not belong to — silently, with
// no console error, which is exactly how this presented: the file downloaded, and nothing ran.
import { createRoot } from '@wordpress/element';

import './style.scss';
import TemplateLibrary from './TemplateLibrary';

/**
 * Puts the Template Library button in the editor's top toolbar.
 *
 * The toolbar is React's and is rebuilt on its own schedule — switching to the site editor, opening
 * a template part, toggling Distraction Free all drop anything appended to it — so placing the
 * button once is not enough. Two things drive the retry:
 *
 *   - a MutationObserver, because the toolbar is painted by React and the paint is not a store
 *     change. `subscribe` alone missed it whenever the last store update landed before the header
 *     had rendered, which is the usual order on a first load, and the button then never appeared.
 *   - `subscribe`, which catches the editor-mode switches that swap the whole header without
 *     necessarily touching the part of the DOM being observed.
 *
 * The React root is created once and the same element is moved, so the modal's state survives a
 * re-place.
 *
 * The selectors are tried in order because the toolbar has been renamed twice and all three names
 * are still shipped: `editor-document-tools` is current, the other two are what older releases
 * called it. The last two fall back to the header itself, so a screen that renders a reduced
 * toolbar — a locked post type such as `bsb`, for instance — still gets the button somewhere
 * visible rather than nowhere.
 */
const TOOLBARS = [
	'.editor-document-tools',
	'.editor-header__toolbar',
	'.edit-post-header-toolbar',
	'.editor-header__center',
	'.editor-header',
	'.edit-post-header'
];

/**
 * The shared component reaches AJAX through the `wp.ajax` global rather than importing it, and its
 * `useWPAjax` returns `undefined` when that global is missing — which the hook above it immediately
 * destructures, so the whole modal throws on its first render and nothing mounts at all.
 *
 * `wp-util` is in this script's dependency list, so in the ordinary case the global is already
 * there. This waits for it anyway: a dependency that fails to load, or a page that registers the
 * handle late, would otherwise cost the button entirely rather than just the requests it makes.
 */
const whenAjaxReady = (run) => {
	if (window.wp?.ajax) {
		run();
		return;
	}

	let waited = 0;
	const timer = setInterval(() => {
		waited += 100;

		if (window.wp?.ajax || waited >= 10000) {
			clearInterval(timer);
			run();
		}
	}, 100);
};

const mountTemplateLibrary = () => {
	const wrap = document.createElement('div');

	wrap.classList.add('bsbTemplateLibrary');
	whenAjaxReady(() => createRoot(wrap).render(<TemplateLibrary />));

	const place = () => {
		// Runs on every store change and on every mutation, so it has to be cheap and idempotent.
		if (wrap.isConnected) {
			return;
		}

		for (const selector of TOOLBARS) {
			const toolbar = document.querySelector(selector);

			if (toolbar) {
				toolbar.appendChild(wrap);
				return;
			}
		}
	};

	new MutationObserver(place).observe(document.body, { childList: true, subtree: true });
	subscribe(place);
	place();
};

domReady(mountTemplateLibrary);

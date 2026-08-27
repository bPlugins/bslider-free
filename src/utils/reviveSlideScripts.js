/**
 * Re-runs the scripts inside slide markup that arrived as a string.
 *
 * A slide can hold any block at all, including ones from other plugins, and some of those bring
 * their own front-end JavaScript — an accordion that has to bind a click, a counter that has to
 * start counting. On every other source type that JS is already running by the time this slider
 * draws anything, but a `blocks` slide is different: its markup is rendered on the server, put
 * into an attribute, and inserted with `innerHTML` (see render.php's `_blocksHtml` bridge and
 * Default.js). The HTML parser deliberately does not execute a `<script>` inserted that way, and
 * anything listening for `DOMContentLoaded` has already missed it — so without this, a
 * third-party block would render as inert markup and its author would have no idea why.
 *
 * Re-creating each script element is what makes the browser run it: the node has to be built
 * fresh and put into the document, since the one that came in with the HTML is permanently inert.
 *
 * Then two events are fired, because plugins wait on one or the other and there is no way to
 * know which: `DOMContentLoaded` for the many that bind on it, and a namespaced event for
 * anything that wants to know specifically that this slider just put new markup on the page.
 */
/**
 * Guards against the loop a slider inside a slider would otherwise make.
 *
 * Re-firing `DOMContentLoaded` is how the newly-inserted markup gets picked up, but a slider
 * mounted by that pass inserts markup of its own and would fire it again, and so on for as long
 * as there are slides. One re-fire per turn of the event loop is enough to reach every depth:
 * each nested slider mounts within the same turn, and the next tick's fire covers whatever that
 * produced.
 */
let announceQueued = false;

export const reviveSlideScripts = (root, onRevived) => {
	if (!root) return;

	root.querySelectorAll('script').forEach(old => {
		const script = document.createElement('script');

		[...old.attributes].forEach(({ name, value }) => script.setAttribute(name, value));
		script.textContent = old.textContent;

		old.replaceWith(script);
	});

	// The precise version, for anything that wants to bind to just this slider's new content.
	root.dispatchEvent(new CustomEvent('bsb.slidesReady', { bubbles: true, detail: { root } }));

	/*
	 * Our own slider-in-a-slider is handled by calling back, not by the event below.
	 *
	 * A listener added with `document.addEventListener('DOMContentLoaded', …)` after that event
	 * has already fired never runs again, however many times the event is dispatched by hand —
	 * so view.js's own listener cannot be what picks up this new markup. Other plugins are a
	 * different matter: theirs were attached before the page finished loading, so a re-fire does
	 * reach them, which is what the dispatch below is still for.
	 */
	onRevived?.(root);

	if (announceQueued) return;
	announceQueued = true;

	// Re-firing `DOMContentLoaded` is the blunt half of this and it is deliberate: a block's
	// script cannot be asked to expose an init function it never had, and every other hook would
	// only reach plugins that already knew about this slider. Listeners that have run once are
	// generally written to be safe run twice — the ones that are not would already be broken by
	// any of the several other things on a page that do this.
	//
	// Deferred by a tick so that several sliders finishing together announce once between them,
	// and so a nested slider mounted by this very announcement is included in the next one
	// rather than firing its own from inside this one.
	setTimeout(() => {
		announceQueued = false;
		document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
		window.dispatchEvent(new Event('load'));
	}, 0);
};

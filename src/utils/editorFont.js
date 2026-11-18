/** Loads a layer's Google font (family + weight) into the editor and its canvas iframe; render.php does the front end. */
export const loadEditorFont = (family, weight) => {
	if (!family || 'Default' === family) {
		return;
	}

	// Same weight rules and link id as render.php, so the editor matches the front end.
	const w = /^\d{3}$/.test(String(weight)) ? String(weight) : ('bold' === weight ? '700' : '400');
	const id = `bsb-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}${'400' === w ? '' : `-${w}`}`;
	const href = `https://fonts.googleapis.com/css2?family=${family.split(' ').join('+')}${'400' === w ? '' : `:wght@${w}`}&display=swap`;
	const canvas = document.querySelector('iframe[name="editor-canvas"]')?.contentDocument;

	[document, canvas].forEach(doc => {
		if (!doc?.head || doc.getElementById(id)) {
			return;
		}

		const link = doc.createElement('link');
		link.id = id;
		link.rel = 'stylesheet';
		link.href = href;
		doc.head.appendChild(link);
	});
};

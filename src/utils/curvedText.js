const SVG_NS = 'http://www.w3.org/2000/svg';
let pathCount = 0;

/** Lays one `[data-bsb-curve]` layer's text on an SVG arc; the saved markup stays plain text. */
const drawCurve = (el) => {
	const deg = Math.max(-359, Math.min(359, Number(el.dataset.bsbCurve) || 0));

	if (undefined === el._bsbCurveText) {
		el._bsbCurveText = el.textContent.replace(/\s+/g, ' ').trim();
	}

	const text = el._bsbCurveText;

	if (!deg || !text) {
		return;
	}

	el.textContent = '';

	// Read aloud as the plain text; the drawing is hidden from assistive tech.
	const label = document.createElement('span');
	label.className = 'bsb-curve-label';
	label.textContent = text;

	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('class', 'bsb-curve-svg');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('focusable', 'false');

	const node = document.createElementNS(SVG_NS, 'text');
	node.textContent = text;
	svg.appendChild(node);
	el.append(label, svg);

	// Hidden slide: nothing to measure yet, so it stays straight until its slide shows.
	const length = node.getComputedTextLength();

	if (!length) {
		el.textContent = text;
		return;
	}

	const theta = (Math.abs(deg) * Math.PI) / 180;
	const r = length / theta;
	const up = deg > 0;
	const from = up ? -Math.PI / 2 - (theta / 2) : (Math.PI / 2) + (theta / 2);
	const to = up ? -Math.PI / 2 + (theta / 2) : (Math.PI / 2) - (theta / 2);
	const point = (a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
	const id = `bsb-curve-${++pathCount}`;

	const defs = document.createElementNS(SVG_NS, 'defs');
	const path = document.createElementNS(SVG_NS, 'path');
	path.setAttribute('id', id);
	path.setAttribute('d', `M ${point(from)} A ${r.toFixed(2)} ${r.toFixed(2)} 0 ${theta > Math.PI ? 1 : 0} ${up ? 1 : 0} ${point(to)}`);
	defs.appendChild(path);
	svg.insertBefore(defs, node);

	const onPath = document.createElementNS(SVG_NS, 'textPath');
	onPath.setAttribute('href', `#${id}`);
	onPath.setAttribute('startOffset', '50%');
	onPath.textContent = text;
	node.textContent = '';
	node.setAttribute('text-anchor', 'middle');
	node.appendChild(onPath);

	const box = node.getBBox();
	const pad = (parseFloat(getComputedStyle(el).fontSize) || 16) * 0.2;
	const width = box.width + (pad * 2);
	const height = box.height + (pad * 2);

	svg.setAttribute('viewBox', `${(box.x - pad).toFixed(2)} ${(box.y - pad).toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}`);
	svg.setAttribute('width', width.toFixed(2));
	svg.setAttribute('height', height.toFixed(2));
};

/** Curves every curved layer under `scope` that is laid out now. */
export const drawCurvesIn = (scope) => {
	scope?.querySelectorAll('[data-bsb-curve]').forEach(drawCurve);
};

/** Redraws on resize and once web fonts arrive (both change the text's length); returns a teardown. */
export const watchCurvesIn = (root) => {
	if (!root?.querySelector('[data-bsb-curve]')) {
		return () => { };
	}

	let frame = 0;
	const redraw = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => drawCurvesIn(root));
	};

	window.addEventListener('resize', redraw);
	document.fonts?.ready.then(redraw);

	return () => {
		cancelAnimationFrame(frame);
		window.removeEventListener('resize', redraw);
	};
};

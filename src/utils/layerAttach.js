/** A layer attached to another sits by CSS anchor positioning; shared by the editor's styles and the front end's upgrade. */

export const anchorName = (id) => `--bsb-${id}`;

/** The anchor() sides of a 9-point name, e.g. "top-right" → right, top; a missing target falls back to the area's corner. */
export const pointSides = (point = 'top-left') => {
	const [vertical, horizontal] = point.split('-');

	return { x: horizontal, y: 'middle' === vertical ? 'center' : vertical };
};

/** Share of the layer's own size its anchor point sits in: 0, 0.5 or 1 across, 0, 0.5 or 1 down. */
export const pointShare = (point = 'top-left') => {
	const [vertical, horizontal] = point.split('-');

	return {
		x: 'right' === horizontal ? 1 : 'center' === horizontal ? 0.5 : 0,
		y: 'bottom' === vertical ? 1 : 'middle' === vertical ? 0.5 : 0,
	};
};

export const insetFrom = (id, side, length) => `calc(anchor(${anchorName(id)} ${side}, 0px) + ${length})`;

/** The own-point shift that puts the layer's anchor point, not its corner, on the target point. */
export const ownShift = (anchor) => {
	const { x, y } = pointShare(anchor);

	return x || y ? `${-x * 100}% ${-y * 100}%` : '';
};

/** Front end: saved left/top are the offsets; once the browser can, they count from the target's point. */
export const attachLayersIn = (root) => {
	if (!root || 'undefined' === typeof CSS || !CSS.supports?.('anchor-name', '--a')) {
		return;
	}

	root.querySelectorAll('[data-bsb-layer-id]').forEach(el => {
		el.style.anchorName = anchorName(el.dataset.bsbLayerId);
	});

	root.querySelectorAll('[data-bsb-to]').forEach(el => {
		if (el.dataset.bsbAttached) {
			return;
		}

		const { x, y } = pointSides(el.dataset.bsbToPoint);

		el.dataset.bsbAttached = '1';
		el.style.left = insetFrom(el.dataset.bsbTo, x, el.style.left || '0px');
		el.style.top = insetFrom(el.dataset.bsbTo, y, el.style.top || '0px');
	});
};

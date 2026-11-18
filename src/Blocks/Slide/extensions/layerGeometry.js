import { dispatch, select } from '@wordpress/data';
import { buildLayerProps } from './layerProps';

/** Canvas maths shared by the single-layer handles and the multi-select tools, so both move a layer the same way. */

export const SNAP = 5;
const PREVIEWED = ['left', 'right', 'top', 'bottom', 'width', 'height', 'boxSizing', 'rotate', 'translate'];

export const ARROWS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** The block's own element on the canvas, inside the editor iframe when there is one. */
export const findBlockElement = (clientId) => {
	const canvas = document.querySelector('iframe[name="editor-canvas"]')?.contentDocument;

	return canvas?.getElementById(`block-${clientId}`) || document.getElementById(`block-${clientId}`);
};

/** The box a layer's X/Y count from: its absolute group, else the slide's content area. */
export const layerArea = (element) => element?.parentElement?.closest('.bsb-abs, .bsb-slide-content') || null;

/** -180 to 180, so a few turns still read as a small angle. */
export const normalise = (deg) => {
	const turned = ((deg % 360) + 360) % 360;

	return turned > 180 ? turned - 360 : turned;
};

export const fromPx =(px, unit, size) => ('%' === unit ? Math.round(px / size * 1000) / 10 : Math.round(px));

/** How much Auto-scale shrinks the layer on screen; its own values are in unscaled px. */
export const zoomOf = (element) => element?.currentCSSZoom || 1;

/** The unrotated box on screen, from the area's top-left: rotation turns about the centre, so the centre and own size still hold. */
export const layoutBox = (element, areaRect) => {
	const rect = element.getBoundingClientRect();
	const zoom = zoomOf(element);
	const width = element.offsetWidth * zoom;
	const height = element.offsetHeight * zoom;

	return {
		left: rect.left + rect.width / 2 - width / 2 - areaRect.left,
		top: rect.top + rect.height / 2 - height / 2 - areaRect.top,
		width,
		height,
		zoom,
	};
};

/** X/Y for a box (px, from the area's top-left), counted inward from the anchor as layerProps reads them. */
export const offsetsFor = (box, area, anchor) => {
	const [vertical, horizontal] = anchor.split('-');

	const x = 'right' === horizontal ? area.width - box.left - box.width
		: 'center' === horizontal ? box.left + box.width / 2 - area.width / 2
			: box.left;
	const y = 'bottom' === vertical ? area.height - box.top - box.height
		: 'middle' === vertical ? box.top + box.height / 2 - area.height / 2
			: box.top;

	return { x, y };
};

/** The slide's padding in px around a layer placed straight in it; null inside a group. */
export const slidePad = (element) => {
	const area = layerArea(element);
	const item = area?.classList.contains('bsb-slide-content') ? area.parentElement : null;

	if (!item) {
		return null;
	}

	const look = getComputedStyle(item);

	return { left: parseFloat(look.paddingLeft) || 0, top: parseFloat(look.paddingTop) || 0, right: parseFloat(look.paddingRight) || 0, bottom: parseFloat(look.paddingBottom) || 0 };
};

/** The values a box comes to, in the units the layer already uses; auto sizes become px once resized. */
export const desktopForBox = (offset, box, area, sized = {}, pad = null) => {
	// Screen px back to the layer's own: a scaled-down layer's px count larger; % is a share of the area either way.
	const valueOf = (px, unit, size) => fromPx('%' === unit ? px : px / (box.zoom || 1), unit, size);

	// Full slide: offsets from the slide's edges, padding and all; % still reads the content area, as CSS does.
	const full = 'slide' === offset.area && pad;
	const frameBox = full ? { ...box, left: box.left + pad.left, top: box.top + pad.top } : box;
	const frame = full ? { width: area.width + pad.left + pad.right, height: area.height + pad.top + pad.bottom } : area;

	const { x, y } = offsetsFor(frameBox, frame, offset.anchor || 'top-left');
	const next = { ...offset, x: valueOf(x, offset.xUnit, area.width), y: valueOf(y, offset.yUnit, area.height) };

	if (sized.w) {
		next.w = valueOf(box.width, offset.wUnit, area.width);
	}

	if (sized.h) {
		next.h = valueOf(box.height, offset.hUnit, area.height);
	}

	return next;
};

/** An arrow press: right and bottom anchors count inward, so they run the other way; % moves the px's share of the area. */
export const nudgedDesktop = (offset, key, shift, area) => {
	const [vertical, horizontal] = (offset.anchor || 'top-left').split('-');
	const step = shift ? 10 : 1;

	const dx = ARROWS[key][0] * step * ('right' === horizontal ? -1 : 1);
	const dy = ARROWS[key][1] * step * ('bottom' === vertical ? -1 : 1);

	const nudged = (value, unit, size, delta) => ('%' === unit
		? Math.round(((Number(value) || 0) + delta / (size || 1) * 100) * 10) / 10
		: (Number(value) || 0) + delta);

	return { ...offset, x: nudged(offset.x, offset.xUnit, area?.width, dx), y: nudged(offset.y, offset.yUnit, area?.height, dy) };
};

/** Drawn straight onto the element while dragging; the attributes change once, on release. */
export const previewOn = (element, layer, desktop) => {
	const { style } = buildLayerProps({ ...layer, position: { ...layer.position, desktop } }, { live: true });

	PREVIEWED.forEach(key => {
		element.style[key] = style[key] || '';
	});
};

/** Snap lines (area px): the area's edges and centre, then every other block's edges and centre. */
export const snapLines = (exclude, areaEl, areaRect) => {
	const skip = exclude instanceof Set ? exclude : new Set([exclude]);
	const xs = [0, areaRect.width / 2, areaRect.width];
	const ys = [0, areaRect.height / 2, areaRect.height];

	[...areaEl.children].forEach(node => {
		if (skip.has(node) || !node.dataset?.block) {
			return;
		}

		const r = node.getBoundingClientRect();

		if (r.width || r.height) {
			xs.push(r.left - areaRect.left, r.left + r.width / 2 - areaRect.left, r.right - areaRect.left);
			ys.push(r.top - areaRect.top, r.top + r.height / 2 - areaRect.top, r.bottom - areaRect.top);
		}
	});

	return { xs, ys };
};

/** The closest line to any of the points, within the snap distance. */
export const nearest = (lines, points) => {
	let best = null;

	points.forEach(point => lines.forEach(line => {
		const delta = line - point;

		if (Math.abs(delta) <= SNAP && (!best || Math.abs(delta) < Math.abs(best.delta))) {
			best = { delta, line };
		}
	}));

	return best;
};

/** A layer's stacking number; unset counts as 0, where block order decides. */
export const zOf = (layer) => (Number.isInteger(layer?.position?.desktop?.z) ? layer.position.desktop.z : 0);

/** The z-index one layer moves to among the others: front/back past all of them, forward/backward past the next one. */
export const zFor = (action, mine, others) => {
	if (!others.length) {
		return mine;
	}

	if ('front' === action) {
		return Math.max(...others) + 1;
	}

	if ('back' === action) {
		return Math.min(...others) - 1;
	}

	if ('forward' === action) {
		const above = others.filter(z => z >= mine);
		return above.length ? Math.min(...above) + 1 : mine;
	}

	const below = others.filter(z => z <= mine);
	return below.length ? Math.max(...below) - 1 : mine;
};

/** The new z-indexes, lifted together when one would drop below 0: there a layer goes behind the slide's plain blocks. */
export const zAboveFlow = (moved, others) => {
	const all = { ...others, ...moved };
	const low = Math.min(...Object.values(all));

	return low >= 0 ? moved : Object.fromEntries(Object.entries(all).map(([id, z]) => [id, z - low]));
};

/** Several layers' z-indexes as one undo step. */
export const writeZ = (zs) => {
	const editor = select('core/block-editor');
	const attributes = Object.fromEntries(Object.entries(zs).map(([id, z]) => {
		const layer = editor.getBlockAttributes(id)?.bsbLayer || {};

		return [id, { bsbLayer: { ...layer, position: { ...layer.position, desktop: { ...(layer.position?.desktop || {}), z } } } }];
	}));

	dispatch('core/block-editor').updateBlockAttributes(Object.keys(attributes), attributes, { uniqueByBlock: true });
};

/** The other absolute layers beside this one, by id, with their z-index. */
export const siblingZs = (clientId, skip = new Set([clientId])) => {
	const editor = select('core/block-editor');

	return Object.fromEntries(editor.getBlockOrder(editor.getBlockRootClientId(clientId))
		.filter(id => !skip.has(id) && editor.getBlockAttributes(id)?.bsbLayer?.position?.absolute)
		.map(id => [id, zOf(editor.getBlockAttributes(id).bsbLayer)]));
};

/** Front/back for several layers at once: they keep their order among themselves, all past every other layer. */
export const zForGroup = (action, selected, others) => {
	const order = [...selected].sort((a, b) => a.z - b.z);
	const base = 'front' === action
		? (others.length ? Math.max(...others) : 0) + 1
		: (others.length ? Math.min(...others) : 0) - order.length;

	return Object.fromEntries(order.map((item, i) => [item.id, base + i]));
};

/** Draws the line an edge snapped to, or hides it. */
export const showGuide = (ref, line, axis, areaRect) => {
	if (!ref.current) {
		return;
	}

	if (!line) {
		ref.current.style.display = 'none';
		return;
	}

	Object.assign(ref.current.style, 'x' === axis
		? { display: 'block', left: `${areaRect.left + line.line}px`, top: `${areaRect.top}px`, width: '1px', height: `${areaRect.height}px` }
		: { display: 'block', left: `${areaRect.left}px`, top: `${areaRect.top + line.line}px`, width: `${areaRect.width}px`, height: '1px' });
};

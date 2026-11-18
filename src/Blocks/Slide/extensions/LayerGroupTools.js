import { __ } from '@wordpress/i18n';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { ARROWS, desktopForBox, slidePad, findBlockElement, layerArea, layoutBox, nearest, nudgedDesktop, previewOn, showGuide, siblingZs, snapLines, writeZ, zAboveFlow, zForGroup, zOf } from './layerGeometry';
import { ORDER_ACTIONS } from './layerOrderActions';
import { layerOn, useLayerDevice } from './layerDevice';
import { placeWith } from '../../../utils/layerDevices';

const EMPTY = {};

const icon = (rects) => <svg viewBox='0 0 24 24' width='18' height='18' aria-hidden='true'>
	{rects.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx='1' fill='currentColor' />)}
</svg>;

// Each button: what it lines up (or spreads), and on which axis.
const ACTIONS = [
	{ key: 'left', label: __('Align left edges', 'b-slider'), svg: icon([[3, 3, 2, 18], [7, 6, 12, 4], [7, 14, 8, 4]]) },
	{ key: 'centerX', label: __('Align centres horizontally', 'b-slider'), svg: icon([[11, 3, 2, 18], [5, 6, 14, 4], [7, 14, 10, 4]]) },
	{ key: 'right', label: __('Align right edges', 'b-slider'), svg: icon([[19, 3, 2, 18], [5, 6, 12, 4], [9, 14, 8, 4]]) },
	{ key: 'top', label: __('Align top edges', 'b-slider'), svg: icon([[3, 3, 18, 2], [6, 7, 4, 12], [14, 7, 4, 8]]) },
	{ key: 'centerY', label: __('Align middles vertically', 'b-slider'), svg: icon([[3, 11, 18, 2], [6, 5, 4, 14], [14, 7, 4, 10]]) },
	{ key: 'bottom', label: __('Align bottom edges', 'b-slider'), svg: icon([[3, 19, 18, 2], [6, 5, 4, 12], [14, 9, 4, 8]]) },
	{ key: 'spreadX', label: __('Space evenly side to side (3 or more)', 'b-slider'), svg: icon([[2, 6, 4, 12], [10, 6, 4, 12], [18, 6, 4, 12]]), min: 3 },
	{ key: 'spreadY', label: __('Space evenly top to bottom (3 or more)', 'b-slider'), svg: icon([[6, 2, 12, 4], [6, 10, 12, 4], [6, 18, 12, 4]]), min: 3 },
];

/** Bar under two or more selected absolute layers of one slide: move them together, line them up, space them out. */
const LayerGroupTools = ({ ids }) => {
	const barRef = useRef(null);
	const moveRef = useRef(null);
	const guideXRef = useRef(null);
	const guideYRef = useRef(null);
	const dragRef = useRef(null);
	const nudgeRef = useRef(null);
	const [doc, setDoc] = useState(null);

	// A flat map of the store's own objects, so the shallow compare only re-renders when a layer really changes.
	const layers = useSelect(select => {
		const editor = select('core/block-editor');
		const map = {};

		ids.forEach(id => {
			map[id] = editor.getBlockAttributes(id)?.bsbLayer || EMPTY;
		});

		return map;
	}, [ids.join()]);
	const device = useLayerDevice();
	const { updateBlockAttributes, __unstableMarkLastChangeAsPersistent: markPersistent } = useDispatch('core/block-editor');
	const { getBlockAttributes } = useSelect(select => select('core/block-editor'), []);

	// Arrow presses can outrun the re-render, so they build on the last press's values.
	const layersRef = useRef(layers);
	layersRef.current = layers;

	/** The selected, unlocked absolute layers in the first one's slide, with their elements and the slide's content area. */
	const members = () => {
		const first = findBlockElement(ids[0]);
		const areaEl = layerArea(first);

		if (!areaEl) {
			return null;
		}

		const list = ids
			.map(id => ({ id, el: findBlockElement(id), layer: layerOn(layersRef.current[id], device) }))
			// A locked layer stays where it is, so it sits out of every group move.
			.filter(m => m.el && layerArea(m.el) === areaEl && m.layer?.position?.absolute && !getBlockAttributes(m.id)?.lock?.move);

		return list.length > 1 ? { list, areaEl, areaRect: areaEl.getBoundingClientRect() } : null;
	};

	useEffect(() => {
		setDoc(findBlockElement(ids[0])?.ownerDocument || null);
	}, [ids.join()]);

	// Follows the selection every frame; sits under it, clear of Gutenberg's toolbar above.
	useEffect(() => {
		const view = doc?.defaultView;

		if (!view) {
			return undefined;
		}

		let frame;
		const follow = () => {
			const group = members();

			if (barRef.current) {
				if (!group) {
					barRef.current.style.display = 'none';
				} else {
					const rects = group.list.map(m => m.el.getBoundingClientRect());
					const left = Math.min(...rects.map(r => r.left));
					const bottom = Math.max(...rects.map(r => r.bottom));

					Object.assign(barRef.current.style, { display: '', left: `${left}px`, top: `${bottom + 10}px` });
				}
			}

			frame = view.requestAnimationFrame(follow);
		};

		follow();

		const onKey = (event) => {
			if (event.target === moveRef.current && event.key.startsWith('Arrow')) {
				event.stopImmediatePropagation();
				nudgeRef.current?.(event);
			}
		};

		view.addEventListener('keydown', onKey, true);

		// Stopped on the bar itself: Gutenberg's click selection listens natively at the canvas root and would drop the multi-selection.
		const bar = barRef.current;
		const keepSelection = (event) => {
			event.preventDefault();
			event.stopPropagation();
		};

		bar?.addEventListener('mousedown', keepSelection);

		return () => {
			view.cancelAnimationFrame(frame);
			view.removeEventListener('keydown', onKey, true);
			bar?.removeEventListener('mousedown', keepSelection);
		};
	}, [doc]);

	if (!doc) {
		return null;
	}

	/** One update for every layer, so the whole change is one undo step. */
	const commit = (desktops) => {
		const attributes = {};

		Object.entries(desktops).forEach(([id, desktop]) => {
			const layer = layersRef.current[id];
			attributes[id] = { bsbLayer: { ...layer, position: placeWith(layer.position, device, desktop) } };
		});

		updateBlockAttributes(Object.keys(attributes), attributes, { uniqueByBlock: true });
	};

	/** Moves each layer by its own screen shift from its starting box, written in its own anchor and units. */
	const shifted = (group, shifts, boxes = group.list.map(m => layoutBox(m.el, group.areaRect))) => {
		const area = { width: group.areaRect.width || 1, height: group.areaRect.height || 1 };
		const desktops = {};
		const pad = slidePad(group.list[0].el);

		group.list.forEach((m, i) => {
			const box = { ...boxes[i] };

			box.left += shifts[i].dx;
			box.top += shifts[i].dy;
			desktops[m.id] = desktopForBox(m.layer.position?.desktop || {}, box, area, {}, pad);
		});

		return desktops;
	};

	/** Lines up or spreads the layers by the space each takes on screen, so a turned layer counts by its bounds. */
	const arrange = (key) => {
		const group = members();

		if (!group) {
			return;
		}

		const rects = group.list.map(m => m.el.getBoundingClientRect());
		const minL = Math.min(...rects.map(r => r.left));
		const maxR = Math.max(...rects.map(r => r.right));
		const minT = Math.min(...rects.map(r => r.top));
		const maxB = Math.max(...rects.map(r => r.bottom));
		const shifts = rects.map(() => ({ dx: 0, dy: 0 }));

		if ('spreadX' === key || 'spreadY' === key) {
			if (rects.length < 3) {
				return;
			}

			const along = 'spreadX' === key;
			const order = rects.map((r, i) => i).sort((a, b) => (along ? rects[a].left - rects[b].left : rects[a].top - rects[b].top));
			const total = order.reduce((sum, i) => sum + (along ? rects[i].width : rects[i].height), 0);
			const gap = ((along ? maxR - minL : maxB - minT) - total) / (order.length - 1);
			let cursor = along ? minL : minT;

			order.forEach(i => {
				if (along) {
					shifts[i].dx = cursor - rects[i].left;
					cursor += rects[i].width + gap;
				} else {
					shifts[i].dy = cursor - rects[i].top;
					cursor += rects[i].height + gap;
				}
			});
		} else {
			rects.forEach((r, i) => {
				if ('left' === key) shifts[i].dx = minL - r.left;
				if ('right' === key) shifts[i].dx = maxR - r.right;
				if ('centerX' === key) shifts[i].dx = (minL + maxR) / 2 - (r.left + r.width / 2);
				if ('top' === key) shifts[i].dy = minT - r.top;
				if ('bottom' === key) shifts[i].dy = maxB - r.bottom;
				if ('centerY' === key) shifts[i].dy = (minT + maxB) / 2 - (r.top + r.height / 2);
			});
		}

		commit(shifted(group, shifts));
		markPersistent?.();
	};

	/** Front/back for the whole selection: past every other layer in the slide, keeping their own order. */
	const restack = (action) => {
		const group = members();

		if (!group) {
			return;
		}

		// Back stays in front of the slide's plain blocks: the other layers are lifted instead.
		const others = siblingZs(group.list[0].id, new Set(group.list.map(m => m.id)));
		const zs = zForGroup(action, group.list.map(m => ({ id: m.id, z: zOf(m.layer) })), Object.values(others));

		writeZ(zAboveFlow(zs, others));
		markPersistent?.();
	};

	const onPointerDown = (event) => {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);
		event.currentTarget.focus({ preventScroll: true });

		const group = members();

		if (!group) {
			return;
		}

		const rects = group.list.map(m => m.el.getBoundingClientRect());
		const union = {
			left: Math.min(...rects.map(r => r.left)) - group.areaRect.left,
			top: Math.min(...rects.map(r => r.top)) - group.areaRect.top,
			right: Math.max(...rects.map(r => r.right)) - group.areaRect.left,
			bottom: Math.max(...rects.map(r => r.bottom)) - group.areaRect.top,
		};

		dragRef.current = {
			group,
			union,
			// Read once: the preview moves the elements, so later reads would count the move twice.
			boxes: group.list.map(m => layoutBox(m.el, group.areaRect)),
			startX: event.clientX,
			startY: event.clientY,
			lines: snapLines(new Set(group.list.map(m => m.el)), group.areaEl, group.areaRect),
			desktops: null,
		};
	};

	const onPointerMove = (event) => {
		const drag = dragRef.current;

		if (!drag) {
			return;
		}

		let dx = event.clientX - drag.startX;
		let dy = event.clientY - drag.startY;
		const { union } = drag;

		// The group's outer box snaps as one, like a single layer.
		const snapX = nearest(drag.lines.xs, [union.left + dx, (union.left + union.right) / 2 + dx, union.right + dx]);
		const snapY = nearest(drag.lines.ys, [union.top + dy, (union.top + union.bottom) / 2 + dy, union.bottom + dy]);
		dx += snapX?.delta || 0;
		dy += snapY?.delta || 0;

		showGuide(guideXRef, snapX, 'x', drag.group.areaRect);
		showGuide(guideYRef, snapY, 'y', drag.group.areaRect);

		drag.desktops = shifted(drag.group, drag.group.list.map(() => ({ dx, dy })), drag.boxes);
		drag.group.list.forEach(m => previewOn(m.el, m.layer, drag.desktops[m.id]));
	};

	const onPointerUp = (event) => {
		const drag = dragRef.current;

		if (!drag) {
			return;
		}

		event.currentTarget.releasePointerCapture(event.pointerId);
		dragRef.current = null;
		showGuide(guideXRef, null);
		showGuide(guideYRef, null);

		if (drag.desktops) {
			commit(drag.desktops);
			markPersistent?.();
		}
	};

	/** Arrow keys on the focused move handle move every layer by the same step. */
	nudgeRef.current = (event) => {
		if (!ARROWS[event.key]) {
			return;
		}

		event.preventDefault();

		const group = members();

		if (!group) {
			return;
		}

		const desktops = {};

		group.list.forEach(m => {
			desktops[m.id] = nudgedDesktop(m.layer.position?.desktop || {}, event.key, event.shiftKey, group.areaRect);
			const layer = layersRef.current[m.id];

			layersRef.current = { ...layersRef.current, [m.id]: { ...layer, position: placeWith(layer.position, device, desktops[m.id]) } };
		});

		commit(desktops);
	};

	const count = members()?.list.length || 0;

	return createPortal(
		<>
			<div ref={barRef} className='bsb-layer-group-bar'>
				<button
					ref={moveRef}
					type='button'
					className='bsb-layer-group-move'
					aria-label={__('Drag to move the selected layers, or click and use the arrow keys', 'b-slider')}
					title={__('Drag to move together · Click, then arrow keys to nudge (Shift: 10px)', 'b-slider')}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
				>
					<svg viewBox='0 0 24 24' width='16' height='16' aria-hidden='true'>
						<path fill='currentColor' d='M12 2l3 3h-2v4h-2V5H9l3-3zm0 20l-3-3h2v-4h2v4h2l-3 3zM2 12l3-3v2h4v2H5v2l-3-3zm20 0l-3 3v-2h-4v-2h4V9l3 3z' />
					</svg>
				</button>

				{ACTIONS.map(action => <button
					key={action.key}
					type='button'
					className='bsb-layer-group-action'
					aria-label={action.label}
					title={action.label}
					disabled={count < (action.min || 2)}
					onClick={() => arrange(action.key)}
				>
					{action.svg}
				</button>)}

				<span className='bsb-layer-group-divider' />

				{ORDER_ACTIONS.filter(action => 'front' === action.key || 'back' === action.key).map(action => <button
					key={action.key}
					type='button'
					className='bsb-layer-group-action'
					aria-label={action.label}
					title={action.label}
					onClick={() => restack(action.key)}
				>
					{action.svg}
				</button>)}

			</div>

			<div ref={guideXRef} className='bsb-layer-guide' />
			<div ref={guideYRef} className='bsb-layer-guide' />
		</>,
		doc.body
	);
};

export default LayerGroupTools;

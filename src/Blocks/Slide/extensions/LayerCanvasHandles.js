import { __ } from '@wordpress/i18n';
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { ARROWS, desktopForBox, slidePad, findBlockElement, layerArea, layoutBox, nearest, normalise, nudgedDesktop, previewOn, showGuide, snapLines, zoomOf } from './layerGeometry';

const RESIZERS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const MIN_SIZE = 10;
const ROTATE_STEP = 15;
const ROTATE_DEAD_ZONE = 3;
const ROTATE_ZERO_PULL = 3;

/** Move, rotate and eight resize handles on a selected absolute layer; a release writes the panel's values once. */
const LayerCanvasHandles = ({ clientId, layer, update }) => {
	const [element, setElement] = useState(null);
	const moveRef = useRef(null);
	const rotateRef = useRef(null);
	const frameRef = useRef(null);
	const guideXRef = useRef(null);
	const guideYRef = useRef(null);
	const dragRef = useRef(null);

	const offset = layer.position?.desktop || {};
	const angle = Number(offset.rotate) || 0;

	const { __unstableMarkLastChangeAsPersistent: markPersistent } = useDispatch('core/block-editor');

	// Gutenberg's own "Lock movement": the canvas handles stand down, the panel's numbers still work.
	const locked = useSelect(select => Boolean(select('core/block-editor').getBlockAttributes(clientId)?.lock?.move), [clientId]);

	// Inside a turned group the screen and the group's axes differ, so only the panel's numbers move the layer.
	const inTurnedGroup = useSelect(select => {
		const { getBlockParents, getBlockAttributes } = select('core/block-editor');

		return getBlockParents(clientId).some(id => Number(getBlockAttributes(id)?.bsbLayer?.position?.desktop?.rotate));
	}, [clientId]);

	// Arrow presses can outrun the re-render, so each builds on the last one's values rather than the rendered ones.
	const offsetRef = useRef(offset);
	offsetRef.current = offset;
	const nudgeRef = useRef(null);

	useEffect(() => {
		setElement(findBlockElement(clientId));
	}, [clientId]);

	// Caught on the window before Gutenberg's own arrow handling, which would move focus to the next control.
	useEffect(() => {
		const view = element?.ownerDocument?.defaultView;

		if (!view) {
			return undefined;
		}

		const onKey = (event) => {
			if (event.target === moveRef.current && event.key.startsWith('Arrow')) {
				event.stopImmediatePropagation();
				nudgeRef.current?.(event);
			}
		};

		view.addEventListener('keydown', onKey, true);

		return () => view.removeEventListener('keydown', onKey, true);
	}, [element]);

	// Follows the layer every frame, so scrolling, typing and slide changes never leave the handles behind.
	useEffect(() => {
		if (!element) {
			return undefined;
		}

		let frame;
		const follow = () => {
			// Gutenberg can swap the block's element, e.g. when slide tabs change.
			if (!element.isConnected) {
				setElement(findBlockElement(clientId));
				return;
			}

			const rect = element.getBoundingClientRect();
			const shown = rect.width || rect.height ? '' : 'none';
			const rotating = 'rotate' === dragRef.current?.mode;

			if (moveRef.current) {
				Object.assign(moveRef.current.style, { display: shown, left: `${rect.left - 30}px`, top: `${rect.top}px` });
			}

			// Below the layer: the block toolbar sits over the top edge and would take the pointer.
			if (rotateRef.current) {
				Object.assign(rotateRef.current.style, { display: shown, left: `${rect.right + 6}px`, top: `${rect.bottom + 6}px` });
			}

			// The layer's own box, turned with it, so each handle sits on the corner it resizes.
			if (frameRef.current) {
				const width = element.offsetWidth * zoomOf(element);
				const height = element.offsetHeight * zoomOf(element);

				Object.assign(frameRef.current.style, {
					display: rotating ? 'none' : shown,
					left: `${rect.left + rect.width / 2 - width / 2}px`,
					top: `${rect.top + rect.height / 2 - height / 2}px`,
					width: `${width}px`,
					height: `${height}px`,
					transform: angle ? `rotate(${angle}deg)` : '',
				});
			}

			frame = element.ownerDocument.defaultView.requestAnimationFrame(follow);
		};

		follow();

		return () => element.ownerDocument.defaultView.cancelAnimationFrame(frame);
	}, [element, clientId, angle]);

	if (!element) {
		return null;
	}

	const preview = (desktop) => previewOn(element, layer, desktop);

	const start = (mode) => (event) => {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);

		// preventDefault keeps focus off the button, so the move handle takes it by hand for the arrow keys.
		if ('move' === mode) {
			event.currentTarget.focus({ preventScroll: true });
		}

		const rect = element.getBoundingClientRect();
		const areaEl = layerArea(element);
		const areaRect = areaEl?.getBoundingClientRect() || rect;
		const centre = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		const box = layoutBox(element, areaRect);
		const theta = angle * Math.PI / 180;

		// The dragged handle's point (area px): the box's own corner or edge middle, turned with the layer.
		const localX = mode.includes('e') ? box.width / 2 : mode.includes('w') ? -box.width / 2 : 0;
		const localY = mode.includes('s') ? box.height / 2 : mode.includes('n') ? -box.height / 2 : 0;

		dragRef.current = {
			mode,
			startX: event.clientX,
			startY: event.clientY,
			centre,
			startAngle: Math.atan2(event.clientY - centre.y, event.clientX - centre.x) * 180 / Math.PI,
			theta,
			areaRect,
			area: { width: areaRect.width || 1, height: areaRect.height || 1 },
			box,
			bounds: { width: rect.width, height: rect.height },
			handlePoint: {
				x: box.left + box.width / 2 + localX * Math.cos(theta) - localY * Math.sin(theta),
				y: box.top + box.height / 2 + localX * Math.sin(theta) + localY * Math.cos(theta),
			},
			pad: slidePad(element),
			lines: areaEl ? snapLines(element, areaEl, areaRect) : null,
			desktop: offset,
		};
	};

	const onPointerMove = (event) => {
		const drag = dragRef.current;

		if (!drag) {
			return;
		}

		if ('rotate' === drag.mode) {
			// A click, or a twitch under a few px, is not a turn.
			if (!drag.engaged && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < ROTATE_DEAD_ZONE) {
				return;
			}

			drag.engaged = true;

			const pointer = Math.atan2(event.clientY - drag.centre.y, event.clientX - drag.centre.x) * 180 / Math.PI;
			const raw = normalise(angle + pointer - drag.startAngle);
			const stepped = event.shiftKey ? Math.round(raw / ROTATE_STEP) * ROTATE_STEP : Math.round(raw);
			const deg = normalise(Math.abs(stepped) <= ROTATE_ZERO_PULL ? 0 : stepped);

			drag.desktop = { ...offset, rotate: deg || undefined };
			preview(drag.desktop);
			return;
		}

		let dx = event.clientX - drag.startX;
		let dy = event.clientY - drag.startY;
		const box = { ...drag.box };
		const sized = { w: false, h: false };
		let snapX = null;
		let snapY = null;

		if ('move' === drag.mode) {
			box.left += dx;
			box.top += dy;

			// The upright bounds snap: for a turned layer that is the space it takes, as in Figma.
			if (drag.lines) {
				const cx = box.left + box.width / 2;
				const cy = box.top + box.height / 2;
				const halfW = drag.bounds.width / 2;
				const halfH = drag.bounds.height / 2;

				snapX = nearest(drag.lines.xs, [cx - halfW, cx, cx + halfW]);
				snapY = nearest(drag.lines.ys, [cy - halfH, cy, cy + halfH]);
				box.left += snapX?.delta || 0;
				box.top += snapY?.delta || 0;
			}
		} else {
			const cos = Math.cos(drag.theta);
			const sin = Math.sin(drag.theta);
			const isCorner = 2 === drag.mode.length;

			// The handle's point snaps; an edge handle only along the screen axis its edge mostly faces.
			if (drag.lines) {
				const facesX = Math.abs(cos) >= Math.abs(sin);
				const sideways = /[ew]/.test(drag.mode);
				const snapsX = isCorner || (sideways ? facesX : !facesX);
				const snapsY = isCorner || (sideways ? !facesX : facesX);

				snapX = snapsX ? nearest(drag.lines.xs, [drag.handlePoint.x + dx]) : null;
				snapY = snapsY ? nearest(drag.lines.ys, [drag.handlePoint.y + dy]) : null;
				dx += snapX?.delta || 0;
				dy += snapY?.delta || 0;
			}

			// The pull along the layer's own axes; the opposite edge stays put, so the centre moves half the change.
			const along = dx * cos + dy * sin;
			const across = -dx * sin + dy * cos;
			let shiftX = 0;
			let shiftY = 0;

			if (/[ew]/.test(drag.mode)) {
				const sign = drag.mode.includes('e') ? 1 : -1;

				box.width = Math.max(MIN_SIZE, drag.box.width + sign * along);
				shiftX = sign * (box.width - drag.box.width) / 2;
				sized.w = true;
			}

			if (/[ns]/.test(drag.mode)) {
				const sign = drag.mode.includes('s') ? 1 : -1;

				box.height = Math.max(MIN_SIZE, drag.box.height + sign * across);
				shiftY = sign * (box.height - drag.box.height) / 2;
				sized.h = true;
			}

			const cx = drag.box.left + drag.box.width / 2 + shiftX * cos - shiftY * sin;
			const cy = drag.box.top + drag.box.height / 2 + shiftX * sin + shiftY * cos;

			box.left = cx - box.width / 2;
			box.top = cy - box.height / 2;
		}

		showGuide(guideXRef, snapX, 'x', drag.areaRect);
		showGuide(guideYRef, snapY, 'y', drag.areaRect);

		drag.desktop = desktopForBox(offset, box, drag.area, sized, drag.pad);
		preview(drag.desktop);
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

		const changed = ['x', 'y', 'w', 'h', 'rotate'].some(key => drag.desktop[key] !== offset[key]);

		if (changed) {
			update('position', { desktop: drag.desktop });

			// Gutenberg merges back-to-back edits of one attribute into one undo step; each drag stays its own.
			markPersistent?.();
		}
	};

	const pointerProps = { onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onMouseDown: event => event.stopPropagation() };

	/** Arrow keys on the focused move handle: 1px, or 10 with Shift, counted the way the anchor and unit count. */
	const onNudge = (event) => {
		if (!ARROWS[event.key]) {
			return;
		}

		event.preventDefault();

		const desktop = nudgedDesktop(offsetRef.current, event.key, event.shiftKey, layerArea(element)?.getBoundingClientRect());

		offsetRef.current = desktop;
		update('position', { desktop });
	};

	nudgeRef.current = onNudge;

	return createPortal(
		<>
			{locked && <span ref={moveRef} className='bsb-layer-lock-badge' title={__('Position locked', 'b-slider')}>
				<svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true'>
					<path fill='currentColor' d='M17 10V8A5 5 0 0 0 7 8v2H5v11h14V10h-2zM9 8a3 3 0 0 1 6 0v2H9V8z' />
				</svg>
			</span>}

			{!locked && !inTurnedGroup && <button
				ref={moveRef}
				type='button'
				className='bsb-layer-drag-handle'
				aria-label={__('Drag to move the layer, or click and use the arrow keys', 'b-slider')}
				title={__('Drag to move · Click, then arrow keys to nudge (Shift: 10px)', 'b-slider')}
				onPointerDown={start('move')}
				{...pointerProps}
			>
				<svg viewBox='0 0 24 24' width='16' height='16' aria-hidden='true'>
					<path fill='currentColor' d='M12 2l3 3h-2v4h-2V5H9l3-3zm0 20l-3-3h2v-4h2v4h2l-3 3zM2 12l3-3v2h4v2H5v2l-3-3zm20 0l-3 3v-2h-4v-2h4V9l3 3z' />
				</svg>
			</button>}

			{!locked && !inTurnedGroup && <button
				ref={rotateRef}
				type='button'
				className='bsb-layer-rotate-handle'
				aria-label={__('Drag to rotate the layer', 'b-slider')}
				title={__('Drag to rotate (Shift: 15° steps)', 'b-slider')}
				onPointerDown={start('rotate')}
				{...pointerProps}
			>
				<svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true'>
					<path fill='currentColor' d='M12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35A7.96 7.96 0 0 0 12 4z' />
				</svg>
			</button>}

			<div ref={guideXRef} className='bsb-layer-guide' />
			<div ref={guideYRef} className='bsb-layer-guide' />

			{!locked && !inTurnedGroup && <div ref={frameRef} className='bsb-layer-resize-frame'>
				{RESIZERS.map(dir => <span
					key={dir}
					className={`bsb-layer-resize-handle is-${dir}`}
					aria-hidden='true'
					onPointerDown={start(dir)}
					{...pointerProps}
				/>)}
			</div>}
		</>,
		element.ownerDocument.body
	);
};

export default LayerCanvasHandles;

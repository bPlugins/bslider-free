import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as blocksStore } from '@wordpress/blocks';

/**
 * When each layer arrives, as one picture — and a number to change it with.
 *
 * The panel is a view onto attributes that already exist: every row reads and writes
 * `bsbLayer.entry.delay` on a child block, the same number the Animation panel's own delay
 * control sets. Nothing here is a new setting, so the front end needs no new code — a row set to
 * 0.4 produces exactly what typing 0.4 into that control produces.
 *
 * The bars are for reading, not for grabbing. A sidebar is a few hundred pixels wide, so a
 * two-second timeline puts 0.05s under three pixels: aiming at that is worse than typing, and a
 * drag that lands one step off is harder to correct than a number that was simply wrong. So the
 * bar shows where the layer sits and a `NumberControl` beside it says exactly where.
 *
 * Only layers with an entry effect appear. A block with no animation has no arrival to place on
 * a timeline, and listing it would fill the panel with rows that do nothing.
 */

/** animate.css's own default, which is what a layer runs at when it names no duration. */
const DEFAULT_DURATION = 1;

/** Seconds of timeline drawn when the layers themselves need less — a scale to read against. */
const MIN_SPAN = 2;

/** The same ceiling and step the Animation panel's delay control uses. */
const MAX_DELAY = 5;
const STEP = 0.05;

const VisualTimelinePanel = ({ clientId, stagger = 0 }) => {
	const { updateBlockAttributes, selectBlock } = useDispatch(blockEditorStore);

	/**
	 * The slide's own children, in the order they animate.
	 *
	 * `getBlocks` rather than `getBlock(...).innerBlocks` so the panel re-renders when a child's
	 * attributes change — a delay set from the Animation panel moves its bar here immediately.
	 */
	const layers = useSelect(select => {
		const children = select(blockEditorStore).getBlocks(clientId) || [];
		const { getBlockType } = select(blocksStore);

		return children
			.map((block, index) => {
				const entry = block.attributes?.bsbLayer?.entry || {};

				if (!entry.effect) {
					return null;
				}

				return {
					clientId: block.clientId,
					title: getBlockType(block.name)?.title || block.name,
					effect: entry.effect,
					// The layer's own delay wins; without one it takes its turn in the stagger,
					// which is the same rule `playEntry` follows at runtime.
					delay: undefined === entry.delay ? index * stagger : entry.delay,
					isStaggered: undefined === entry.delay && stagger > 0,
					duration: entry.duration ?? DEFAULT_DURATION,
				};
			})
			.filter(Boolean);
	}, [clientId, stagger]);

	if (!layers.length) {
		return <p className="bsb_field_group_hint">
			{__('Give a block inside this slide an entry animation, and it will appear here.', 'b-slider')}
		</p>;
	}

	// The scale, rounded up to the next half second so the ruler lands on readable marks.
	const latest = Math.max(...layers.map(layer => layer.delay + layer.duration));
	const span = Math.max(MIN_SPAN, Math.ceil(latest * 2) / 2);
	const percent = seconds => `${(seconds / span) * 100}%`;

	/**
	 * Writes one layer's delay, merging rather than replacing.
	 *
	 * `bsbLayer` holds every other section too — exit, loop, hover — so the whole attribute is
	 * read back and spread. Rounded to two places because a raw number field can hand back
	 * anything, and the value ends up in an inline style on the page.
	 */
	const setDelay = (layer, value) => {
		const seconds = Math.min(MAX_DELAY, Math.max(0, parseFloat(value) || 0));
		const current = layer.attributes?.bsbLayer || {};

		updateBlockAttributes(layer.clientId, {
			bsbLayer: {
				...current,
				entry: { ...(current.entry || {}), delay: parseFloat(seconds.toFixed(2)) },
			},
		});
	};

	return <div className="bsbTimeline">
		{layers.map((layer, index) => <div className="bsbTimelineRow" key={layer.clientId}>
			<button
				type="button"
				className="bsbTimelineName"
				onClick={() => selectBlock(layer.clientId)}
				title={sprintf(
					/* translators: 1: effect name, 2: duration in seconds. */
					__('%1$s — runs for %2$ss. Click to select this block.', 'b-slider'),
					layer.effect,
					layer.duration.toFixed(2)
				)}
			>
				<span className="bsbTimelineIndex">{index + 1}</span>
				{layer.title}
			</button>

			<div className="bsbTimelineTrack">
				<div
					className={`bsbTimelineBar${layer.isStaggered ? ' isStaggered' : ''}`}
					style={{ left: percent(layer.delay), width: percent(layer.duration) }}
				/>
			</div>

			<TimelineDelay layer={layer} onChange={setDelay} />
		</div>)}

		<div className="bsbTimelineRuler">
			<span>0s</span>
			<span>{(span / 2).toFixed(1)}s</span>
			<span>{span.toFixed(1)}s</span>
		</div>
	</div>;
};

/**
 * One row's delay field.
 *
 * Split out so it can read its own block's attributes: `setDelay` has to merge into the layer as
 * it stands right now, and the list above is a snapshot taken when the panel last rendered.
 */
const TimelineDelay = ({ layer, onChange }) => {
	const attributes = useSelect(
		select => select(blockEditorStore).getBlockAttributes(layer.clientId),
		[layer.clientId]
	);

	return <NumberControl
		className="bsbTimelineDelay"
		value={layer.delay}
		onChange={value => onChange({ ...layer, attributes }, value)}
		min={0}
		max={MAX_DELAY}
		step={STEP}
		spinControls="native"
		hideLabelFromVision
		label={sprintf(
			/* translators: %s is a block name, e.g. Heading. */
			__('Delay for %s, in seconds', 'b-slider'),
			layer.title
		)}
	/>;
};

export default VisualTimelinePanel;

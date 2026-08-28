import { addFilter } from '@wordpress/hooks';

/**
 * A bSlider cannot go inside a bSlider's slide.
 *
 * The two work against each other at every level: they share Bootstrap's carousel classes, the
 * outer slider carries its slides as a string in which the inner one is only inert markup until
 * something mounts it, and each slider's scoped CSS reaches into the other's slides. It can be
 * made to hold, but it is a lot of machinery in aid of a layout nobody asks for — a slider
 * inside a slide is a thing to scroll past twice.
 *
 * A filter rather than `allowedBlocks` on the slide's `InnerBlocks`: a slide takes any block
 * there is, this plugin's own and other people's alike, so the rule has to name the one thing
 * that is not allowed rather than list everything that is. It also covers paste and drag, which
 * an `allowedBlocks` list does not always reach.
 *
 * The hook name is core's `__unstable` one — the only place this decision can be made. Its
 * fourth argument carries bound selectors rather than `select`, so the check uses those.
 */
addFilter(
	'blockEditor.__unstableCanInsertBlockType',
	'bsb/no-nested-slider',
	(canInsert, blockType, rootClientId, { getBlock, getBlockParentsByBlockName }) => {
		if ('bsb/slider' !== blockType.name || !rootClientId) {
			return canInsert;
		}

		// Two tests, because they answer different halves of the same question:
		// `getBlockParentsByBlockName` walks strictly upwards and never returns the block it was
		// asked about, so on its own it would miss the plain case of dropping a slider straight
		// into a slide. `getBlock` covers that; the parent walk covers a slider further down,
		// inside a Columns or Group block that is itself in a slide.
		const isSlide = 'bsb/slide' === getBlock(rootClientId)?.name;
		const isInsideSlide = getBlockParentsByBlockName(rootClientId, 'bsb/slide', false).length > 0;

		return (isSlide || isInsideSlide) ? false : canInsert;
	}
);

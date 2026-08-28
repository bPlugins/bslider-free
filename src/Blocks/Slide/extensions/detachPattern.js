import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * A pattern dropped into a slide becomes ordinary blocks.
 *
 * WordPress marks the top block of an inserted pattern with `metadata.patternName`, and puts
 * every block under that mark into `contentOnly` editing mode: the text and the images can be
 * changed, and nothing else can — no block settings, and none of this plugin's own panels. On a
 * page that is a kindness, keeping a carefully built pattern from being pulled apart by accident.
 *
 * In a slide it is the opposite of what the author came for. A slide's layers exist to be given
 * an entry animation, a loop, a hover, a font; a pattern is a quick way to lay several of them
 * out at once, not a request to freeze them. So the mark is taken off, and the blocks are the
 * slide's own from the moment they land in it.
 *
 * This is precisely what core's own "Detach" does for an unsynced pattern — see
 * `patterns.js`, which spreads `patternName` out of the metadata and writes the rest back. The
 * difference is only that it does not wait to be asked.
 *
 * Synced patterns are a different thing and are left alone: `core/block` holds a reference to a
 * post shared by every use of it, so there are no blocks here to unmark — and a setting written
 * there would reach every other place that pattern appears. Detaching one is the author's call,
 * and WordPress already offers it in the block's own menu.
 */
const withPatternInSlide = createHigherOrderComponent((BlockEdit) => (props) => {
	const { clientId, attributes, setAttributes } = props;

	const patternName = attributes?.metadata?.patternName;

	const isInsideSlide = useSelect(
		select => Boolean(patternName)
			&& select(blockEditorStore).getBlockParentsByBlockName(clientId, 'bsb/slide').length > 0,
		[patternName, clientId]
	);

	useEffect(() => {
		if (!isInsideSlide) {
			return;
		}

		// Everything else in `metadata` stays — a block's name, its bindings, anything another
		// plugin keeps there. Only the pattern mark goes.
		const rest = { ...(attributes.metadata || {}) };
		delete rest.patternName;

		setAttributes({ metadata: Object.keys(rest).length ? rest : undefined });
	}, [isInsideSlide]);

	return <BlockEdit {...props} />;
}, 'withBsbPatternInSlide');

addFilter('editor.BlockEdit', 'bsb/pattern-in-slide', withPatternInSlide);

import { addFilter } from '@wordpress/hooks';
import { canCarryLayer } from './allowedLayerBlocks';

/**
 * One attribute, `bsbLayer`, added to every block a slide can hold.
 *
 * Registration cannot be narrowed to blocks that are actually inside a slide: this filter is
 * handed a block *type*, not an instance, so there is no clientId to ask about and no ancestry
 * to check. Emptiness is the gate instead — the default `{}` produces no class, no style and no
 * data attribute (see `buildLayerProps`), so a Heading anywhere else on the site keeps emitting
 * byte-identical HTML. The controls are what get gated by ancestry, in `LayerControls.js`.
 *
 * One object rather than six flat attributes, so a new setting later needs no further change to
 * the schema of blocks this plugin does not own.
 *
 * Note the ordering requirement: a `blocks.registerBlockType` filter only reaches blocks
 * registered after it runs. That holds here because core's own blocks are registered from the
 * editor's inline bootstrap script, which the browser runs after every enqueued script — this
 * one included. Worth re-checking with `wp.blocks.getBlockType('core/heading').attributes` in
 * the console if the panel ever stops appearing.
 */
addFilter('blocks.registerBlockType', 'bsb/layer-attributes', (settings, name) => {
	if (!canCarryLayer(name)) {
		return settings;
	}

	return {
		...settings,
		attributes: {
			...settings.attributes,
			bsbLayer: { type: 'object', default: {} },
		},
	};
});

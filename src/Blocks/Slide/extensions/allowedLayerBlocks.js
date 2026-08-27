/**
 * The blocks that cannot carry layer settings.
 *
 * A slide takes any block at all, this plugin's own and other people's alike, so the layer
 * system works from an exclusion list rather than an allow list — a new block from any plugin
 * should get the animation controls without this file having to hear about it first.
 *
 * These two are the exceptions, and for the same reason: `blocks.getSaveContent.extraProps` can
 * only add a class, a style or a data attribute to a block's own root element, and neither of
 * these saves one. `core/shortcode` saves the shortcode text, `core/html` saves raw markup with
 * no wrapper of its own. Offering either an animation panel would be offering a control that
 * silently does nothing.
 */
const LAYER_INCAPABLE_BLOCKS = ['core/shortcode', 'core/html', 'core/freeform', 'core/missing'];

/** Whether this block type can be given an entry animation, a hover style or a click action. */
export const canCarryLayer = (name) => Boolean(name) && !LAYER_INCAPABLE_BLOCKS.includes(name);

/** The two blocks whose own text can be split into separately-animated words — Premium. */
export const WORD_STAGGER_BLOCKS = ['core/heading', 'core/paragraph'];

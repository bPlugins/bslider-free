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

/**
 * The blocks worth offering the count-up panel on — Premium.
 *
 * An allow list, and a short one: the count reads the figure out of the layer's own text and then
 * overwrites that text frame by frame, so it only belongs on a block whose text is the whole of
 * its content. A Group or a Columns holds other blocks, and counting one would mean writing a
 * number over its children.
 *
 * Narrower than `TEXT_LAYER_BLOCKS` on purpose. A list or a quote carries sentences rather than a
 * figure, and a button's label is a call to action — a statistic in any of them is possible but
 * unusual, and offering the panel everywhere would put a control nobody wants on every block.
 */
export const COUNTER_BLOCKS = ['core/heading', 'core/paragraph'];

/** Whether this block type should be offered the count-up panel. */
export const canCarryCounter = (name) => COUNTER_BLOCKS.includes(name);

/**
 * The blocks that carry text of their own, and so are worth a typography panel.
 *
 * An allow list here rather than the exclusion list above, and for the opposite reason: an
 * animation is worth offering on anything, but a font is only worth offering where there are
 * words to set in it. A Group or a Columns block has no text of its own — the text is in the
 * blocks inside it, each of which appears in this list on its own account.
 *
 * `core/button` is included but `core/buttons` is not: the label lives on the single button, and
 * the wrapper only arranges them.
 */
export const TEXT_LAYER_BLOCKS = [
	'core/heading',
	'core/paragraph',
	'core/list',
	'core/list-item',
	'core/quote',
	'core/pullquote',
	'core/verse',
	'core/preformatted',
	'core/button',
	'core/post-title',
	'core/post-excerpt',
	'core/post-date',
	'core/post-author',
	'core/post-terms',
];

/** Whether this block type should be offered the layer typography panel. */
export const canCarryTypography = (name) => TEXT_LAYER_BLOCKS.includes(name);

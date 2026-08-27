import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { slideStyles } from './slideStyles';
import { slideContentClass } from './slideContentClass';
import SlideOverlay from './SlideOverlay';

/**
 * A slide is a static block, so this is what the site renders.
 *
 * The styling is an inline `style` attribute rather than a stylesheet: whatever is written here
 * has to come back identical on every reload or WordPress calls the block invalid, and a
 * `<style>` built from a dozen optional settings does not survive that. See `slideStyles.js`.
 *
 * The content is wrapped so the overlay has siblings to sit over rather than being drawn on top
 * of everything: the overlay is `position: absolute` inside the slide, and the wrapper takes the
 * stacking position that keeps the content above it.
 */
const save = ({ attributes }) => {
	const { bsbStagger = 0, overlay } = attributes;

	return (
		<div {...useBlockProps.save({
			className: 'carousel-item',
			style: slideStyles(attributes),
			'data-bsb-stagger': bsbStagger || undefined,
		})}>
			<SlideOverlay overlay={overlay} />

			<div className={slideContentClass(attributes)} style={overlay ? { position: 'relative', zIndex: 1 } : undefined}>
				<InnerBlocks.Content />
			</div>
		</div>
	);
};

export default save;

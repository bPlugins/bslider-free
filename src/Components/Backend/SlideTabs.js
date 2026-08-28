import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { plus, trash } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * One row of slides across the top, and only the chosen one shown underneath.
 *
 * Stacking every slide down the canvas is what a `blocks` slider did first, because a slide
 * hidden at Bootstrap's `display: none` cannot be clicked into or typed in. It works, and it
 * makes the page as long as the slider has slides — ten slides is ten screens of scrolling to
 * reach the last one, in an editor where the slider itself only ever shows one at a time.
 *
 * So the hiding is done here instead, by index: the canvas shows one slide, this bar says which,
 * and a slide is only ever hidden while another is on show — never all of them at once, which is
 * the state the stack was avoiding.
 */
const SlideTabs = ({ clientId, activeSlide, setActiveSlide }) => {
	const { slides } = useSelect(select => ({
		slides: select(blockEditorStore).getBlock(clientId)?.innerBlocks || [],
	}), [clientId]);

	const { insertBlock, removeBlock, selectBlock } = useDispatch(blockEditorStore);

	const addSlide = () => {
		const slide = createBlock('bsb/slide');
		insertBlock(slide, slides.length, clientId, true);
		// Straight to the new one: adding a slide is a request to work on it, and leaving the
		// canvas on the old one makes it look as though nothing happened.
		setActiveSlide(slides.length);
	};

	const deleteSlide = (index, slideClientId) => {
		removeBlock(slideClientId, false);
		// Step back rather than hold the index: the slide that was there is gone, and holding
		// the number would land on the one after it, or past the end.
		setActiveSlide(Math.max(0, index - 1));
	};

	return <div className="bsb_slide_tabs">
		<div className="bsb_slide_tabs_list" role="tablist">
			{slides.map((slide, index) => (
				<div
					key={slide.clientId}
					className={`bsb_slide_tab ${index === activeSlide ? 'is-active' : ''}`}
				>
					<button
						type="button"
						role="tab"
						aria-selected={index === activeSlide}
						onClick={() => {
							setActiveSlide(index);
							// The slide itself, so its own panel — the stagger control — is what
							// the sidebar shows once the canvas has moved to it.
							selectBlock(slide.clientId);
						}}
					>
						{sprintf(
							/* translators: %d: slide number */
							__('Slide %d', 'b-slider'),
							index + 1
						)}
					</button>

					{/* The last slide stays: a slider with no slides has nothing to add one from,
					    since the inserter that would do it lives inside a slide. */}
					{slides.length > 1 && index === activeSlide && <Button
						icon={trash}
						size="small"
						className="bsb_slide_tab_remove"
						label={sprintf(
							/* translators: %d: slide number */
							__('Delete slide %d', 'b-slider'),
							index + 1
						)}
						onClick={() => deleteSlide(index, slide.clientId)}
					/>}
				</div>
			))}
		</div>

		<Button
			icon={plus}
			size="small"
			variant="secondary"
			className="bsb_slide_tab_add"
			onClick={addSlide}
		>
			{__('Add Slide', 'b-slider')}
		</Button>
	</div>;
};

export default SlideTabs;

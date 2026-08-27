/**
 * The layer between a slide's background and its content.
 *
 * A real element rather than a `::before`, because a pseudo-element needs a stylesheet and a
 * slide cannot safely carry one — see the note in `slideStyles.js`. Rendered by both `edit` and
 * `save` from the same component, so the canvas and the site agree.
 *
 * `pointer-events: none` matters more than it looks: the overlay covers the whole slide, and
 * without it every link and button underneath would be unclickable.
 */
const SlideOverlay = ({ overlay }) => {
	if (!overlay) {
		return null;
	}

	return <div
		className="bsb-slide-overlay"
		aria-hidden="true"
		style={{
			position: 'absolute',
			inset: 0,
			background: overlay,
			borderRadius: 'inherit',
			pointerEvents: 'none',
		}}
	/>;
};

export default SlideOverlay;

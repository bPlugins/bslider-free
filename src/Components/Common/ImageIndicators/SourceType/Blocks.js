import { useEffect, useState } from 'react';
import { ownCarouselItems } from '../../../../utils/functions';

/**
 * The dots for a `blocks` slider, counted from the DOM rather than from an attribute.
 *
 * Every other source knows how many slides it has before it draws any: `sliders` is an array, a
 * post query returns rows. This one cannot — its slides are child blocks in the editor and a
 * pre-rendered HTML string on the front end, so the only place the count exists at render time
 * is the markup itself. Hence a ref to the slider root, `ownCarouselItems` to count what belongs
 * to *this* slider (a slide can hold another bSlider, whose slides are not ours to number), and
 * a re-count whenever slides are added or removed.
 *
 * A count of zero renders nothing at all — not an empty wrapper. Bootstrap reaches into
 * `.carousel-indicators` on the first slide change to move the active class, and an element that
 * is there but empty is what makes it fail; no element at all tells it there are no indicators
 * to keep in step.
 *
 * The buttons carry no picture, unlike the image source's: a slide built from blocks has no one
 * image to stand for it, so `indicator.type === 'image'` has nothing to show and the dot style
 * is the only honest one here.
 */
const Blocks = ({ clientId, sliderRef, blocksHtml }) => {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const root = sliderRef?.current;

		if (!root) {
			return;
		}

		const recount = () => setCount(ownCarouselItems(root).length);

		recount();

		/*
		 * Slides arrive after this effect on both sides — from `<InnerBlocks>`'s template in the
		 * editor, from the HTML string on the front end — and the editor keeps adding and
		 * removing them as the user works. Watching for a `.carousel-item` appearing or leaving
		 * is the same test `Sliders` uses for the same reason: Bootstrap moves nodes around
		 * mid-transition, so "the DOM changed" is far too broad a question.
		 */
		const observer = new MutationObserver(mutations => {
			const slidesChanged = mutations.some(m =>
				[...m.addedNodes, ...m.removedNodes].some(node =>
					node.nodeType === Node.ELEMENT_NODE
					&& (node.classList?.contains('carousel-item') || node.querySelector?.('.carousel-item'))
				)
			);

			if (slidesChanged) recount();
		});

		observer.observe(root, { childList: true, subtree: true });

		return () => observer.disconnect();
	}, [sliderRef, blocksHtml]);

	return Array.from({ length: count }, (unused, index) => <button
		key={index}
		type="button"
		data-bs-target={`#bsbCarousel-${clientId} .carousel`}
		data-bs-slide-to={index}
		className={0 === index ? 'active' : ''}
		aria-current={0 === index ? 'true' : undefined}
		aria-label={`${index + 1}`}
	/>);
};

export default Blocks;

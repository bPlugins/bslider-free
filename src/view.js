import { useState } from 'react';
import { createRoot } from 'react-dom';
import 'animate.css';
import './style.scss';
import Style from './Components/Common/Style';
import PostsGridFront from './Components/Frontend/PostsGridFront';
import Layout from './Components/Common/Layouts/Layout';
import Default from './Components/Common/Layouts/Default';
import { setSliderMounter } from './utils/sliderMounter';

// Sliders
document.addEventListener('DOMContentLoaded', () => {
	mountSliders(document);
});

/**
 * Mounts every slider under `scope` that is not already running.
 *
 * A slider inside another slider's slide gets here on a second pass rather than on the first.
 * The outer slider carries its slides as a string it inserts itself, so at the moment this file
 * first runs that markup is not in the page yet — and once it is, it is inert: React put the
 * HTML there but nothing behind it, since these are not its components. `reviveSlideScripts`
 * re-fires `DOMContentLoaded` after the insert, which brings us back here to pick it up.
 *
 * `data-attributes` being gone is what marks a slider as already mounted, so a second pass over
 * the same page cannot mount anything twice.
 */
export const mountSliders = (scope = document) => {
	const sliderEls = scope.querySelectorAll('.wp-block-bsb-slider');
	sliderEls.forEach(sliderEl => {
		// Base64 on `blocks` sliders, whose payload can contain another slider's own escaped
		// JSON — see the note in render.php. Everything else still carries plain JSON.
		const raw = sliderEl.dataset.attributesB64
			? atob(sliderEl.dataset.attributesB64)
			: sliderEl.dataset.attributes;

		if (!raw) {
			return;
		}

		// A slider is mounted once. The attributes below are removed on the way out, so a second
		// sweep skips it — but a slider inside a slide can be reached by two sweeps in the same
		// turn (view.js's own, and the outer slider's callback once it has inserted the markup),
		// and without this both would call `createRoot` on the same element. Two roots on one
		// node each render their own tree, and the slides of whichever rendered second are the
		// only ones the carousel is left holding.
		if (sliderEl.dataset.bsbMounted) {
			return;
		}
		sliderEl.dataset.bsbMounted = 'true';

		const attributes = JSON.parse(raw);
		const nonce = JSON.parse(sliderEl.dataset.nonce);
		const totalPosts = parseInt(sliderEl.dataset.totalposts);
		const id = sliderEl?.id;

		const isBackend = false;
		// const posts = all_posts?.posts;
		const postsText = sliderEl.querySelector('pre#posts')?.innerText;
		const firstPosts = postsText ? JSON.parse(postsText?.replace(/\n/g, ' ')?.replace(/\s+/g, ' ')?.trim()) : [];

		createRoot(sliderEl).render(<>
			<RenderLayout {...{ attributes, firstPosts, totalPosts, isBackend, nonce, id }} />
		</>);

		sliderEl?.removeAttribute('data-attributes');
		sliderEl?.removeAttribute('data-attributes-b64');
	});
};

// Left here for `Sliders.js` to reach when it finds a slider inside one of its slides — see the
// note in utils/sliderMounter.js for why it is handed over rather than imported.
setSliderMounter(mountSliders);


export const RenderLayout = ({ attributes, firstPosts, totalPosts, nonce, }) => {

	const [carousel, setCarousel] = useState(null);
	const { cId, layoutType, sliders } = attributes;
	const commonDeProps = { clientId: cId, carousel, setCarousel };

	const isOld = !layoutType && sliders[0]?.img?.url !== '';
	const LayoutEl = <Layout {...{ attributes, commonDeProps, firstPosts, products: firstPosts, totalPosts, nonce, isBackend: false, PostsGrid: PostsGridFront }} />;

	return <div className={`mainLayout ${layoutType}`}>
		{isOld ? <>
			<Style {...{ attributes, postsCount: firstPosts?.length, clientId: cId }} />
			<Default {...{ attributes, firstPosts, commonDeProps, products: firstPosts }} />
		</> : <>
			<Style {...{ attributes, postsCount: firstPosts?.length, products: firstPosts, clientId: cId }} />
			{LayoutEl}
		</>

		}
	</div>
}
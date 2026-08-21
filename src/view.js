import { useState } from 'react';
import { createRoot } from 'react-dom';
import 'animate.css';
import './style.scss';
import Style from './Components/Common/Style';
import PostsGridFront from './Components/Frontend/PostsGridFront';
import Layout from './Components/Common/Layouts/Layout';
import Default from './Components/Common/Layouts/Default';

// Sliders  
document.addEventListener('DOMContentLoaded', () => {
	const sliderEls = document.querySelectorAll('.wp-block-bsb-slider');
	sliderEls.forEach(sliderEl => {
		if (!sliderEl.dataset.attributes) {
			return;
		}

		const attributes = JSON.parse(sliderEl.dataset.attributes);
		const nonce = JSON.parse(sliderEl.dataset.nonce);
		const totalPosts = parseInt(sliderEl.dataset.totalposts);
		const id = sliderEl?.id;

		const isBackend = false;
		// const posts = all_posts?.posts;
		/**
		 * The items, as `render.php` printed them.
		 *
		 * `textContent` and not `innerText`: they agree here — the `<pre>` is `display: none`, and for an
		 * element that is not rendered `innerText` falls back to `textContent` anyway — but only one of
		 * them says so plainly, and only one of them cannot start depending on layout later.
		 *
		 * **Trimmed and nothing more.** This used to collapse every run of whitespace to a single space
		 * before parsing, which was two things at once: unnecessary, because the only whitespace outside
		 * the JSON is the template's own indentation either side of it, and quietly destructive, because
		 * the collapse reached *inside* the strings and rewrote every title that had two spaces in it.
		 */
		const postsText = sliderEl.querySelector('pre#posts')?.textContent;
		const firstPosts = postsText?.trim() ? JSON.parse(postsText.trim()) : [];

		createRoot(sliderEl).render(<>
			<RenderLayout {...{ attributes, firstPosts, totalPosts, isBackend, nonce, id }} />
		</>);

		sliderEl?.removeAttribute('data-attributes');
	});
});


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
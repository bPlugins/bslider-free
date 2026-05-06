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
		const postsText = sliderEl.querySelector('pre#posts')?.innerText;
		const firstPosts = postsText ? JSON.parse(postsText?.replace(/\n/g, ' ')?.replace(/\s+/g, ' ')?.trim()) : [];

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

	const isOld = !layoutType && sliders[0]?.img?.url !== 'https://templates.bplugins.com/wp-content/uploads/2025/02/n-39.jpg';
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
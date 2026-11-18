import { __, sprintf } from '@wordpress/i18n';


const Posts = ({ clientId, firstPosts }) => {

    return firstPosts?.map((slider, index) => {

        return <button key={index} type="button" data-bs-target={`#bsbCarousel-${clientId} .carousel`} data-bs-slide-to={index} className={`${index === 0 ? 'active' : ''}`} aria-current={index === 0 ? 'true' : undefined} aria-label={sprintf(/* translators: %d: slide number. */ __('Go to slide %d', 'b-slider'), index + 1)}>
        </button>
    })
}
export default Posts;

const Posts = ({ clientId, firstPosts }) => {

    return firstPosts?.map((slider, index) => {

        return <button key={index} type="button" data-bs-target={`#bsbCarousel-${clientId} .carousel`} data-bs-slide-to={index} className={`${index === 0 ? 'active' : ''}`} aria-current="true" aria-label={index}>
        </button>
    })
}
export default Posts;
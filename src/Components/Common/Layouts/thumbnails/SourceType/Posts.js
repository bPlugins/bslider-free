import { Swiper, SwiperSlide } from 'swiper/react';

const Posts = ({ attributes, thumbnails, setThumbsSwiper, posts }) => {


    return <Swiper {...thumbnails} onSwiper={setThumbsSwiper}>

        {posts?.map((post, index) => {
            const { thumbnail } = post || {};
            return (
                <SwiperSlide key={index}>
                    <div className="single_thumbnails">
                        <div className="img">
                            {thumbnail?.url && (
                                <img src={thumbnail.url} className="d-block w-100" alt={thumbnail?.alt || thumbnail?.title} />
                            )}
                        </div>
                    </div>
                </SwiperSlide>
            );
        })}</Swiper>
}
export default Posts;
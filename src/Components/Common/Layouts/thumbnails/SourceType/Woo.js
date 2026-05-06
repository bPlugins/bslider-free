import { Swiper, SwiperSlide } from 'swiper/react';

const Woo = ({ attributes, thumbnails, setThumbsSwiper, products }) => {


    return <Swiper {...thumbnails} onSwiper={setThumbsSwiper}>

        {products?.map((post, index) => {
            const { thumbnail } = post || {};
            return (
                <SwiperSlide key={index}>
                    <div className="single_thumbnails">
                        <div className="img">
                            {thumbnail?.src && (
                                <img loading="lazy" data-src={thumbnail?.src} className="d-block w-100 lazyload" alt={thumbnail?.alt || thumbnail?.title} />
                            )}
                        </div>
                    </div>
                </SwiperSlide>
            );
        })}</Swiper>
}
export default Woo;
import { Swiper, SwiperSlide } from 'swiper/react';

const Image = ({ attributes, thumbnails, setThumbsSwiper }) => {
    const { sliders } = attributes;

    return <Swiper {...thumbnails} onSwiper={setThumbsSwiper}>

        {sliders?.map((slider, index) => {
            const { img, altText } = slider || {};
            return (
                <SwiperSlide key={index}>
                    <div className="single_thumbnails">
                        <div className="img">
                            {img?.url && (
                                <img src={url} className="d-block w-100" alt={altText} />
                            )}
                        </div>
                    </div>
                </SwiperSlide>
            );
        })}</Swiper>
}
export default Image;
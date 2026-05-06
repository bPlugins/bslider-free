import { Swiper, SwiperSlide } from 'swiper/react';
import { placeholderImg, play } from '../../../../global/video/icons';


const CarouselVideoItem = ({ sliders, videoRefs, attributes, id }) => {
    const { videoConf } = attributes;
    const { isPopup, icon } = videoConf;
    return sliders?.map((slider, index) => {
        const { img, poster } = slider || {};
        const posterImage = poster?.url && poster?.url;

        return <SwiperSlide key={index}> <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`item carousel-item ${index === 0 ? 'active' : ''}`} >
            <video controls poster={posterImage} className="bsbvid" id="player">
                <source src={img?.url} type="video/mp4" /></video>
        </div>
        </SwiperSlide>
        // <a data-fancybox={`${id}-video-gallery`} data-caption="" className={`carousel-item ${index === 0 ? 'active' : ''}`} href={img?.url} data-type={'html5video'}>
        //     <div className={`contentArea`}>
        //         <div className="img">
        //             <img className="rounded" src={posterImage || placeholderImg} alt={img?.caption || img?.alt || img?.title} />
        //             {icon && <div className="play">
        //                 <div className="icon">
        //                     {play}
        //                 </div>
        //             </div>}
        //         </div>
        //     </div>
        // </a>
    })

}
export default CarouselVideoItem;
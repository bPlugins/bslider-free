import { useRef, useEffect } from 'react';
import Sliders from '../Sliders';
import { bsb_lightbox_config, plyrInt } from '../../../utils/config';
import ImageItem from '../single-item/ImageItem';
import PostItem from '../single-item/PostItem';
import WooItem from '../single-item/WooItem';
import CheckPopUp from '../video/Common/CheckPopUP';

const Default = ({ attributes, firstPosts, products, commonDeProps }) => {
    const { clientId, carousel, setCarousel, isBackEnd = false, isSelected = false } = commonDeProps;
    const { sourceType, sliders, position, videoConf, layoutType } = attributes;

    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);

    const classProps = {
        item: 'carousel-item',
        contentArea: 'carousel-caption',
        captionContent: position?.top ? ('0' === position.top ? `center-center` : 'bottom-center') : position?.split(' ')?.join('-'),
        title: `animate__animated animate__fadeInLeft`,
        desc: `animate__animated animate__fadeInRight`,
        btn: `animate__animated animate__zoomIn`,
    }

    useEffect(() => {
        plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);

    }, [sliders, sourceType, layoutType, videoConf]);

    useEffect(() => {
        bsb_lightbox_config(clientId, attributes);
    }, [clientId, videoConf]);

    return <Sliders {...{ attributes, firstPosts, products, carousel, setCarousel, clientId, isBackend: isBackEnd }}>
        <div className="carousel-inner">
            {(() => {
                switch (sourceType) {
                    case 'posts':
                        return firstPosts?.map((post, index) => <PostItem key={index} {...{
                            attributes, post, index, isBackEnd, isSelected, classNames: classProps
                        }} />)

                    case 'woo':
                        return firstPosts?.map((product, index) => <WooItem key={index} {...{
                            attributes, product, index, isBackEnd, isSelected, classNames: classProps
                        }} />)

                    case 'video':
                        return <>
                            <CheckPopUp sliders={sliders} videoRefs={videoRefs} attributes={attributes} id={clientId} isBackEnd={isBackEnd} />

                            <div className='bsb-backend-inner-item'>
                                {sliders?.map((slider, index) => {
                                    const { img, video } = slider || {};
                                    const posterImage = img?.url && img?.url;

                                    return <div ref={(el) => (hiddenVideoRefs.current[index] = el)} key={index} className={`carousel-items ${index === 0 ? 'active' : ''}`} >

                                        <video controls poster={posterImage} className="bsbvid" id="player">
                                            <source src={video?.url} type="video/mp4" />
                                        </video>
                                    </div>
                                })}
                            </div>
                        </>
                    default:
                        return sliders?.map((slide, index) => <ImageItem key={index} {...{
                            attributes, slide, index, classNames: classProps
                        }} />);
                }
            })()}
        </div>
    </Sliders>
}
export default Default;
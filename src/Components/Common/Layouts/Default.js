import { useRef, useEffect } from 'react';
import Sliders from '../Sliders';
import { bsb_lightbox_config, plyrInt } from '../../../utils/config';
import ImageItem from '../single-item/ImageItem';
import PostItem from '../single-item/PostItem';
import WooItem from '../single-item/WooItem';
import CheckPopUp from '../video/Common/CheckPopUP';
import { getEmbedUrl, getProvider, getYouTubeId, getVimeoId } from '../../../utils/functions';

const Default = ({ attributes, firstPosts, products, commonDeProps }) => {
    const { clientId, carousel, setCarousel, isBackEnd = false, isSelected = false } = commonDeProps;
    const { sourceType, sliders, position, titleAnimation, descAnimation, btnAnimation, videoConf, layoutType } = attributes;

    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    /**
     * The slide area, purely so the lightbox can be told which document it is in.
     *
     * The other three layouts already keep one of these. This one used to hand over a video ref
     * instead, and those are only ever filled in for the video source — so a feed slider handed over
     * `undefined`, `docOf()` fell back to the module's own `document`, and in the editor that is the
     * outer frame while the slides are inside the iframe. Fancybox then bound its listener to a
     * document that had none of the triggers in it and clicking a slide did nothing. The same shape of
     * bug the arrows had.
     */
    const rootRef = useRef();

    const classProps = {
        item: 'carousel-item',
        contentArea: 'carousel-caption',
        captionContent: position?.top ? ('0' === position.top ? `center-center` : 'bottom-center') : position?.split(' ')?.join('-'),
        title: `animate__animated animate__${titleAnimation.effect}`,
        desc: `animate__animated animate__${descAnimation.effect}`,
        btn: `animate__animated animate__${btnAnimation.effect}`,
    }

    useEffect(() => {
        plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);

    }, [sliders, sourceType, layoutType, videoConf]);

    useEffect(() => {
        // The container, not a slide: `Fancybox.bind` is delegated, so binding to the slide area covers
        // slides that arrive later — which for a feed is all of them, since they come from a fetch.
        bsb_lightbox_config(clientId, attributes, rootRef.current);
    }, [clientId, videoConf]);

    return <Sliders {...{ attributes, firstPosts, products, carousel, setCarousel, clientId, isBackend: isBackEnd }}>
        <div className="carousel-inner" ref={rootRef}>
            {(() => {
                switch (sourceType) {
                    // A feed item arrives shaped like an arranged post, so it renders as one.
                    case 'posts':
                    case 'social':
                        return firstPosts?.map((post, index) => <PostItem key={index} {...{
                            attributes, post, index, clientId, isBackEnd, isSelected, classNames: classProps
                        }} />)

                    case 'woo':
                        return firstPosts?.map((product, index) => <WooItem key={index} {...{
                            attributes, product, index, isBackEnd, isSelected, classNames: classProps
                        }} />)

                    case 'video':
                        return <>
                            <CheckPopUp sliders={sliders} videoRefs={videoRefs} attributes={attributes} id={clientId} />

                            <div className='bsb-backend-inner-item'>
                                {sliders?.map((slider, index) => {
                                    const { img, video } = slider || {};
                                    const posterImage = img?.url && img?.url;
                                    const provider = getProvider(video?.url);

                                    return <div ref={(el) => (hiddenVideoRefs.current[index] = el)} key={index} className={`carousel-items ${index === 0 ? 'active' : ''}`} >
                                        {provider === 'youtube' ? (
                                            <div className="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id={getYouTubeId(video?.url)}></div>
                                        ) : provider === 'vimeo' ? (
                                            <div className="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id={getVimeoId(video?.url)}></div>
                                        ) : (
                                            <video controls poster={posterImage} className="bsbvid" id="player">
                                                <source src={video?.url} type="video/mp4" />
                                            </video>
                                        )}
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
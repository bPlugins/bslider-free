import { placeholderImg, play } from '../../../../utils/icons';
import { getProvider, getYouTubeId, getVimeoId } from '../../../../utils/functions';

const CheckPopUp = ({ sliders, videoRefs, attributes, id, }) => {
    const { videoConf } = attributes;
    const { isPopup, icon } = videoConf;

    return <div className="carousel-inner">
        {sliders?.map((slider, index) => {
            const { img, video } = slider || {};
            const posterImage = img?.url && img?.url;
            const provider = getProvider(video?.url);

            return !isPopup ? (
                <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem carousel-item ${index === 0 ? 'active' : ''}`} >
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
            ) : (
                <a data-fancybox={`${id}-video-gallery`} data-caption="" className={`carousel-item videoItem lightboxArea ${index === 0 ? 'active' : ''}`} href={video?.url} data-type={provider === 'html5' ? 'html5video' : ''}>
                    <div className={`contentArea`}>
                        <div className="img">
                            <img className="rounded" src={posterImage || placeholderImg} alt={img?.caption || img?.alt || img?.title} />
                            {icon && <div className="play">
                                <div className="icon">
                                    {play}
                                </div>
                            </div>}
                        </div>
                    </div>
                </a>
            );
        })}
    </div>
}
export default CheckPopUp;
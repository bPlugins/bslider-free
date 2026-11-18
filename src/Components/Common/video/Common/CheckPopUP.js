import { useState, useEffect } from 'react';
import { placeholderImg, play } from '../../../../utils/icons';
import { bsb_open_video_popup, galleryOf } from '../../../../utils/config';
import { safeMediaUrl } from '../../../../utils/functions';

/** Title and text over a video slide, with the image slides' classes so the Style tab applies. */
const VideoCaption = ({ slider, attributes, classNames = {} }) => {
    const showTitle = attributes?.title?.isVisible !== false && slider?.title;
    const showDesc = attributes?.desc?.isVisible !== false && slider?.desc;

    if (!showTitle && !showDesc) {
        return null;
    }

    return <div className={`${classNames.contentArea || 'carousel-caption'} bsbVideoCaption`}>
        <div className={`captionContent ${classNames.captionContent || ''}`}>
            {showTitle && <h5 className={`bsbTitle ${classNames.title || ''}`} dangerouslySetInnerHTML={{ __html: slider.title }} />}
            {showDesc && <p className={classNames.desc || ''} dangerouslySetInnerHTML={{ __html: slider.desc }} />}
        </div>
    </div>;
};
import { useSelect } from '@wordpress/data';

const CheckPopUp = ({ sliders, videoRefs, attributes, id, isBackEnd, classNames }) => {
    const { videoConf } = attributes;
    const { isPopup, icon } = videoConf;

    const isSelected = useSelect(
        select => isBackEnd ? select('core/block-editor').isBlockSelected(id) : false,
        [isBackEnd, id]
    );

    // Track whether the block has already received its first click.
    // We can't rely on isSelected inside the click handler because Gutenberg
    // updates the store on mousedown, making isSelected already true by the
    // time onClick fires on the very first click.
    const [blockActivated, setBlockActivated] = useState(false);

    useEffect(() => {
        if (!isSelected) setBlockActivated(false);
    }, [isSelected]);

    return <div className="carousel-inner">
        {sliders?.map((slider, index) => {
            const { img, video } = slider || {};
            const posterImage = safeMediaUrl(img?.url);

            const player = <video controls poster={posterImage} className="bsbvid" id="player">
                <source src={video?.url} type="video/mp4" /></video>;
            const caption = <VideoCaption slider={slider} attributes={attributes} classNames={classNames} />;
            const captioned = Boolean((attributes?.title?.isVisible !== false && slider?.title) || (attributes?.desc?.isVisible !== false && slider?.desc));
            const linkProps = { 'data-fancybox': galleryOf(id), 'data-caption': '', href: safeMediaUrl(video?.url), 'data-type': 'html5video', onClick: isBackEnd ? (e) => { e.preventDefault(); if (blockActivated) { e.stopPropagation(); bsb_open_video_popup(sliders, index, attributes); } else { setBlockActivated(true); } } : undefined };
            const poster = <div className={`contentArea`}>
                <div className="img">
                    <img className="rounded" src={posterImage || placeholderImg} alt={img?.caption || img?.alt || img?.title} />
                    {icon && <div className="play">
                        <div className="icon">
                            {play}
                        </div>
                    </div>}
                </div>
            </div>;

            // With text, the player sits in its own box (plyrInt empties the ref'd element) and the poster link beside the text.
            if (captioned) {
                return !isPopup ? <div key={index} className={`videoItem carousel-item hasVideoCaption ${index === 0 ? 'active' : ''}`}>
                    <div ref={(el) => (videoRefs.current[index] = el)} className="bsbVideoPlayer">{player}</div>
                    {caption}
                </div> : <div key={index} className={`carousel-item videoItem hasVideoCaption ${index === 0 ? 'active' : ''}`}>
                    <a className="lightboxArea" {...linkProps}>{poster}</a>
                    {caption}
                </div>;
            }

            return !isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem carousel-item ${index === 0 ? 'active' : ''}`} >
                {player}
            </div> :
                <a key={index} className={`carousel-item videoItem lightboxArea ${index === 0 ? 'active' : ''}`} {...linkProps}>
                    {poster}
                </a>
        })}
    </div>
}
export default CheckPopUp;
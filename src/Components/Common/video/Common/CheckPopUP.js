import { useState, useEffect } from 'react';
import { placeholderImg, play } from '../../../../utils/icons';
import { bsb_open_video_popup } from '../../../../utils/config';
import { useSelect } from '@wordpress/data';

const CheckPopUp = ({ sliders, videoRefs, attributes, id, isBackEnd }) => {
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
            const posterImage = img?.url && img?.url;

            return !isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem carousel-item ${index === 0 ? 'active' : ''}`} >
                <video controls poster={posterImage} className="bsbvid" id="player">
                    <source src={video?.url} type="video/mp4" /></video>
            </div> :
                <a key={index} data-fancybox={`${id}-video-gallery`} data-caption="" className={`carousel-item videoItem lightboxArea ${index === 0 ? 'active' : ''}`} href={video?.url} data-type={'html5video'} onClick={isBackEnd ? (e) => { e.preventDefault(); if (blockActivated) { e.stopPropagation(); bsb_open_video_popup(sliders, index, attributes); } else { setBlockActivated(true); } } : undefined}>
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
        })}
    </div>
}
export default CheckPopUp;
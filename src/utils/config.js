import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

export const controlsHandler = (controls) => {
    const newControls = [];
    Object.keys(controls).map(item => {
        if (controls[item]) {
            newControls.push(item);
        }
    });
    return newControls;
};

export const plyrConfig = (attributes) => {
    const { videoConf } = attributes;
    const { controls, repeat, muted, resetOnEnd, autoHideControl } = videoConf;
    const mutedProps = muted ? { storage: { enabled: false, key: 'plyr' }, volume: 0 } : {};

    return {
        controls: controlsHandler(controls),
        clickToPlay: true,
        loop: { active: repeat },
        muted,
        ...mutedProps,
        resetOnEnd,
        hideControls: autoHideControl,
        playsinline: true
    }
}

export const plyrInt = (id, videoRefs, hiddenVideoRefs, attributes) => {


    // const carouselElement = document.getElementById(`bsbCarousel-${id}`);

    // Initialize Plyr for each video
    const prevEle = document.getElementById(`bsbCarousel-prev-${id}`);
    const nextEle = document.getElementById(`bsbCarousel-next-${id}`);
    const { videoConf } = attributes;
    const { isAutoPlay } = videoConf;

    videoRefs?.current?.forEach((carouselItem, index) => {

        // if (videoRefs.current[index].plyr) {
        //     videoRefs.current[index]?.plyr.destroy();
        // }

        if (carouselItem) {
            // Destroy existing Plyr instance before reinitializing
            if (carouselItem.plyr) {

                carouselItem.plyr.destroy();
            }


            if (hiddenVideoRefs.current?.length) {
                carouselItem.innerHTML = '';
                carouselItem.appendChild(hiddenVideoRefs.current[index].querySelector('video').cloneNode(true))
            }
            const videoTag = carouselItem.querySelector('video');
            const player = new Plyr(videoTag, plyrConfig(attributes));

            // Store Plyr instance for future use
            videoRefs.current[index].plyr = player;

            player.on('play', () => {
                if (prevEle) prevEle.style.display = 'none';
                if (nextEle) nextEle.style.display = 'none';
            });

            player.on('pause', () => {
                if (prevEle) prevEle.style.display = 'block';
                if (nextEle) nextEle.style.display = 'block';
            });

            if (isAutoPlay && carouselItem.classList.contains('active')) {
                player.play();
            }
        }
    });
    // carouselElement.addEventListener('slid.bs.carousel', () => {
    // 
    //     if (isAutoPlay) {
    //         const activeItem = carouselElement.querySelector('.carousel-item.active');
    //         const videoTag = activeItem?.querySelector('video');

    //         if (videoTag?.plyr) {
    //             videoTag.plyr.play();
    //         }
    //     }
    // });
}

export const manageVideo = (player) => {
    //orientation
    if (window?.innerWidth < 992) {
        player.on("enterfullscreen", () => {
            screen?.orientation?.lock("landscape");
        });

        player.on("exitfullscreen", () => {
            screen?.orientation?.lock("portrait");
        });
    }

    player.elements?.container?.classList?.add('fancybox__content');
}

const bsb_fancybox_options = (attributes) => ({
    on: {
        done: () => {
            const videoElement = document.querySelectorAll('.fancybox__html5video');
            const youtubeVideos = document.querySelectorAll('.has-youtube .fancybox__content');
            const vimeoVideos = document.querySelectorAll('.has-vimeo .fancybox__content');

            const videoPlayers = Plyr.setup(videoElement, plyrConfig(attributes), {
                fullscreen: { enabled: true, fallback: true, iosNative: true, container: null }
            });

            const youtubePlayers = Plyr.setup(youtubeVideos);
            const vimeoPlayers = Plyr.setup(vimeoVideos);

            videoPlayers?.forEach(player => manageVideo(player));
            youtubePlayers?.forEach(player => manageVideo(player));
            vimeoPlayers?.forEach(player => manageVideo(player));
        }
    },
    autoFocus: false,
    backdropClick: "close",
    closeButton: "auto",
    commonCaption: false,
    contentClick: "toggleZoom",
    contentDblClick: "toggleCover",
    defaultDisplay: "flex",
    Thumbs: { type: 'classic' },
});

export const bsb_lightbox_config = (id, attributes) => {
    Fancybox.bind(`[data-fancybox='${id}-video-gallery']`, bsb_fancybox_options(attributes));
}

export const bsb_open_video_popup = (sliders, index, attributes) => {
    const items = sliders.map(slide => ({
        src: slide?.video?.url,
        type: 'html5video',
        caption: ''
    }));
    Fancybox.show(items, { ...bsb_fancybox_options(attributes), startIndex: index });
}
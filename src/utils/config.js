import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';

/**
 * Which Plyr controls a feed slide cannot have.
 *
 * A YouTube or Instagram video plays through an embed rather than an HTML5 `<video>`, and these are
 * the buttons that need the file itself. `PlayerGeneral` hides them for a feed and `plyrConfig`
 * drops them again on the way to the player — one list, so the panel and the player cannot disagree
 * about what a slide is capable of.
 */
export const HTML5_ONLY = {
    controls: ['download', 'pip', 'airplay'],
    settings: ['quality', 'captions']
};

/**
 * The player settings a slider has before anybody touches them.
 *
 * `videoConf` in block.json carries the controls and the four toggles that have always been there;
 * everything here is a key that panel reads but the attribute does not store, so a slider saved
 * before any of them existed still answers for them. Merged in `playerConf()` below rather than
 * defaulted at each read, which is how one of these came to be `undefined` in the player and
 * `false` in the panel.
 */
export const PLAYER_DEFAULTS = {
    settingsMenu: { quality: true, speed: true },
    // Plyr's own two, written out rather than left empty: the panel shows a swatch, and an empty one
    // would say "no colour" about a play button that is plainly blue. Taken from the stylesheet this
    // plugin ships — plyr.io's docs say #00b3ff, and the build in `assets/css` says #00b2ff.
    playerIconBg: '#00b2ff',
    playerIconColor: '#fff',
    clickToPlay: true,
    playsinline: true,
    volume: 100,
    rememberSettings: true,
    seekTime: 10,
    speed: 1,
    speedOptions: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
    ratio: '',
    tooltipsControls: false,
    tooltipsSeek: true,
    keyboardFocused: true,
    displayDuration: true,
    invertTime: true,
    ytNoCookie: false,
    ytRel: false
};

/**
 * Which buttons are in the bar when nothing says otherwise.
 *
 * Mirrors the `controls` object in block.json's `videoConf`, `duration` included — a key free's
 * attribute has and which must survive the merge, or the panel's Duration toggle would read as off
 * for every slider that had it on.
 */
const DEFAULT_CONTROLS = {
    "play-large": true,
    "restart": false,
    "rewind": true,
    "play": true,
    "fast-forward": true,
    "progress": true,
    "current-time": true,
    "duration": false,
    "mute": true,
    "volume": true,
    "pip": false,
    "airplay": false,
    "settings": true,
    "download": false,
    "fullscreen": true
};

/**
 * A slider's player settings, with the defaults filled in.
 *
 * The two nested objects are merged key by key rather than replaced, because a saved `controls`
 * holding only what somebody changed would otherwise blank every button they did not.
 */
export const playerConf = (videoConf) => {
    const merged = { ...PLAYER_DEFAULTS, ...(videoConf || {}) };

    merged.settingsMenu = {
        ...(PLAYER_DEFAULTS.settingsMenu || {}),
        ...((videoConf && videoConf.settingsMenu) || {})
    };

    merged.controls = {
        ...DEFAULT_CONTROLS,
        ...((videoConf && videoConf.controls) || {})
    };

    return merged;
};

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
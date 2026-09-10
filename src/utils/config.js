import { Fancybox } from '@fancyapps/ui';
import { getBoxValue } from './functions';
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
        done: (fancybox) => {
            paintLightbox(fancybox, attributes);

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

    /**
     * The toolbar, built from the switches rather than left to Fancybox's own list.
     *
     * **Every one of these is on unless it is switched off, and that is deliberate.** Fancybox v5
     * ships its toolbar enabled — `["infobar"]` on the left, `["iterateZoom","slideshow",
     * "fullscreen","thumbs","close"]` on the right — so all of it is already what a visitor sees in
     * the video lightbox. Defaulting the switches to `false` would not be adding a feature, it would
     * be taking one away from every site that already has it, which is why `block.json` defaults them
     * all to `true`. Read with `!== false` on top of that, so a slider saved before the keys existed
     * keeps the toolbar it was showing.
     *
     * `close` is not offered as a switch. A lightbox that cannot be closed by its own button is a trap
     * on any device without a keyboard, and Esc and the backdrop are not discoverable enough to be the
     * only ways out.
     *
     * `infobar` is the counter — the "3 / 9" in the top left; the name is Fancybox's rather than ours.
     */
    Toolbar: {
        display: {
            left: [...(attributes?.lightbox?.counter !== false ? ['infobar'] : [])],
            middle: [],
            right: [
                ...(attributes?.lightbox?.zoom !== false ? ['iterateZoom'] : []),
                /* Rotate, flip and reset read as one tool: turning a picture and putting it back.
                   Off by default unlike the rest — the others were already showing before they were
                   switches, so defaulting them off would take something away; these have never
                   shown, so defaulting them on would add five buttons to every existing lightbox. */
                ...(attributes?.lightbox?.rotate ? ['rotateCCW', 'rotateCW', 'flipX', 'flipY', 'reset'] : []),
                ...(attributes?.lightbox?.slideshow !== false ? ['slideshow'] : []),
                ...(attributes?.lightbox?.fullscreen !== false ? ['fullscreen'] : []),
                ...(attributes?.lightbox?.thumbs !== false ? ['thumbs'] : []),
                ...(attributes?.lightbox?.download ? ['download'] : []),
                'close'
            ]
        }
    },

    Thumbs: {
        type: 'classic',
        /* The strip itself, which is a separate question from the button that toggles it: with the
           button gone the strip would still open on start and there would be no way to put it away.
           Both come off the one switch. */
        showOnStart: attributes?.lightbox?.thumbs !== false,
    },
});

/**
 * What one slider's lightbox triggers are named.
 *
 * The name still says `video` for the sake of what is already on the page: it was `-video-gallery`
 * before images could open at all, and a slide rendered by an older cached script has that value
 * baked into its markup. Renaming it now would leave those slides in a gallery of their own.
 *
 * One name for both kinds, so a slider holding images and videos opens as a single gallery —
 * Fancybox groups by the attribute's value, and two names would split it in half, stopping the
 * arrows at the first boundary. What tells the two apart inside is `data-type`: videos carry
 * `html5video`, images carry nothing and take Fancybox's own `image` default.
 */
/**
 * The caption's colours and the backdrop, painted on the overlay itself.
 *
 * Fancybox appends its overlay to a `body`, so nothing `Style.js` writes under `#bsbCarousel-<id>`
 * can reach it. Setting variables on the container works because our own rules in `style.scss` read
 * them from there.
 *
 * **Our own variables rather than Fancybox's.** `--fancybox-opacity` is spent on five things at once
 * — backdrop, caption, toolbar, nav arrows, thumbnail strip — so writing it to dim the backdrop dims
 * the arrows too; `--fancybox-color` paints the caption *and* every toolbar button. `--bsb-lb-*` is
 * read only by rules that name one element each.
 *
 * Only what was actually set is written, so a slider that set nothing renders exactly as before.
 */
const paintLightbox = (fancybox, attributes) => {
    const el = fancybox?.container;
    const conf = attributes?.lightbox || {};

    if (!el) {
        return;
    }

    const set = (prop, value) => el.style.setProperty(prop, value);

    if (conf.backdrop) {
        set('--fancybox-bg', conf.backdrop);
    }

    const opacity = Number(conf.backdropOpacity);

    // Our own, so the backdrop dims alone — see the note above.
    if (Number.isFinite(opacity) && opacity >= 0 && opacity < 100) {
        set('--bsb-lb-backdrop-opacity', String(opacity / 100));
    }

    if (conf.captionColor) {
        set('--bsb-lb-caption-color', conf.captionColor);
    }

    if (conf.hasCaptionBg && conf.captionBg) {
        set('--bsb-lb-caption-bg', conf.captionBg);
    }

    if (conf.captionAlign) {
        set('--bsb-lb-caption-align', conf.captionAlign);
    }

    const margin = conf.captionMargin;

    /* Only where a side was actually filled in: `getBoxValue` answers `0` for an empty side, so four
       blanks would write `margin: 0 0 0 0` over whatever Fancybox had. */
    if (margin && Object.values(margin).some(side => '' !== side && undefined !== side && null !== side)) {
        set('--bsb-lb-caption-margin', getBoxValue(margin));
    }
};

export const galleryOf = id => `${id}-video-gallery`;

/** The selector matching every trigger of one slider's gallery. */
const gallerySelector = id => `[data-fancybox='${galleryOf(id)}']`;

export const bsb_lightbox_config = (id, attributes) => {
    Fancybox.bind(gallerySelector(id), bsb_fancybox_options(attributes));
}

/**
 * The same lightbox, opened without waiting for Fancybox to notice the click.
 *
 * **Why the editor needs this.** Fancybox opens from a delegated click handler, and the first thing
 * that handler does is give up if anything has already called `preventDefault` on the event. Inside
 * the editor canvas a click on a slide is not just a click — it is also how a block is selected —
 * and by the time it reaches the slider the default is long gone. So the popup simply never opened
 * there, while the same markup worked on the front end.
 *
 * `fromNodes` rather than `show`, so the editor gets the gallery the visitor gets: every trigger in
 * the slider, opened at the one that was clicked, each slide read off its own attributes exactly as
 * the delegated path reads them. Building a slide list here by hand would be a second description of
 * what a slide is, and the two would drift.
 */
export const bsb_open_popup = (id, attributes, trigger, container = null) => {
    /* Nothing to do if a lightbox is already up: Fancybox's delegated listener sits on the slider
       itself, so on a click it runs first, and where it succeeds this would open a second lightbox
       on top of the one already showing. */
    if (Fancybox.getInstance()) {
        return;
    }

    const root = container || trigger?.ownerDocument?.body || document.body;
    const triggers = [...root.querySelectorAll(gallerySelector(id))];

    if (!triggers.length) {
        return;
    }

    Fancybox.fromNodes(triggers, {
        ...bsb_fancybox_options(attributes),
        /* `indexOf` can only miss if the trigger sits outside the container it was given, which would
           be a wiring mistake rather than a state to handle — opening at the first slide is a better
           answer to it than opening nothing. */
        startIndex: Math.max(0, triggers.indexOf(trigger)),
        triggerEl: trigger
    });
};

export const bsb_open_video_popup = (sliders, index, attributes) => {
    const items = sliders.map(slide => ({
        src: slide?.video?.url,
        type: 'html5video',
        caption: ''
    }));
    Fancybox.show(items, { ...bsb_fancybox_options(attributes), startIndex: index });
}
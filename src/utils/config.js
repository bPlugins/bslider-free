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

/**
 * What a player setting falls back to when the slider has never been asked about it.
 *
 * **Not belt and braces — a slider saved before a setting existed genuinely has no key for it.**
 * WordPress fills an object attribute's default in only when the whole object is missing, so
 * `videoConf` on an older slider is exactly the object it was saved with. And `undefined` is not the
 * same as absent to Plyr: handed one it overwrites its own default with nothing.
 *
 * Every value here is Plyr's own default, so an old slider behaves exactly as it did. It mirrors what
 * `block.json` gives a new one, and the panel reads it through `playerConf()` — one list, so the panel
 * cannot show one thing while the player does another.
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

/** This slider's player settings, with anything it was saved without filled in. */
const DEFAULT_CONTROLS = {
    "play-large": true,
    "restart": false,
    "rewind": true,
    "play": true,
    "fast-forward": true,
    "progress": true,
    "current-time": true,
    "mute": true,
    "volume": true,
    "pip": false,
    "airplay": false,
    "settings": true,
    "download": false,
    "fullscreen": true
};

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

/**
 * What only a real `<video>` can do, and a provider embed cannot.
 *
 * There is no file for a YouTube video to download, and PiP and AirPlay are the browser's own controls
 * over a media element — an embed is an iframe with somebody else's player inside it. Quality is the
 * same: YouTube retired the API for choosing a resolution and decides for itself. Captions is also
 * HTML5-only because Plyr does not build a captions menu for embed providers.
 *
 * Read in two places, which is why it is here and not in the panel: the panel hides these for a feed,
 * and this strips them on the way to Plyr. Hiding alone would leave them on for any slider that had
 * them turned on before — a Download button that opens YouTube, a Quality menu that changes nothing.
 */
export const HTML5_ONLY = {
    controls: ['download', 'pip', 'airplay'],
    settings: ['quality', 'captions']
};

/**
 * The gear entry Plyr accepts and never finished.
 *
 * `loop` is a documented member of `settings`, and Plyr does build it: a `Loop` row in the menu and a
 * `plyr-settings-<id>-loop` pane behind it. Both are empty. The row's value renders as the string
 * `undefined` — measured, in a browser, on a real player — and the pane it opens has nothing in it, so
 * the visitor gets a menu item reading "Loop undefined" that does nothing when clicked.
 *
 * Stripped here rather than only left out of the panel, so a slider that had the checkbox ticked before
 * it went stops showing the row. Repeat, in the Player panel, is the setting that actually loops — that
 * one is `loop.active`, and it works on a `<video>` and on a YouTube embed alike.
 */
const DEAD_SETTINGS = ['loop'];

/**
 * The player's colours, as the two custom properties Plyr already reads.
 *
 * Plyr's own stylesheet is written against these, so nothing here overrides a Plyr rule — it feeds one.
 * That is why there is no `!important` and no selector of ours in front of `.plyr__control`: setting a
 * variable on an ancestor is how Plyr is meant to be themed, and it survives whatever Plyr does to its
 * own CSS between versions.
 *
 * Between them they cover exactly what the panel names. From the shipped stylesheet:
 *   `--plyr-video-control-background-hover` → the big play button's background, and the pill behind a
 *   control the pointer is on.
 *   `--plyr-video-control-color` → the play button's arrow, every icon in the control bar, and the time.
 *
 * Returned as an object rather than a CSS string because it is used both ways: written into a
 * stylesheet for the players inside the slider, and set on an element for the ones in the lightbox,
 * which is not inside the slider at all — see `bsb_fancybox_options`.
 */
export const playerVars = (videoConf) => {
    const { playerIconBg, playerIconColor } = playerConf(videoConf);

    return {
        '--plyr-video-control-background-hover': playerIconBg,
        '--plyr-video-control-color': playerIconColor
    };
};

/**
 * Finish a player Plyr has just built.
 *
 * `displayDuration: false` is not enough on its own. Plyr reads the option when it lays the controls
 * out, but it still prints the total time into `.plyr__time--duration` — hiding it is a class the
 * host has to add, and `.plyr--hide-duration` in style.scss is what acts on it.
 *
 * A function because there are four players — the slide's own, the popup's, the corner dock's and
 * the Thumbnails and List stages — and three of them had been built without this step, so Show
 * Duration did nothing wherever a stage was involved. One place to call means the next player added
 * cannot quietly miss it either.
 */
export const finishPlyr = (player, conf) => {
    if (!player || conf?.displayDuration) {
        return player;
    }

    player.elements?.container?.classList.add('plyr--hide-duration');

    return player;
};

/**
 * Every setting the panel offers, as Plyr's own options.
 *
 * The shape is flat in the attribute and nested here on the way out. A flat attribute is what lets the
 * panel write every one of these with `updateObject`, which is one call and one re-render; assembling
 * `tooltips`, `keyboard`, `speed` and the rest is this function's job and nowhere else's.
 */
export const plyrConfig = (attributes) => {
    const {
        controls,
        repeat,
        muted,
        resetOnEnd,
        autoHideControl,
        settingsMenu,
        clickToPlay,
        playsinline,
        volume,
        rememberSettings,
        seekTime,
        speed,
        speedOptions,
        ratio,
        tooltipsControls,
        tooltipsSeek,
        keyboardFocused,
        displayDuration,
        invertTime,
        ytNoCookie,
        ytRel
    } = playerConf(attributes?.videoConf);

    /**
     * Muted wins over both the volume and the memory of it.
     *
     * Plyr keeps the last volume in localStorage and restores it on the next player, so a slider set to
     * start silent would come back loud for anyone who had turned a previous one up. Storing is what
     * makes "remember settings" work at all, so it is only this one case that switches it off.
     */
    const mutedProps = muted ? { storage: { enabled: false, key: 'plyr' }, volume: 0 } : {};

    /** The speeds the menu offers, always including the one it starts at — Plyr hides it otherwise. */
    const speeds = [...new Set([...(Array.isArray(speedOptions) ? speedOptions : []), speed])]
        .map(Number)
        .filter(n => n > 0)
        .sort((a, b) => a - b);

    // A feed slide plays a YouTube embed, so it drops what an embed cannot do — see `HTML5_ONLY`.
    const isFeed = 'social' === attributes?.sourceType;
    const forHere = (list, group) => list.filter(item => !isFeed || !HTML5_ONLY[group].includes(item));

    return {
        controls: forHere(controlsHandler(controls), 'controls'),
        // The gear menu's contents. An empty list is a gear that opens on nothing, so the control
        // itself is what to turn off — see the Controls panel.
        settings: forHere(controlsHandler(settingsMenu), 'settings').filter(name => !DEAD_SETTINGS.includes(name)),
        clickToPlay,
        loop: { active: repeat },
        muted,
        // Plyr wants 0–1; the panel asks in whole percent, because a slider from 0 to 1 in hundredths
        // is a control nobody can land on a round number with.
        volume: Math.min(100, Math.max(0, Number(volume))) / 100,
        storage: { enabled: !!rememberSettings, key: 'plyr' },
        ...mutedProps,
        resetOnEnd,
        hideControls: autoHideControl,
        playsinline,
        seekTime: Number(seekTime) || 10,
        speed: { selected: Number(speed) || 1, options: speeds.length ? speeds : [1] },
        displayDuration,
        invertTime,
        tooltips: { controls: tooltipsControls, seek: tooltipsSeek },
        keyboard: { focused: keyboardFocused, global: false },
        // `null` is Plyr's "take the shape from the video itself". An empty string is not — it would be
        // parsed as a ratio, fail, and log for every player made.
        ratio: ratio || null,
        /**
         * What YouTube itself is asked for, on top of what Plyr draws.
         *
         * These are player parameters in the embed URL, so they are the only settings here YouTube can
         * refuse — and it does refuse some of them nowadays. `rel: 0` no longer means "no related
         * videos", it means "related from this channel only". Kept because the alternative is worse in every player that still reads them,
         * and because `noCookie` — the one that actually matters — is honoured everywhere: it serves the
         * embed from youtube-nocookie.com, which sets nothing until the visitor presses play.
         *
         * `showinfo` is Plyr's own default and has been ignored by YouTube since 2018; it is passed
         * through as it always was rather than offered as a setting that does nothing.
         */
        youtube: {
            noCookie: !!ytNoCookie,
            rel: ytRel ? 1 : 0,
            showinfo: 0,
            /* 3 hides annotations, 1 shows them — not a boolean, and inverted from how it reads.
               Fixed at 3 now, where it used to follow a toggle in the YouTube panel. There is
               nothing left for it to decide: YouTube stopped showing annotations in January 2019
               and deleted the ones that existed, so neither value changes a frame of any video.
               Sent all the same, exactly as `showinfo` above is — a dead parameter costs nothing,
               while a control for one asks for a decision with no outcome. */
            iv_load_policy: 3
        }
    }
}

/**
 * The document a slider was actually rendered into.
 *
 * Since block.json moved to apiVersion 3 the editor draws blocks inside an iframe, while this
 * module keeps running in the outer frame — so a bare `document` lookup there searches the wrong
 * one and finds nothing the block put on screen. Every element handed to us belongs to the right
 * document, so ask one of them. On the front end there is no iframe and this is just `document`.
 */
const docOf = (el) => el?.ownerDocument || document;

export const plyrInt = (id, videoRefs, hiddenVideoRefs, attributes) => {


    // const carouselElement = document.getElementById(`bsbCarousel-${id}`);

    // Initialize Plyr for each video
    const doc = docOf(videoRefs?.current?.find(Boolean));
    const prevEle = doc.getElementById(`bsbCarousel-prev-${id}`);
    const nextEle = doc.getElementById(`bsbCarousel-next-${id}`);
    const { videoConf } = attributes;
    const { isAutoPlay } = videoConf;

    /**
     * Only the default layout draws these arrows, and only while they are set visible — the
     * carousel, grid and thumbnail layouts have their own and never render this pair. So the
     * lookups above come back empty far more often than not, and playing a video must not take
     * the whole player down with it.
     */
    const showArrows = (display) => {
        if (prevEle) prevEle.style.display = display;
        if (nextEle) nextEle.style.display = display;
    };

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
                const rawNode = hiddenVideoRefs.current[index].querySelector('video, [data-plyr-provider]');
                if (rawNode) {
                    carouselItem.appendChild(rawNode.cloneNode(true));
                }
            }
            const videoTag = carouselItem.querySelector('video, [data-plyr-provider]');
            if (videoTag) {
                const conf = plyrConfig(attributes);
                const player = new Plyr(videoTag, conf);

                finishPlyr(player, conf);

                // Store Plyr instance for future use
                videoRefs.current[index].plyr = player;

                player.on('play', () => showArrows('none'));

                player.on('pause', () => showArrows('block'));

                if (isAutoPlay && carouselItem.classList.contains('active')) {
                    player.play();
                }
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

const formatSeconds = (seconds, forceNegative = false) => {
    if (isNaN(seconds) || seconds === null || seconds === undefined) {
        return '00:00';
    }
    const isNegative = forceNegative && seconds > 0;
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = Math.floor(absSeconds % 60);

    const pad = (num) => String(num).padStart(2, '0');

    const sign = isNegative ? '-' : '';
    if (hours > 0) {
        return `${sign}${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${sign}${pad(minutes)}:${pad(secs)}`;
};

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

    // Force invertTime (remaining time countdown) support for embeds/all players
    player.on('timeupdate', () => {
        if (player.config?.invertTime && player.elements?.display?.currentTime) {
            const time = player.duration - player.currentTime;
            player.elements.display.currentTime.textContent = formatSeconds(time, true);
        }
    });
}

/**
 * Reset On End for an embed, which Plyr only ever does for a real `<video>`.
 *
 * Plyr's own handler is guarded by `isHTML5`, so a feed slide ignored the setting and sat on YouTube's
 * end screen instead — a replay button, the channel's name, and a grid of somebody else's videos, inside
 * a popup on your page. Which is the very thing the setting exists to prevent, and the reason it is
 * worth having on a feed at all rather than hiding it there.
 *
 * **`stopVideo()`, not Plyr's own `restart()` + `pause()`.** All three measured in Chrome against a real
 * embed: seeking to 0 from the ended state puts YouTube straight back into playing, and the pause is
 * overtaken — whether it is issued immediately or on the `seeked` that follows, because the embed's seek
 * resolves asynchronously and YouTube has resumed before either lands. Both turn Reset On End into
 * Repeat. `stopVideo` leaves the player cued at 0 and paused, with the end screen gone and the thumbnail
 * back; Plyr then reports `stopped` and draws its own play button, and a later `play()` starts it from
 * the beginning. Stable across five seconds of sampling, where the other two were playing by 500ms.
 *
 * It is also Plyr's own idiom on this provider — its YouTube `ended` branch loops with
 * `stopVideo(); playVideo()`. That same branch is why Repeat needs no guard here: with Repeat on it
 * takes the loop and never fires `ended`, so this never runs. Repeat wins, exactly as it does for a
 * `<video>`. Measured against a real embed rather than read off the minified source, which is easy to
 * misread here: the branch tests `media.loop`, and the only `defineProperty` for that key sits in the
 * Vimeo provider — yet a YouTube embed with `loop.active` on demonstrably replays itself, and with it
 * off sits at `ended`. Whatever assigns it, it is assigned.
 *
 * YouTube only, since `stopVideo` is YouTube's API. Vimeo would want `unload()`, and can have it when
 * there is a Vimeo feed to want it for.
 */
const resetEmbedOnEnd = (player) => player.on('ended', () => {
    if (player.isYouTube) {
        player.embed?.stopVideo?.();
    }
});



/** The selector every trigger of one slider's gallery carries. */
const galleryOf = id => `[data-fancybox='${id}-video-gallery']`;

/**
 * One lightbox's settings, for whichever way it is opened.
 *
 * Written as a factory rather than a constant because each set owns the players it made — see
 * `revealed` below — and because `parentEl` depends on which document the slider is in. b-slider has
 * the same split for the same reason.
 *
 * @param {HTMLElement} [container] The slider's root element. Pass it and the lightbox binds, opens
 *                                  and is searched for inside whichever document that element lives
 *                                  in — which under apiVersion 3 is the editor's iframe, not the one
 *                                  this module runs in. On the front end the two are the same.
 * @param {Document}    [renderIn]  The document to render the overlay into, when that is not the one
 *                                  the slides are in. Only the editor passes it — see `bsb_open_popup`.
 */
const bsb_fancybox_options = (attributes, container = null, renderIn = null) => {

    // const controlsOpt = Object.keys(controls).filter(key => controls[key]);
    const doc = renderIn || docOf(container);

    /**
     * The players this lightbox made, each against the slide it was made for.
     *
     * Keyed by the slide rather than kept in a list, because which one is on screen decides which one
     * may play. A plain list is what let two videos play at once: the array was replaced on every
     * reveal, so the pane revealed first was both unreachable to `destroy` and left running.
     */
    const revealed = new Map();

    /**
     * A feed post's own `<video>`, which nothing else here knows about.
     *
     * Plyr is only ever handed `.fancybox__html5video` and the provider embeds, so a post pane's
     * plain video is in no map and no list. It still has to obey the same rule as the rest: the
     * slide on screen may play, and nothing else may.
     */
    const nativeVideos = root => [...(root?.querySelectorAll?.('video.bsbFeedPostVideo') || [])];

    /**
     * Put every native video where it should be: the current slide's playing, all the rest stopped.
     *
     * Stated as a whole rather than as "start this one, stop that one", and that is the point. The
     * two events that could drive it are both unreliable on their own — `selectSlide` can arrive
     * before the pane's content exists, so there is no `<video>` to find yet, and `reveal` fires
     * once per pane including the neighbours Fancybox builds ahead of time, so for those it fires
     * while they are not the slide being looked at. Trying to pair them up is what left the second
     * video silent: whichever fired first did nothing useful and nothing came back to it.
     *
     * Re-asserting the whole arrangement from whatever event happens to arrive is immune to their
     * order, and costs one small query over a handful of panes.
     */
    const syncNativeVideos = fancybox => {
        const current = fancybox?.getSlide?.()?.el;

        nativeVideos(fancybox?.container).forEach(video => {
            const isCurrent = !!current && current.contains(video);

            // Only the ones marked to start themselves — a single video in a pane. An album's
            // videos wait to be chosen, which is what stops a strip of them all starting at once.
            if (isCurrent && '1' === video.dataset.bsbAutoplay) {
                // A rejected play is not an error worth reporting: the browser declined, and the
                // poster with its controls is exactly where the visitor should be left.
                video.play?.()?.catch?.(() => {});
            } else if (!isCurrent) {
                video.pause?.();
            }
        });

        syncEmbeds(fancybox, current);
    };

    /**
     * The same rule for Instagram's own embedded player, which cannot simply be told to stop.
     *
     * It is another origin's document, so there is no `pause()` to call and no message it is
     * documented to listen for. Reloading the frame is the whole of the API available here: assigning
     * `src` tears the player down and puts the still back, which is what "the slide you are not
     * looking at is silent" has to mean for one of these. Without it a Reel started in one pane keeps
     * talking from behind the next.
     *
     * Marked on the way in rather than reset on sight, and that is the point. This runs several times
     * per navigation — reveal, select, unselect and change all lead here — so resetting every
     * off-screen frame each time would refetch Instagram on panes nobody has looked at. Only a frame
     * that was the one on screen is worth reloading, and only once: the mark comes off with it.
     */
    const syncEmbeds = (fancybox, current) => {
        [...(fancybox?.container?.querySelectorAll?.('iframe.bsbFeedPostEmbed') || [])].forEach(frame => {
            if (!!current && current.contains(frame)) {
                frame.dataset.bsbLive = '1';
                return;
            }

            if ('1' !== frame.dataset.bsbLive) {
                return;
            }

            delete frame.dataset.bsbLive;

            // Read back and set again, so the address is the one the frame already holds and nothing
            // here has to know how it was composed. Through a variable and not `frame.src =
            // frame.src`, which is the same instruction to a browser and a mistake to a linter —
            // `no-self-assign` does not know that `src` is a setter that navigates.
            const address = frame.src;

            frame.src = address;
        });
    };

    /** The one player that may be running, and nothing else. */
    const playOnly = slide => revealed.forEach((player, el) => {
        if (el === slide?.el) {
            player?.play?.();
        } else {
            player?.pause?.();
        }
    });

    /**
     * This slider's player colours, put on the overlay itself.
     *
     * `Style.js` cannot reach these players. Everything it writes is scoped to `#bsbCarousel-<id>`,
     * and Fancybox appends its overlay to a `body` — the page's or, in the editor, the one the popup
     * renders into. A player in there is not inside the slider by any selector, so the variables are
     * set on the element instead, where they inherit down to every pane the overlay holds.
     *
     * On the container rather than on a slide: both routes into a player pass through here — a feed
     * slide builds its own in `reveal`, a video slide is adopted by `Plyr.setup` in `done` — and the
     * container is the one element above both. Setting a custom property twice with the same value
     * costs nothing, so neither call has to know whether the other ran.
     */
    const paintPlayer = fancybox => {
        const el = fancybox?.container;

        if (!el) {
            return;
        }

        Object.entries(playerVars(attributes?.videoConf)).forEach(([prop, value]) => {
            if (value) {
                el.style.setProperty(prop, value);
            }
        });
    };

    return {
        // Without this the overlay is appended to the outer document while the triggers sit in the
        // iframe, and the lookups below then search a document the lightbox never rendered into.
        parentEl: doc.body,
        on: {
            /**
             * Plyr for the embeds — YouTube today, Vimeo the same way if it is ever wanted.
             *
             * **Why `reveal` and not `done`.** `done` fires when a slide's content finishes loading, and
             * content given as markup has nothing to load: opening one fires `reveal` once and `done` not
             * at all. Measured, because everything below hangs off `done` and none of it was running.
             *
             * A feed slide set to play in a popup hands over a `[data-plyr-provider]` div through
             * `data-html` rather than a YouTube URL, precisely so this can happen. Left to itself Fancybox builds its own
             * iframe, and then YouTube's player appears instead of Plyr — which looks nothing like the
             * video source's popup and ignores every control setting the panel offers. The original code
             * here tried to wrap that iframe in Plyr and could not: Plyr wants a `<video>` or one of
             * these provider divs, and threw "YouTube player element ID required" on anything else.
             *
             * **Scoped to the slide being revealed, never the document.** Fancybox builds the panes either
             * side of the open one ahead of time, and each of them is revealed too — so a document-wide
             * lookup here found more than one embed and started all of them. That is the two videos
             * playing at once: one visible, its neighbour heard from behind the overlay.
             */
            reveal: (fancybox, slide) => {
                paintPlayer(fancybox);

                // Before the Plyr work below and before its early return, because a post pane has
                // no `[data-plyr-provider]` in it and would never reach anything past that line.
                // Asked about the lightbox as a whole rather than about `slide`: this fires for the
                // neighbours too, and what matters is that whichever pane is current ends up
                // playing — not that this particular one was just built.
                syncNativeVideos(fancybox);

                /**
                 * Wire up the album gallery's counter and dots, now that the pane exists in the DOM.
                 *
                 * Inline `<script>` tags do not execute when Fancybox sets innerHTML, so the
                 * IntersectionObserver that tracks which photo is in view is initialised here
                 * instead. Each gallery scroller in this slide gets its own observer; the counter
                 * shows "1 / N" and the active dot highlights the current photo.
                 */
                const scroller = slide?.el?.querySelector('.bsbFeedPostMediaScroller.is-gallery');

                if (scroller && !scroller._bsbObserver) {
                    const media = slide.el.querySelector('.bsbFeedPostMedia');
                    const counter = media?.querySelector('.bsbGalleryCounter');
                    const dots = [...(media?.querySelectorAll('.bsbGalleryDot') || [])];
                    const items = [...scroller.children];
                    const total = items.length;

                    if (total > 1) {
                        const ob = new IntersectionObserver(entries => {
                            entries.forEach(entry => {
                                const idx = items.indexOf(entry.target);

                                if (idx >= 0 && entry.isIntersecting) {
                                    if (counter) {
                                        counter.textContent = `${idx + 1} / ${total}`;
                                    }

                                    dots.forEach((dot, di) => {
                                        dot.classList.toggle('is-active', di === idx);
                                    });
                                }
                            });
                        }, { root: scroller, threshold: 0.6 });

                        items.forEach(child => ob.observe(child));
                        scroller._bsbObserver = ob;
                    }
                }

                const embed = slide?.el?.querySelector('[data-plyr-provider]');
                const igVideo = attributes?.socialQuery?.usePlyr !== false ? slide?.el?.querySelector('.bsbFeedPostVideo') : null;
                const targetMedia = embed || igVideo;

                // Already adopted — Plyr leaves the attribute on the element it took over, so without
                // this a second reveal of the same pane would wrap it twice.
                if (!targetMedia || revealed.has(slide.el)) {
                    return;
                }

                /**
                 * The same `videoConf` the video source uses, so one set of control settings governs both.
                 *
                 * `autoplay` on top of it, and it is not the `isAutoPlay` setting: that one answers "play
                 * a slide's video with nobody asking", while this popup only exists because somebody just
                 * clicked the slide. Fancybox's own iframe played on open — it posts `playVideo` to
                 * YouTube as soon as the pane is ready — so without this, replacing it with Plyr would
                 * cost the visitor a second click. A browser that refuses the autoplay simply leaves the
                 * player paused, which is where it would have been anyway.
                 *
                 * Only for the slide the visitor actually opened. A preloaded neighbour is built with it
                 * off and stays silent until it is navigated to, which `selectSlide` below handles.
                 */
                const conf = plyrConfig(attributes);

                const player = new Plyr(targetMedia, {
                    ...conf,
                    autoplay: fancybox.isCurrentSlide(slide)
                });

                finishPlyr(player, conf);

                manageVideo(player);

                // Read off the config Plyr was handed rather than the attribute, so the panel and the
                // player cannot disagree about it — and only where Plyr will not do it itself.
                if (conf.resetOnEnd) {
                    resetEmbedOnEnd(player);
                }



                revealed.set(slide.el, player);
            },

            /**
             * Navigating the lightbox hands the sound over with the picture.
             *
             * Both halves are needed and neither is enough alone: `unselectSlide` stops the video being
             * left behind — Fancybox keeps its pane in the page, so the audio would otherwise carry on
             * under the next one — and `selectSlide` starts the one arriving, since only the opening slide
             * is built with autoplay on.
             *
             * These also cover the case where a slide is selected before its content exists: the map is
             * empty then and this does nothing, and the `reveal` above autoplays it on the strength of
             * `isCurrentSlide` instead. Whichever order they arrive in, exactly one player is running.
             */
            'Carousel.selectSlide': (fancybox, carousel, slide) => {
                playOnly(slide);
                syncNativeVideos(fancybox);
            },

            'Carousel.unselectSlide': (fancybox, carousel, slide) => {
                revealed.get(slide?.el)?.pause?.();
                syncNativeVideos(fancybox);
            },

            /**
             * The last word on which native video is running.
             *
             * `selectSlide` can arrive before the arriving pane has any content in it, and a pane
             * built ahead of time has already had its `reveal`. `Carousel.change` fires once the
             * move is settled, so whatever the other two missed is put right here. Cheap enough to
             * say three times: it is one query over the open panes and a `play`/`pause` each.
             */
            'Carousel.change': (fancybox) => syncNativeVideos(fancybox),

            /**
             * Every player made for this lightbox, torn down with it.
             *
             * Fancybox empties the pane on close, which stops the iframe — but the Plyr instance around
             * it stays alive and keeps polling YouTube's API, and a new one is made every time the popup
             * opens.
             */
            destroy: () => {
                revealed.forEach(player => player?.destroy?.());
                revealed.clear();
            },

            done: (fancybox) => {
                paintPlayer(fancybox);

                const videoElement = doc.querySelectorAll('.fancybox__html5video');
                const youtubeVideos = doc.querySelectorAll('.has-youtube .fancybox__content');
                const vimeoVideos = doc.querySelectorAll('.has-vimeo .fancybox__content');

                const videoPlayers = Plyr.setup(videoElement, plyrConfig(attributes), {
                    // controls: controlsOpt,
                    fullscreen: {
                        enabled: true,
                        fallback: true,
                        iosNative: true,
                        container: null
                    }
                });

                /**
                 * Only what Plyr can actually take.
                 *
                 * Plyr adopts a `<video>`, an `<audio>`, or a div that tells it what to embed through
                 * `data-plyr-provider`. Fancybox's YouTube and Vimeo panes are none of those — they are
                 * a bare iframe — and handing one over throws "YouTube player element ID required".
                 *
                 * That went unnoticed while nothing opened a YouTube link in the lightbox. A feed slide
                 * set to play in a popup does, so every popup was logging it. Nothing is lost by
                 * skipping them: the iframe is already a player with its own controls, which is why the
                 * popup works regardless. Only `manageVideo`'s orientation lock does not reach them, and
                 * it never did — it threw before it got there.
                 */
                const adoptable = nodes => [...nodes].filter(node => 
                    node.querySelector('video, audio, [data-plyr-provider]') && !node.querySelector('.plyr')
                );

                const youtubePlayers = Plyr.setup(adoptable(youtubeVideos));
                const vimeoPlayers = Plyr.setup(adoptable(vimeoVideos));

                videoPlayers?.forEach(player => manageVideo(player));
                youtubePlayers?.forEach(player => manageVideo(player));
                vimeoPlayers?.forEach(player => manageVideo(player));
            }
        },

        // wheel: options.wheel,
        autoFocus: false,
        backdropClick: "close",
        closeButton: "auto",
        commonCaption: false,
        contentClick: "toggleZoom",
        contentDblClick: "toggleCover",
        defaultDisplay: "flex",

        /**
         * Prevent Fancybox's carousel from capturing horizontal drag/swipe on album gallery
         * scrollers. `panOnlyZoomed: true` stops Panzoom from initiating a drag unless the
         * content is already zoomed in, but album scrollers need their own touch handling
         * regardless. The `touch` function filters out events that originate from the gallery
         * scroller or its navigation buttons.
         */
        Carousel: {
            Panzoom: {
                panOnlyZoomed: true,
                touch: true,
            },
        },

        Thumbs: {
            type: 'classic',
            // showOnStart: thumb.showOnStart,
            // minCount: 2,
        },

        // Slideshow: {
        //     playOnStart: slideShow?.playOnStart,
        //     timeout: slideShow?.timeout,
        // }
    };
};

/**
 * Binds the lightbox to a slider's triggers, so a click on one opens it.
 *
 * This is the front end's route and Fancybox's own: one delegated listener on the slider, and the
 * gallery is worked out from the triggers inside it when the click arrives. The editor cannot rely on
 * it — see `bsb_open_popup`.
 */
export const bsb_lightbox_config = (id, attributes, container = null) => {
    const doc = docOf(container);

    Fancybox.bind(container || doc.body, galleryOf(id), bsb_fancybox_options(attributes, container));
};

/**
 * The same lightbox, opened without waiting for Fancybox to notice the click.
 *
 * **Why the editor needs this.** Fancybox opens from a delegated click handler, and the first thing
 * that handler does is give up if anything has already called `preventDefault` on the event. Inside the
 * editor canvas a click on a slide is not just a click — it is also how a block is selected — and by
 * the time it reaches the slider the default is long gone. So the popup simply never opened there,
 * while the same markup worked on the front end. b-slider hit this too and solved it the same way, with
 * `bsb_open_video_popup`.
 *
 * `fromNodes` rather than `show`, so the editor gets the gallery the visitor gets: every trigger in the
 * slider, opened at the one that was clicked, each slide read off its own attributes exactly as the
 * delegated path reads them. Building a slide list here by hand would be a second description of what a
 * slide is, and the two would drift.
 *
 * **And the overlay renders in this frame, not the one the slides are in.** That is `parentEl` below, and
 * it is what makes the video play. Plyr embeds YouTube through YouTube's iframe API, which it loads into
 * the window this module runs in — the outer one in the editor. The player then talks to that API by
 * posting messages to its own parent window, so with the overlay inside the canvas iframe the messages
 * arrive at the canvas and the API never hears them: the player is built and Plyr reports itself ready,
 * but every command is dropped and nothing ever starts. Measured both ways in a browser — same document
 * as the API, `getPlayerState()` is 1 and the time advances; inside the iframe it stays at -1, unstarted,
 * even when `play()` is called directly. Rendering next to the API is the whole fix; the triggers are
 * still read from the canvas, since that is where the slides are.
 *
 * The stylesheets are here to dress it: `wp_enqueue_registered_block_scripts_and_styles` enqueues a
 * block's `style` and `editorStyle` on the editor screen itself — `wp_should_load_block_assets_on_demand`
 * returns false for any admin request — so Fancybox's CSS, Plyr's, and the slider's own all load in this
 * document as well as in the canvas.
 */
export const bsb_open_popup = (id, attributes, trigger, container = null) => {
    /**
     * Nothing to do if a lightbox is already up.
     *
     * Fancybox's delegated listener sits on the slider itself, while React dispatches its handlers from
     * the root — so on a click the delegated one runs first, and where it succeeds this would open a
     * second lightbox on top of the one already showing. Cheaper to ask than to reason about which of
     * the two won on any given click.
     */
    if (Fancybox.getInstance()) {
        return;
    }

    const doc = docOf(container || trigger);
    const triggers = [...(container || doc.body).querySelectorAll(galleryOf(id))];

    if (!triggers.length) {
        return;
    }

    Fancybox.fromNodes(triggers, {
        // `document`, not the trigger's: this module runs in the frame the API lives in, whichever
        // frame the slides are in.
        ...bsb_fancybox_options(attributes, container || trigger, document),
        // `indexOf` can only miss if the trigger sits outside the container it was given, which would
        // be a wiring mistake rather than a state to handle — opening at the first slide is a better
        // answer to it than opening nothing.
        startIndex: Math.max(0, triggers.indexOf(trigger)),
        triggerEl: trigger
    });
};
import { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { playerConf } from '../../../utils/config';

/**
 * How long the cursor has to stay before anything is fetched.
 *
 * Not a nicety — it is the whole reason this costs nothing to walk past. A carousel is a row of
 * slides, and a mouse crossing it on the way somewhere else enters and leaves four or five of them;
 * without the wait each of those would have started a download or an embed for a slide nobody looked
 * at. Half a second is longer than a crossing and shorter than a decision, which is the same figure
 * YouTube's own hover preview settles on.
 */
const DELAY = 500;

/**
 * How long a preview survives the cursor leaving the picture.
 *
 * **Not a flourish — without it the sound button cannot be reached.** In the default layout the arrows
 * are two invisible 90px blocks laid over the full height of the slide, and they are not inside the
 * picture box the hover is measured on. So the journey from the middle of a slide to a button in its
 * corner crosses ground that counts as "outside", `mouseleave` fires, and the preview and its controls
 * vanish from under the pointer on the way to them.
 *
 * The controls cancel this the moment the cursor reaches them, so the wait is only ever spent in
 * transit. Short enough that leaving a slide still feels like leaving it.
 */
const GRACE = 450;

/**
 * The one preview allowed to be playing.
 *
 * Held at module scope on purpose: the slides know nothing about each other, and two of them playing
 * at once is the failure this prevents — a mouse moving from slide to slide leaves the first one
 * running behind the second, and a page with four muted videos playing is four videos being decoded.
 * A ref object rather than a function, so the entry stays valid across the re-renders that swap the
 * closure out from under it.
 */
let running = null;

/**
 * Whether the visitor has asked for sound, remembered for as long as the page is open.
 *
 * Also module scope, and for the same kind of reason: the answer belongs to the visitor, not to a
 * slide. Somebody who turned the sound on for one preview has said what they want of the next one, and
 * making them press the speaker again on every slide would be asking the same question over and over.
 *
 * Not persisted past the page. A slider that made noise the moment a hover landed, on a page the
 * visitor has only just opened, is the behaviour every browser's autoplay policy exists to prevent —
 * so the answer starts at "no" on every visit and only a press changes it.
 */
let wantsSound = false;

/**
 * Whether this visitor's setup and preferences allow a preview at all.
 *
 * Asked when the cursor arrives rather than once at import, because a laptop with a touchscreen and a
 * trackpad can answer differently from one moment to the next, and the motion preference is a setting
 * somebody may change while the page is open.
 *
 * **A pointer that cannot hover gets nothing.** On a phone a `mouseenter` is synthesised from the tap
 * that is *also* opening the popup, so without this the preview would start under a lightbox that is
 * already playing the same video with sound.
 *
 * **`prefers-reduced-motion` is respected as a refusal, not softened.** There is no reduced version of
 * a video playing by itself; the honest answer is the still frame, which is what the slide already
 * shows.
 */
const mayPreview = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return false;
    }

    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * What this slide can play under the cursor, or nothing.
 *
 * Two kinds, because the feeds give two different things and only one of them is a file:
 *
 * - **A file** — Instagram's `media_url`, set by `InstagramFeed::makeItem()`, and the same field on a
 *   video inside an album. A `<video>` plays it with no third-party script and no request until the
 *   cursor has stayed.
 * - **An embed** — a YouTube item carries a `videoId` and nothing else; there is no file to fetch. So
 *   the preview is YouTube's own player, muted and stripped of its controls.
 *
 *   YouTube's *own* hover preview is not available to do this with: the short clip it plays on
 *   youtube.com comes from `i.ytimg.com/an_webp/…` under a signature (`sqp`, `rs`) that cannot be
 *   composed from outside, and that host answers 404 without a browser User-Agent and hands back a
 *   grey placeholder once it starts rate-limiting — a placeholder that looks like a successful
 *   response. Measured before this was written, which is why the embed is what got built.
 *
 * A withheld Reel — `thumbnail_url` and no `media_url`, which Instagram does for some posts with
 * licensed audio — has neither, so it gets no preview. The popup's stand-in embed is not reused here:
 * it opens on Instagram's own still with its own play button, so it would preview nothing while
 * loading Instagram's scripts to do it.
 */
export const hoverPreviewOf = (post, socialQuery, videoConf) => {
    if (!socialQuery?.hoverPreview) {
        return null;
    }

    /**
     * The picture this slide is actually showing, which is the only thing allowed to come alive.
     *
     * An Instagram feed mixes photos, Reels and albums, and an album mixes them again inside itself. The
     * slide's still is the album's *first* item — `InstagramFeed::imageUrl()` returns the first child
     * with a picture — so taking "any video anywhere in this post" would put a video from the third
     * frame of an album over a still of the first. A visitor rests on a photograph and something else
     * entirely starts playing: nothing on screen would explain it, and it reads as the wrong video
     * loading rather than as a feature.
     *
     * So the file has to belong to the frame on show. `post.videoUrl` is that for a Reel — set only when
     * `media_type` is `VIDEO`, so a photo post never has one — and for an album it is the cover, and only
     * when the cover is itself the video.
     *
     * An album whose video sits further in still gets its play badge and its corner-player button: those
     * say "there is a video in this post", which is true, and both are answered by a deliberate click
     * rather than by a cursor passing over.
     */
    const gallery = Array.isArray(post?.gallery) ? post.gallery : [];
    const cover = gallery.find(item => item?.url);

    const file = post?.videoUrl
        || (cover?.isVideo ? cover.videoUrl : '')
        || '';

    if (file) {
        return { kind: 'video', src: file };
    }

    // Into an iframe `src`, so it is narrowed to what an id can hold rather than trusted — the same
    // guard, and for the same reason, as `feedPlayerHtml` in PostItem.
    const id = String(post?.videoId || '').replace(/[^A-Za-z0-9_-]/g, '');

    if (!id) {
        return null;
    }

    /**
     * Privacy-Enhanced Mode decides the host, exactly as it does for the popup's player.
     *
     * One answer to "where does this slider load YouTube from" rather than two: a site that turned the
     * toggle on to keep youtube.com out of its pages would be badly served by a preview that went
     * there anyway. See `youtube.noCookie` in `plyrConfig`.
     */
    const host = playerConf(videoConf).ytNoCookie
        ? 'https://www.youtube-nocookie.com'
        : 'https://www.youtube.com';

    /**
     * A player with nothing on it but the picture.
     *
     * `mute=1` is not a preference here either — a browser refuses to start a video with sound behind
     * it, and a refused autoplay leaves a still frame and no explanation. `loop`/`playlist` is
     * YouTube's own idiom for repeating a single video; without the second parameter `loop` does
     * nothing. `controls`, `disablekb` and `fs` come off because the slide is not the player: the
     * click belongs to the popup, and a control the cursor cannot reach is a control that should not
     * be drawn.
     */
    const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        controls: '0',
        loop: '1',
        playlist: id,
        playsinline: '1',
        modestbranding: '1',
        rel: '0',
        disablekb: '1',
        fs: '0',
        iv_load_policy: '3',
        /**
         * So the speaker button has something to talk to.
         *
         * The player is another document on another origin; nothing here can reach into it and turn
         * the sound on. With `enablejsapi` it accepts commands by `postMessage` instead, which is how
         * `unMute` gets in — see `command` in the component below. `origin` is what YouTube's own
         * documentation asks for alongside it, and it can be given honestly here: an embed is only
         * ever built for a document that has a real address, see `mayFrameEmbed`.
         */
        enablejsapi: '1',
        origin: typeof window !== 'undefined' ? window.location.origin : ''
    });

    // The host travels with the embed because `postMessage` needs it as a target origin. Sending to
    // `'*'` would work and would also broadcast the command to anything else listening.
    return { kind: 'embed', src: `${host}/embed/${id}?${params.toString()}`, host };
};

/**
 * Whether an embed put in this document would be given a referrer.
 *
 * **YouTube refuses to play without one — that is Error 153, "Video player configuration error".**
 * Measured, not inferred: the same embed URL and the same video, loaded from a page sending
 * `Referrer-Policy: no-referrer`, answers with exactly that error; from the same page with the header
 * left alone it plays. So the question for any embed is only ever whether a referrer will be sent.
 *
 * **Which is what rules out the editor canvas.** WordPress builds it as an iframe whose `src` is a
 * `blob:` URL — `URL.createObjectURL(new Blob([…], { type: 'text/html' }))`, see the canvas markup in
 * `block-editor.min.js` — and a `blob:` document has no http(s) URL to offer as a referrer, so every
 * request out of it goes without one. A `referrerpolicy` on the iframe does not rescue it: both were
 * put in a real blob document and both came back as Error 153. There is nothing to configure here,
 * only somewhere the embed cannot work.
 *
 * So in the canvas a YouTube slide keeps its thumbnail, and on the published page — an ordinary
 * document with an ordinary referrer — it previews. A `<video>` is not asked this question: it plays a
 * file, and no service is deciding whether to allow it.
 *
 * The document is read off the element rather than taken as `window.document`, because that is the
 * only thing that knows which of the two it is in.
 */
const mayFrameEmbed = el => /^https?:/i.test(el?.ownerDocument?.URL || '');

/**
 * The hovering itself: what starts a preview, what stops it, and what it does to the slider.
 *
 * Returns the handlers to spread onto the element being hovered and the ref to put on it. The element
 * is the slide's picture box rather than the anchor inside it, so a slide whose click opens nothing —
 * "Opens the original in a new tab" leaves the picture unwrapped — previews just the same.
 *
 * **Focus starts it too.** Reaching the slide with the keyboard is the same intent as resting on it
 * with a mouse, and a preview only a mouse can ask for is a feature half the visitors cannot use.
 * `mayPreview` still applies: somebody tabbing on a phone gets the still.
 */
export const useHoverPreview = preview => {
    const [active, setActive] = useState(false);
    const timer = useRef(null);
    const hostRef = useRef(null);

    /**
     * The sound, and the element it belongs to — both held here rather than inside the preview.
     *
     * The speaker button cannot live inside the picture box any more: the slider's arrows are laid over
     * the corners of the slide from outside that box, and because `Style.js` gives `.img` a `z-index`
     * for the blurred backdrop, everything inside it is trapped below them however it is stacked. The
     * button had to move out to `.item`, where it can sit above the arrows — so the state it needs
     * moved here, to the one place both it and the preview can reach.
     */
    const [sound, setSound] = useState(wantsSound);
    const media = useRef(null);

    /**
     * Whether the cursor is on this slide — kept here rather than left to CSS `:hover`.
     *
     * **The quick actions could not be clicked, and this is why.** Their `pointer-events` were switched on
     * by `.item:hover`, and the arrows are laid over the corners of the slide from outside it: reaching a
     * button meant passing over an arrow, `:hover` went false, the button stopped taking the cursor, and
     * so the arrow — now the topmost thing that would take it — got the click and slid the carousel.
     * Chicken and egg: the button could only be hit while something inside the slide was already hit.
     *
     * Driven by our own handlers instead, including the ones on the buttons themselves, so the cursor
     * arriving at a control *is* what keeps the control alive. The speaker never had this problem because
     * its `pointer-events` were never conditional.
     */
    const [hovered, setHovered] = useState(false);

    /** The pending "the cursor has gone" — see `GRACE`, and `keepHandlers` below, which cancels it. */
    const leaving = useRef(null);

    /**
     * The slider we paused, if we paused one.
     *
     * Recorded rather than assumed, so `resume` is only ever called on the instance that was actually
     * paused — resuming an autoplay the visitor had stopped themselves would be this feature
     * restarting a slider nobody asked to move.
     */
    const paused = useRef(null);

    /**
     * Whether this slide has had its click taken, and so must stay quiet until the cursor leaves.
     *
     * **Stopping a preview is not enough to keep it stopped, and this is why.** Tearing the preview
     * out from under the cursor changes what the pointer is over, and the browser answers that by
     * sending `mouseover` again for the box underneath — which React reports as a fresh
     * `onMouseEnter`. So a click stopped the preview and then, half a second later, started it again:
     * with the popup that went unseen behind the overlay, and with the mini player it was a slide
     * replaying the video that had just docked in the corner, both playing at once.
     *
     * Cleared only by the cursor genuinely leaving, which is the one event that cannot be a side
     * effect of our own DOM changes.
     */
    const suppressed = useRef(false);

    /**
     * `stop` behind a ref, because two things call it: this slide's own handlers, and the *next*
     * slide's, reaching in through `running` to end this one. A plain function would be a new closure
     * every render and the registry would be holding a stale one.
     */
    const stop = useRef(() => { });

    stop.current = () => {
        if (timer.current) {
            clearTimeout(timer.current);
            timer.current = null;
        }

        if (leaving.current) {
            clearTimeout(leaving.current);
            leaving.current = null;
        }

        /* `suppressed` is deliberately not cleared here. Stopping and forgiving are different things:
           a click stops the preview *and* asks it to stay down, so the flag outlives this call and is
           lifted only by the cursor actually leaving — see `stopSoon` and `onBlur`. */

        if (running === stop) {
            running = null;
        }

        if (paused.current) {
            // Swiper's own API, and it can be missing: `autoplay` is only built when the module is
            // running, and the instance is destroyed and rebuilt as settings change in the editor.
            try {
                paused.current.autoplay?.resume();
            } catch (e) {
                // A destroyed instance throws on the way out, and there is nothing to resume on one.
            }

            paused.current = null;
        }

        setActive(false);
    };

    /**
     * Anything left playing when the slide goes away.
     *
     * A grid pages, a carousel with `loop` recycles its slides, and the editor rebuilds them whenever
     * a setting changes — so this runs often, and without it each of those would leave a paused
     * autoplay that nothing was ever going to resume.
     */
    useEffect(() => () => stop.current(), []);

    /** The cursor is somewhere it is allowed to be, so whatever was about to end is called off. */
    const keep = () => {
        if (leaving.current) {
            clearTimeout(leaving.current);
            leaving.current = null;
        }
    };

    /**
     * The cursor has left the picture — which is not yet a reason to stop. See `GRACE`.
     *
     * A pending stop is not restarted by a second `mouseleave`, so crossing in and out of the arrow
     * strip does not extend the wait indefinitely.
     */
    const stopSoon = () => {
        if (leaving.current) {
            return;
        }

        leaving.current = setTimeout(() => {
            leaving.current = null;
            // Gone for real, so a click this slide took is forgiven and the next hover starts fresh.
            suppressed.current = false;
            setHovered(false);
            stop.current();
        }, GRACE);
    };

    /**
     * The visitor asking for sound, or asking for it to stop.
     *
     * **A press, and not a hover, is what makes this possible at all.** Every browser refuses to start a
     * video with sound without a gesture behind it, and a refused start is not a silent video — it is no
     * video, a still frame with nothing to say for itself. So the preview always begins muted and this
     * is the gesture that lifts it, which is exactly what YouTube's own hover preview does.
     *
     * **The event is stopped in both directions.** `preventDefault` because the button sits over a slide
     * whose click Fancybox is listening for — without it, turning the sound on would also open the
     * lightbox over the thing that had just started playing. `stopPropagation` because the slide treats
     * a click as "the visitor wants the real player", and would tear the preview down.
     */
    const toggleSound = event => {
        event.preventDefault();
        event.stopPropagation();

        const next = !sound;

        wantsSound = next;
        setSound(next);

        const el = media.current;

        if (!el) {
            return;
        }

        if ('video' === preview?.kind) {
            el.muted = !next;

            // Unmuting a video the browser allowed only because it was silent can pause it — the policy
            // is checked again when the audio starts. Asking it to carry on is free when it never stopped.
            el.play()?.catch(() => {
                el.muted = true;
                wantsSound = false;
                setSound(false);
                el.play()?.catch(() => { });
            });

            return;
        }

        /**
         * One command into the YouTube player.
         *
         * It is a document on another origin, so there is no element to set a property on and no `muted`
         * to write — `postMessage` in the shape the IFrame API listens for is the whole interface, which
         * is what `enablejsapi` in the URL is there to switch on. Addressed to the embed's own host
         * rather than `'*'`, so the command goes to the player and not to every frame on the page.
         */
        try {
            el.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: next ? 'unMute' : 'mute', args: [] }),
                preview.host
            );
        } catch (e) {
            // A frame already gone, or one that never finished loading. The button simply did not take.
        }
    };

    const start = () => {
        if (!preview || active || timer.current || suppressed.current || !mayPreview()) {
            return;
        }

        // Asked before the wait rather than after it, so an embed that cannot play schedules nothing
        // at all — see `mayFrameEmbed` for the document this is really about.
        if ('embed' === preview.kind && !mayFrameEmbed(hostRef.current)) {
            return;
        }

        timer.current = setTimeout(() => {
            timer.current = null;

            if (running && running !== stop) {
                running.current();
            }

            running = stop;

            /**
             * The carousel holds still while something is playing on it.
             *
             * Reached through the DOM rather than passed down, because the slide does not have the
             * Swiper instance and every layout that renders one has a different shape. Swiper puts
             * itself on its own root element, which is the one thing that is the same everywhere.
             *
             * Without this a preview starts and the slide slides out from under the cursor a second
             * later — the video carries on playing off-screen in the slide it belongs to, and the
             * cursor is over a different slide that never got a `mouseenter`.
             */
            const swiper = hostRef.current?.closest('.swiper')?.swiper;

            if (swiper?.autoplay?.running) {
                try {
                    swiper.autoplay.pause();
                    paused.current = swiper;
                } catch (e) {
                    // Nothing was paused, so nothing is recorded and the preview simply plays on a
                    // moving slider — which is the behaviour it had before this ran at all.
                }
            }

            setActive(true);
        }, DELAY);
    };

    /**
     * Returned whether or not there is anything to preview.
     *
     * There used to be an early exit here for a slide with no video, which quietly took the hover
     * tracking away from exactly the slides that still have a button in the corner — an RSS item with
     * only a link to offer. `start()` already declines on its own when there is nothing to play.
     */
    const enter = () => {
        keep();
        setHovered(true);
        start();
    };

    return {
        active,
        hovered,
        hostRef,
        sound,
        toggleSound,
        /** For the preview itself to hold on to — the sound is toggled through this element. */
        mediaRef: media,
        /**
         * For the controls that sit outside the picture box.
         *
         * They live at `.item` level so they can rise above the arrows, which means the cursor is
         * *outside* the hovered box while it is on them. Without these the preview would end the moment
         * the visitor reached for its sound.
         */
        keepHandlers: {
            onMouseEnter: enter,
            onMouseLeave: stopSoon
        },
        handlers: {
            onMouseEnter: enter,
            /* Not a stop but a stop *soon* — see `GRACE`. The arrows are laid over the corners of the
               slide from outside this box, so the way to a control crosses ground that counts as having
               left. */
            onMouseLeave: stopSoon,
            onFocus: enter,
            /**
             * Focus moving *inside* the slide is not focus leaving it.
             *
             * `focusout` bubbles, so tabbing from the slide's link to the speaker button beside it
             * raises this — and without the check the preview would be torn down by the very act of
             * reaching for its own sound control. `relatedTarget` is where focus has gone; only when
             * that is outside this box has the visitor actually left.
             *
             * A `relatedTarget` of `null` — focus going to the page itself, or to another window — is
             * outside by the same reading, which is why the check is written this way round.
             */
            onBlur: event => {
                if (!hostRef.current?.contains(event.relatedTarget)) {
                    suppressed.current = false;
                    setHovered(false);
                    stop.current();
                }
            },
            /**
             * A click has asked for the real thing, so the stand-in gets out of the way.
             *
             * The popup opens over the slide and plays the same video with sound; leaving the preview
             * running underneath means the audio of one over the picture of the other, and a carousel
             * still paused behind a lightbox that has taken over anyway.
             *
             * **`mousedown` and not only `click`, and that is not belt-and-braces.** In the editor the
             * slide's anchor takes the click itself and calls `stopPropagation` on it — see
             * `onPlayClick` in PostItem — so a React `onClick` up here is never reached, and the
             * preview went on playing behind an open lightbox. Nothing stops the `mousedown`.
             *
             * `click` stays for the keyboard, which raises one with no `mousedown` behind it.
             *
             * The cursor has not moved, so no `mouseenter` follows — the preview stays down until the
             * visitor leaves the slide and comes back, which is the right answer for somebody who has
             * just closed the popup.
             */
            onMouseDown: () => {
                suppressed.current = true;
                stop.current();
            },
            onClick: () => {
                suppressed.current = true;
                stop.current();
            }
        }
    };
};

/**
 * The speaker, drawn twice: crossed out while the preview is silent, sounding once it is not.
 *
 * Inline SVG is fine here where it would not be for the share panel — this is a React component
 * rendered once per playing preview, not markup carried in a `data-` attribute on every slide.
 */
const speaker = on => <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <path d='M3 10v4h3l4 3V7L6 10H3z' fill='currentColor' />
    {on
        ? <path d='M14 8.8a4 4 0 0 1 0 6.4M16.5 6a7.5 7.5 0 0 1 0 12' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
        : <path d='M13.5 9.5l5 5m0-5l-5 5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />}
</svg>;

/**
 * The preview itself, laid over the slide's own picture.
 *
 * Mounted only while the hover is live — the element existing *is* the request, so a slide that is
 * never hovered has no video element, no iframe and no traffic. The thumbnail stays in the markup
 * underneath and is what shows through until this is ready, which is why there is no poster here and
 * no gap while it loads.
 *
 * Invisible to assistive technology and unreachable by tab, and it takes no pointer events either: it
 * says nothing the slide does not already say, and an iframe that took the cursor would swallow the
 * click the popup is waiting for. Its one control lives outside it — see `SoundButton`, and the note
 * on `mediaRef` for why the two are no longer in the same box.
 */
const HoverPreview = ({ preview, imageFit = 'blur', label = '', mediaRef, sound = false }) => {
    /** Faded in when there is something to see, so a slide never flashes a black box first. */
    const [ready, setReady] = useState(false);

    /**
     * A file that will not play, taken as an answer.
     *
     * Instagram signs its video URLs and they stop working after about a day — measured — so a stored
     * feed synced less often than that reaches a visitor with dead links. Removed rather than left
     * hidden, so nothing is holding a failed decode open.
     */
    const [failed, setFailed] = useState(false);

    if (!preview || failed) {
        return null;
    }

    const hold = el => {
        if (mediaRef) {
            mediaRef.current = el;
        }
    };

    const fit = 'cover' === imageFit ? 'cover' : 'contain';
    const className = `bsbHoverPreview${ready ? ' is-ready' : ''}`;

    /**
     * The box both kinds share, and which the embed needs.
     *
     * `object-fit` has no meaning for an iframe — the player is another document and it letterboxes
     * inside whatever rectangle it is given. So for an embed the shaping happens to the rectangle: see
     * `.bsbHoverPreviewBox` in style.scss, where a slide taller than 16:9 gets a centred widescreen
     * frame rather than a full-height box with black bars painted over the backdrop.
     */
    return <span className={`bsbHoverPreviewBox is-fit-${fit}`}>
        {'video' === preview.kind
            ? <video
                className={className}
                src={preview.src}
                loop
                playsInline
                preload='none'
                aria-hidden='true'
                tabIndex={-1}
                onPlaying={() => setReady(true)}
                onError={() => setFailed(true)}
                /**
                 * Muted and started from here rather than through `muted`/`autoPlay` attributes.
                 *
                 * React sets `muted` as a property after the element is in the document, and an
                 * `autoplay` is evaluated as it is inserted — so for that one frame the browser sees a
                 * video with sound asking to start by itself, refuses it, and the preview never plays.
                 * Muting first and calling `play()` ourselves happens in the right order every time.
                 *
                 * **It starts muted even where the visitor has already asked for sound**, and only then
                 * lifts it. Sticky activation usually means the unmuted start would have been allowed,
                 * but "usually" is the wrong bar: refused, there is no picture at all, whereas a muted
                 * start unmuted a moment later is at worst a second of silence.
                 *
                 * Rejections are swallowed. A browser may still decline — a background tab, a power
                 * saving mode — and there is nothing to tell the visitor. The thumbnail is there.
                 */
                ref={el => {
                    hold(el);

                    if (!el) {
                        return;
                    }

                    el.muted = true;

                    el.play()?.then(() => {
                        if (sound) {
                            el.muted = false;
                        }
                    })?.catch(() => { });
                }}
            />
            : <iframe
                ref={hold}
                className={className}
                src={preview.src}
                title={label}
                tabIndex={-1}
                frameBorder='0'
                /* `autoplay` is the one permission this actually needs — without it the muted start is
                   refused in a cross-origin frame. The other two are what the player uses once it is
                   running. No `fullscreen`: there is no control to reach it with. */
                allow='autoplay; encrypted-media; picture-in-picture'
                onLoad={event => {
                    setReady(true);

                    /* The player only listens once it has loaded, so a choice carried over from an
                       earlier slide is applied here rather than in the URL. */
                    if (sound) {
                        try {
                            event.currentTarget.contentWindow?.postMessage(
                                JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
                                preview.host
                            );
                        } catch (e) {
                            // Nothing to command yet; the button is still there to ask again.
                        }
                    }
                }}
            />}
    </span>;
};

/**
 * The sound control, standing outside the preview it belongs to.
 *
 * **Why it is not inside the picture box.** The slider's arrows are two invisible blocks laid over the
 * full height of the slide from outside that box, and `Style.js` gives `.img` a `z-index` for the
 * blurred backdrop — which makes it a stacking context, so nothing inside it can be raised above the
 * arrows however it is stacked. A button in the corner of the picture was therefore a button the arrows
 * took every click from: pressing it slid the carousel instead of turning the sound on. Rendered at
 * `.item` level it competes with the arrows directly, and wins.
 *
 * The press is what makes sound possible at all — see `toggleSound`, which is where the state lives so
 * that this and the preview can share it.
 */
export const SoundButton = ({ sound, onToggle, ...rest }) => <button
    type='button'
    className={`bsbHoverSound ${sound ? 'is-on' : 'is-off'}`}
    aria-label={sound ? __('Mute preview', 'b-slider') : __('Play preview with sound', 'b-slider')}
    aria-pressed={sound}
    title={sound ? __('Mute preview', 'b-slider') : __('Play preview with sound', 'b-slider')}
    onMouseDown={event => { event.preventDefault(); event.stopPropagation(); }}
    onClick={onToggle}
    {...rest}
>
    {speaker(sound)}
</button>;

export default HoverPreview;

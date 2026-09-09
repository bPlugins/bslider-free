import { __ } from '@wordpress/i18n';

/**
 * The tutorial videos, in one place.
 *
 * Kept as one map so an address is changed in a single edit rather than hunted through the files that
 * offer it, and read as "is there a video?" at the point of use — an empty string renders nothing at
 * all. A link that goes nowhere is worse than no link: somebody stuck on a panel clicks it, lands on
 * nothing, and now has two problems.
 *
 * Only the videos this plugin's panels actually cover are listed. The paid build carries more — the
 * feed credentials, the JSON mapping — because it has the panels those explain; adding them here
 * would offer help for screens that do not exist.
 */

/**
 * The setup playlist all the videos belong to.
 *
 * Carried on every link so the video opens in the series rather than on its own: somebody who came
 * for one answer often needs the next, and the playlist puts it one step away instead of back in a
 * search box. Held apart from the ids so a moved playlist is one edit.
 */
const PLAYLIST = 'PLaYpMGTB1oSs';

/** `watch?v=…&list=…`, with the position in the series when it is known. */
const watch = (id, index = 0) =>
    `https://www.youtube.com/watch?v=${id}&list=${PLAYLIST}${index ? `&index=${index}` : ''}`;

export const TUTORIAL_VIDEOS = {
    /* What a slide shows: the Slide Content panel, and — in the paid build — the badges panel. Offered
       at the head of the panel rather than beside one toggle, since it covers the whole of it. */
    slideContent: watch('ublq1N-Bc3o', 2),

    /* Building slides out of Gutenberg blocks. Offered under the Source Type tiles rather than in a
       panel of its own, because `blocks` has none: choosing it takes the Slides, Title and Content
       Position panels away and moves the work onto the canvas, so the sidebar is at its emptiest
       exactly when somebody most needs telling where the slides went. */
    blocksSource: watch('7KWplscyNhk', 1),
};

/**
 * How long each one runs, so the decision to click is made before clicking rather than after.
 *
 * Empty until each length is known: a runtime is a promise about somebody's next few minutes, and a
 * guessed one is worse than none. `VideoHelpLink` simply omits the bracket when a key is missing, so
 * filling these in later needs no other change.
 */
const RUNTIME = {};

/** The play glyph, inline so a two-line link costs no icon font and no extra request. */
const playIcon = <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <circle cx='12' cy='12' r='10' fill='none' stroke='currentColor' strokeWidth='1.6' />
    <path d='M10 8.5l6 3.5-6 3.5z' fill='currentColor' />
</svg>;

/**
 * A link to one tutorial video, or nothing.
 *
 * `video` names a key of `TUTORIAL_VIDEOS`; an unknown key or an empty address renders nothing, which
 * is what lets a video be removed from the map without touching the places that offer it.
 *
 * `label` says what the video shows, and the runtime is appended so the length is known up front.
 * `target='_blank'` because the reader is mid-setup — navigating away would cost them the post they
 * are editing.
 */
export const VideoHelpLink = ({ video, label, className = '' }) => {
    const href = TUTORIAL_VIDEOS[video] || '';

    if (!href) return null;

    const runtime = RUNTIME[video] || '';

    return <a
        className={`bsbNoticeVideo ${className}`.trim()}
        href={href}
        target='_blank'
        rel='noopener noreferrer'
    >
        {playIcon}
        {runtime
            ? /* translators: 1: what the video shows, 2: how long it runs, e.g. 3 min */
              `${label} (${runtime})`
            : label}
    </a>;
};

/**
 * The labels, so the same video is described the same way wherever it is offered.
 */
export const videoLabels = {
    slideContent: () => __('Watch: slide content and badges', 'b-slider'),
    blocksSource: () => __('Watch: build slides with blocks', 'b-slider'),
};

export default VideoHelpLink;

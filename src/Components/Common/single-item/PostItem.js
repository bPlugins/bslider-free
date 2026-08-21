import { createElement, useEffect, useRef } from 'react';
import { __ } from '@wordpress/i18n';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle, resolveExcerpt } from './AcfFields';
import HoverPreview, { SoundButton, hoverPreviewOf, useHoverPreview } from './HoverPreview';
import { play, instagram, externalLink } from '../../../utils/icons';
import { bsb_open_popup } from '../../../utils/config';
import LinkedPicture from './LinkedPicture';
import SlideLink from './SlideLink';
import { openMiniPlayer } from '../../../utils/miniPlayer';
import { getLocalizedDate, isProActive } from '../../../utils/functions';

/**
 * The corner-player glyph: a frame with a smaller frame in its bottom corner.
 *
 * The same shape every player uses for this, so it needs no label to be understood — which matters for
 * a button that is 30px across and appears only while the cursor is on the picture.
 */
const miniPlayerIcon = <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
    <rect x='3' y='4' width='18' height='16' rx='2' fill='none' stroke='currentColor' strokeWidth='2' />
    <rect x='11.5' y='11.5' width='7.5' height='6.5' rx='1' fill='currentColor' />
</svg>;

const heartIcon = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="bsb-stat-icon">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

const commentIcon = (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="bsb-stat-icon">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

/**
 * A title as plain text, for an attribute.
 *
 * The title is HTML — it is written into the heading with `dangerouslySetInnerHTML` — so it cannot go
 * into `alt` as it stands: a screen reader would read out the tags and the entities.
 */
const stripTags = html => {
    if (!html) return '';

    const text = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Entities decoded the way the browser would, so `&amp;` is read as "and" rather than "amp".
    return typeof document !== 'undefined'
        ? Object.assign(document.createElement('textarea'), { innerHTML: text }).value
        : text;
};

/**
 * What the lightbox shows for a feed slide: a Plyr player, not the service's own embed.
 *
 * Handed to Fancybox through `data-html`, which is the one route that works in both places this
 * renders. `data-type="inline"` and `"clone"` would let the markup live in the slide, but Fancybox
 * resolves those with `document.getElementById` — the *outer* document, while under apiVersion 3 the
 * slides are inside the editor's iframe, so the lookup finds nothing and the pane opens on an error.
 * A string carries across both documents. See `setInlineContent` in @fancyapps/ui.
 *
 * One root element on purpose. Fancybox parses the string and, when it is a single element, makes that
 * element the pane itself and adds `.fancybox__content` to it — which is what `.fancybox__content
 * .bsbFeedPlyr` in style.scss is written against. Two roots and it would wrap them in a bare div
 * instead, and the pane would have no width.
 *
 * The inner div is Plyr's documented way to ask for an embed. `bsb_lightbox_config` finds it by
 * `[data-plyr-provider]` and hands it over; nothing here initialises anything, so a slide that is
 * never clicked costs one attribute and no request.
 */
const feedPlayerHtml = (post, feedType, usePlyr = true, nativeParams = {}) => {
    // Into an HTML attribute and then into a DOM parser, so anything but what an id can contain is
    // dropped. YouTube's are `[A-Za-z0-9_-]{11}`; the class of characters is the same for Vimeo's
    // numeric ids, which is what this will be handed when that reader exists.
    const embedId = String(post?.videoId || '').replace(/[^A-Za-z0-9_-]/g, '');

    if (!embedId) return '';

    if (!usePlyr && 'vimeo' !== feedType) {
        const {
            ytAutoplay = true,
            ytMute = false,
            ytControls = true,
            ytFullscreen = true,
            ytKeyboard = true,
            ytCaptions = false,
            ytNoCookie = true,
            ytRel = false,
            ytLazy = true
        } = nativeParams;

        const domain = ytNoCookie ? 'youtube-nocookie.com' : 'youtube.com';
        const url = `https://www.${domain}/embed/${embedId}?autoplay=${ytAutoplay ? 1 : 0}&mute=${ytMute ? 1 : 0}&controls=${ytControls ? 1 : 0}&fs=${ytFullscreen ? 1 : 0}&disablekb=${ytKeyboard ? 0 : 1}&cc_load_policy=${ytCaptions ? 1 : 0}&rel=${ytRel ? 1 : 0}`;
        return `<div class="bsbFeedPlyr"><iframe class="bsbFeedPostEmbed" src="${url}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;height:100%;aspect-ratio:16/9;border:0;"${ytLazy ? ' loading="lazy"' : ''}></iframe></div>`;
    }

    // `plyr__video-embed` gives the pane its 16:9 shape before Plyr has finished loading the provider's
    // script — without it the pane is zero-height for as long as that takes.
    return `<div class="bsbFeedPlyr"><div class="plyr__video-embed" data-plyr-provider="${'vimeo' === feedType ? 'vimeo' : 'youtube'}" data-plyr-embed-id="${embedId}"></div></div>`;
};

/** Text going into an HTML attribute that will be parsed as HTML. */
const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // `&apos;` and not `&#39;`, which is the usual choice and is wrong here: the numeric form
    // contains a `#`, and the hashtag pass below would find `#39` inside it and turn the escape
    // for an apostrophe into a link to a tag called "39". Every caption with a `'` in it — which
    // is most of them — came out with `&<a…>#39</a>;` where the apostrophe should be.
    .replace(/'/g, '&apos;');

/**
 * A caption with its hashtags and mentions made into links.
 *
 * Escaped first and linked second, in that order and not the other: linking first would build
 * anchors and then escape their own angle brackets, printing the markup instead of applying it.
 * Line breaks are kept — a caption's shape is part of what was written.
 */
const linkedCaption = caption => esc(caption)
    // `\p{M}` alongside the letters, not as a nicety: Bengali, Hindi, Tamil and the rest write a
    // word with combining marks between its letters, and a class of letters alone stops at the
    // first one. `#বাংলা` came out as a link on `#ব` with `াংলা` left as loose text beside it.
    .replace(/#([\p{L}\p{N}\p{M}_]+)/gu, '<a href="https://www.instagram.com/explore/tags/$1/" target="_blank" rel="noopener noreferrer">#$1</a>')
    .replace(/@([A-Za-z0-9_.]+)/g, '<a href="https://www.instagram.com/$1/" target="_blank" rel="noopener noreferrer">@$1</a>')
    .replace(/\n/g, '<br>');

/**
 * Instagram's own player, standing in for a video Instagram will not hand over.
 *
 * **Why this is needed at all.** Graph answers for some Reels — in practice the ones with licensed
 * audio — with a `thumbnail_url` and no `media_url`, so there is no file to put in a `<video>`. Both
 * halves were measured against a real account through `graph.instagram.com/v21.0`: one Reel in the
 * same twenty came back with `media_url` and played, its neighbour came back without one and could
 * only ever show its still. Nothing in the plugin drops it — `FIELDS` asks for it and Instagram
 * declines.
 *
 * **Why `/embed/` and not the permalink.** The permalink cannot stand in for the file: it answers
 * `x-frame-options: DENY`, which is why framing it shows an empty pane. `/embed/` beside it answers
 * 200 with no `X-Frame-Options` and no `frame-ancestors` in its CSP, so it frames. Both checked
 * against Instagram's own response headers rather than assumed.
 *
 * **Built from a matched shortcode, never by appending to whatever `link` holds.** This becomes the
 * `src` of an iframe on somebody's page, so the address has to be one this function composed out of
 * a permalink it recognised — a feed reader hands over a URL from a service, and a URL from a
 * service is not a URL to trust with a frame.
 */
const IG_PERMALINK = /^https?:\/\/(?:www\.)?instagram\.com\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;

/**
 * The embed address for this slide, or nothing if it should not have one.
 *
 * Off unless the slider asks for it: the embed loads Instagram's own scripts into the page, which is
 * the one thing a site storing its feed locally is trying to avoid. See the toggle in `SocialSlides`.
 *
 * An album is left alone even when it holds a video Instagram withheld. The embed shows the whole
 * post at once, so putting it into the strip beside the album's own pictures would show the same set
 * twice — there the still stands, as it did before.
 */
const feedEmbedUrl = (post, socialQuery) => {
    if ('instagram' !== socialQuery?.feedType || !socialQuery?.instagramEmbedFallback) {
        return '';
    }

    if (Array.isArray(post?.gallery) && post.gallery.filter(item => item?.url).length > 1) {
        return '';
    }

    const match = IG_PERMALINK.exec(String(post?.link || ''));

    // `reels` and `reel` are the same post under two spellings Instagram both hands out; the embed
    // endpoint only answers to the singular.
    return match ? `https://www.instagram.com/${'reels' === match[1] ? 'reel' : match[1]}/${match[2]}/embed/` : '';
};

/**
 * The second address for a popup picture, and the handler that reaches for it.
 *
 * The slide's `<img>` has had this since feeds began — see `onImageError` below — and the popup's had
 * none, so the two disagreed about the same missing file: the slide fell back to the service and the
 * pane went blank beside it. `FeedMedia::localiseGalleries()` keeps the service's address in
 * `fallback` for exactly this, and until now nothing read it.
 *
 * Which matters most for a stored feed, where it is not a remote hiccup but a local one: an
 * attachment keeps its row and its URL after its file has gone from disk — a botched migration, a
 * tidied uploads folder — and the popup would have shown nothing at all for a picture the slide
 * still managed to draw.
 *
 * **The address goes in a `data-` attribute rather than into the handler.** Written inline it would
 * sit inside a JavaScript string literal inside an HTML attribute, and `esc()` turns an apostrophe
 * into `&apos;` — which the HTML parser hands back as a bare `'`, closing that literal early. A URL
 * with an apostrophe in it is rare and the breakage would not be: read from `dataset` there is no
 * literal to close.
 *
 * `this.onerror = null` first, so a fallback that is also gone fails once instead of forever.
 */
const imgFallback = item => {
    const fallback = item?.fallback || '';

    return fallback && fallback !== item?.url
        ? ` data-bsb-fallback="${esc(fallback)}" onerror="this.onerror=null;this.src=this.dataset.bsbFallback"`
        : '';
};

/**
 * Somewhere to send the post, without a script and without a tracker.
 *
 * A `<details>` and not a button with a handler: the pane is inserted as a string of markup, so
 * anything stateful in here would need wiring from outside and something to tear it down again.
 * `<details>` opens and closes itself, answers the keyboard, and closes when the pane is thrown
 * away because it goes with it.
 *
 * The icons are classes, not inline SVG. This markup is carried in a `data-src` attribute on every
 * slide's anchor, so a set of paths in here would be repeated once per slide in the page source —
 * five icons across twenty slides is tens of kilobytes of the same thing. In the stylesheet they
 * are written once. See `.bsbShareBtn` in style.scss.
 *
 * No Facebook or X script is loaded for any of this. These are plain links to each service's own
 * share page, which is what makes a share button that costs a visitor nothing until they use it.
 */
const sharePanel = (post, label) => {
    const url = post?.link || '';

    if (!url) return '';

    const text = String(post?.caption || '').split('\n')[0].trim()
        || (post?.author?.name ? `@${post.author.name}` : '');

    const u = encodeURIComponent(url);
    const t = encodeURIComponent(text);
    const img = encodeURIComponent(post?.thumbnail?.fallback || post?.thumbnail?.url || '');

    const targets = [
        ['facebook', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
        ['x', 'X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
        ['linkedin', 'LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
        ['pinterest', 'Pinterest', `https://pinterest.com/pin/create/button/?url=${u}&media=${img}&description=${t}`],
        ['email', 'Email', `mailto:?subject=${t}&body=${u}`],
    ];

    const links = targets.map(([key, name, href]) =>
        `<a class="bsbShareBtn is-${key}" href="${esc(href)}" target="_blank" rel="noopener noreferrer" title="${esc(name)}" aria-label="${esc(name)}"></a>`
    ).join('');

    return `<details class="bsbFeedPostShare">
        <summary>${esc(label)}</summary>
        <div class="bsbFeedPostShareMenu">
            ${links}
            <button type="button" class="bsbShareClose" aria-label="Close" onclick="this.closest('details').open = false">&times;</button>
        </div>
    </details>`;
};

/**
 * The post itself, as the pane of a lightbox: the picture on one side, what was written on the other.
 *
 * The same `data-html` route the video player uses — see the note above `feedPlayerHtml` for why a
 * string and not a node, and why there is exactly one root element.
 *
 * An album becomes a horizontal scroller with CSS scroll snapping rather than a carousel with
 * buttons. It costs no JavaScript, it swipes on a phone because that is simply what a scrollable
 * strip does there, and there is no state to get out of step with the pane it lives in.
 */
const feedPostHtml = (post, socialQuery, btnLabel) => {
    const gallery = Array.isArray(post?.gallery) && post.gallery.length
        ? post.gallery
        : [{ url: post?.thumbnail?.url || '', isVideo: false, videoUrl: '' }];

    const shown = gallery.filter(item => item?.url);

    /**
     * A lone video starts on its own; one among several waits to be asked.
     *
     * Somebody who clicked a slide with a play badge on it has said what they want, and making
     * them find a second play button inside the pane is asking twice. But an album is a strip of
     * several, and starting every video in it at once is a noise nobody asked for — there the
     * poster stands until one is chosen.
     *
     * Marked for the lightbox rather than carried as an `autoplay` attribute. Fancybox builds the
     * panes either side of the open one in advance, and an `autoplay` fires whenever its element is
     * inserted — so the neighbours started themselves off-screen, and by the time one was navigated
     * second video not playing. The lightbox starts the slide it is showing instead; see
     * `playOnly()` in config.js, which is how the Plyr embeds have always worked.
     */
    const autoplays = shown.length === 1;

    /**
     * The stand-in, for a video with no file behind it. Empty unless the slider asked for one — see
     * `feedEmbedUrl` for what it is and why it is not simply the permalink.
     */
    const embedUrl = feedEmbedUrl(post, socialQuery);

    const isPro = isProActive();
    const autoplayAttr = (autoplays && socialQuery?.igAutoplay !== false) ? 'data-bsb-autoplay="1"' : '';
    const mutedAttr = (socialQuery?.igMute !== false || (autoplays && socialQuery?.igAutoplay !== false)) ? 'muted' : '';
    const loopAttr = (isPro && socialQuery?.igLoop !== false) ? 'loop' : '';
    const controlsAttr = (!isPro || socialQuery?.igControls !== false) ? 'controls' : '';

    const media = shown.map(item => {
        const mediaStyle = 'display: block !important; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; object-fit: contain !important;';
        
        const content = item.isVideo && !item.videoUrl && embedUrl
            ? `<iframe class="bsbFeedPostEmbed" style="${mediaStyle}" src="${esc(embedUrl)}" title="${esc(post?.title || __('Instagram post', 'b-slider'))}" loading="lazy" scrolling="no" frameborder="0" allowfullscreen allow="clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`
            : item.isVideo && item.videoUrl
            ? `<video class="bsbFeedPostVideo" style="${mediaStyle}" ${controlsAttr} playsinline ${autoplayAttr} ${mutedAttr} ${loopAttr} preload="metadata" poster="${esc(item.url)}" src="${esc(item.videoUrl)}" onerror="this.closest('.bsbFeedPost')?.classList.add('has-dead-video')"></video>`
            : `<img class="bsbFeedPostImg" style="${mediaStyle}" src="${esc(item.url)}" alt="${esc(post?.thumbnail?.alt || '')}" loading="lazy"${imgFallback(item)}>`;

        const wrapperStyle = 'flex: 0 0 100% !important; width: 100% !important; max-width: 100% !important; height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; scroll-snap-align: center !important;';
        return `<div class="bsbFeedPostMediaItem" style="${wrapperStyle}">${content}</div>`;
    }).join('');

    if (!media) return '';

    const handle = post?.author?.name || '';
    // The same order the header card resolves in — what was typed on the block first, the account
    // itself after. Before this the pane showed a face only where somebody had filled the header in.
    const avatar = socialQuery?.headerAvatar || socialQuery?.profile?.avatar || '';
    const caption = post?.caption || post?.content || '';

    // `null` means the account is not allowed to report the number — see `InstagramFeed::makeItem()`.
    // A count of nothing is worth printing; a count nobody is permitted to know is not.
    const counts = [
        Number.isFinite(post?.likes) ? `<span class="bsbFeedPostStat">♥ ${esc(post.likes)}</span>` : '',
        Number.isFinite(post?.comments) ? `<span class="bsbFeedPostStat">💬 ${esc(post.comments)}</span>` : ''
    ].join('');

    /**
     * A video that cannot be played here, said out loud.
     *
     * Two ways to arrive at it, and both end the same for a visitor. Instagram withholds the file
     * outright for some posts — a Reel with licensed music comes back with a `thumbnail_url` and no
     * `media_url` at all, which was measured on a real account — and the URLs it does give expire
     * after about a day. The first is known while the markup is built, so the way out is shown from
     * the start; the second only shows itself when the file fails to load, which is what the
     * `onerror` on the video is for.
     *
     * Without this the pane is a still photograph with a play badge on the slide behind it: a
     * promise the post never had the means to keep, and nothing on screen admitting it.
     *
     * `embedUrl` settles the first of the two: with Instagram's own player standing in, the file
     * being withheld is no longer something the visitor has to be told about, so the note stays
     * down. The `onerror` route is untouched — an expired URL is still an expired URL.
     */
    const hasVideo = shown.some(item => item.isVideo);
    const hasEmbed = !!embedUrl && hasVideo && shown.some(item => item.isVideo && !item.videoUrl);
    const unplayable = !hasEmbed && shown.some(item => item.isVideo && !item.videoUrl);

    const deadVideoNote = hasVideo && post?.link
        ? `<a class="bsbFeedPostDead" href="${esc(post.link)}" target="_blank" rel="noopener noreferrer">${esc(__('Watch this video on Instagram', 'b-slider'))}</a>`
        : '';

    const navigationButtons = shown.length > 1
        ? `<button type="button" class="bsbGalleryBtn is-prev" onclick="event.preventDefault(); event.stopPropagation(); const scroller = this.parentNode.querySelector('.bsbFeedPostMediaScroller'); scroller.scrollBy({ left: -scroller.clientWidth, behavior: 'smooth' })" aria-label="Previous image">&lsaquo;</button>
           <button type="button" class="bsbGalleryBtn is-next" onclick="event.preventDefault(); event.stopPropagation(); const scroller = this.parentNode.querySelector('.bsbFeedPostMediaScroller'); scroller.scrollBy({ left: scroller.clientWidth, behavior: 'smooth' })" aria-label="Next image">&rsaquo;</button>`
        : '';

    /**
     * The counter and dot indicators for the album gallery inside the lightbox.
     *
     * A "1/5" counter in the top-right and dots at the bottom, both updated by an
     * IntersectionObserver wired up from the Fancybox `reveal` event in config.js
     * (inline `<script>` tags do not execute when Fancybox sets innerHTML).
     */
    const galleryCounter = shown.length > 1
        ? `<span class="bsbGalleryCounter" data-bsb-total="${shown.length}">1 / ${shown.length}</span>`
        : '';

    const galleryDots = shown.length > 1
        ? `<div class="bsbGalleryDots">
               ${shown.map((_, i) => `<span class="bsbGalleryDot${i === 0 ? ' is-active' : ''}" data-bsb-dot="${i}"></span>`).join('')}
           </div>`
        : '';

    const scrollerStyle = shown.length > 1
        ? 'display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; scroll-snap-type: x mandatory !important; touch-action: pan-x !important; justify-content: flex-start !important; align-items: center !important;'
        : '';

    return `<div class="bsbFeedPost${unplayable ? ' has-dead-video' : ''}">
        <div class="bsbFeedPostMedia${hasEmbed ? ' has-embed' : ''}">
            <div class="bsbFeedPostMediaScroller${shown.length > 1 ? ' is-gallery' : ''}"${shown.length > 1 ? ' data-fancybox-no-drag' : ''} style="${scrollerStyle}">
                ${media}
            </div>
            ${navigationButtons}
            ${galleryCounter}
            ${galleryDots}
            ${deadVideoNote}
        </div>
        <div class="bsbFeedPostSide">
            <div class="bsbFeedPostHead">
                ${avatar ? `<img class="bsbFeedPostAvatar" src="${esc(avatar)}" alt="">` : ''}
                ${handle ? `<span class="bsbFeedPostHandle">@${esc(handle)}</span>` : ''}
            </div>
            ${caption ? `<div class="bsbFeedPostCaption">${linkedCaption(caption)}</div>` : ''}
            <div class="bsbFeedPostMeta">
                ${counts}
                ${post?.date ? `<span class="bsbFeedPostDate">${esc(getLocalizedDate(post, socialQuery))}</span>` : ''}
                ${sharePanel(post, __('Share', 'b-slider'))}
            </div>
            ${post?.link ? `<a class="bsbFeedPostLink" href="${esc(post.link)}" target="_blank" rel="noopener noreferrer">${esc(btnLabel || post?.btnLabel || __('View original', 'b-slider'))}</a>` : ''}
        </div>
    </div>`;
};

const PostItem = (props) => {
    const { attributes, post, index, clientId, isBackEnd = false, isSelected = false, classNames = {} } = props;
    const { isLazyLoad, title, desc, button, image, sourceType, socialQuery, videoConf } = attributes;
    const {
        usePlyr = true,
        ytAutoplay = true,
        ytMute = false,
        ytControls = true,
        ytFullscreen = true,
        ytKeyboard = true,
        ytCaptions = false,
        ytNoCookie = true,
        ytRel = false,
        ytLazy = true,
        showLikesComments = false
    } = socialQuery || {};
    const { tag = "h5" } = title;

    const { thumbnail } = post || {};
    // Older blocks have no `isVisible` key, so only an explicit `false` hides any of the three.
    const btnLabel = button?.isVisible !== false ? resolveButtonText(post, attributes, button?.text) : '';

    /**
     * Whether this slide plays where it stands.
     *
     * Only a feed slide has anywhere to play from — `videoId` is set by `YouTubeFeed::makeItem()` and
     * by nothing else, so a post or a product slide can never take this branch however the setting is
     * left. `link` sends the visitor to YouTube, which is what every feed slider did before.
     *
     * The default reads from the destructure and not only from `block.json`: WordPress fills an object
     * attribute's default in only when the whole object is missing, and a slider saved before this
     * existed has a `socialQuery` that simply has no `playVideo` in it.
     */
    /**
     * Whether this slide holds something that plays.
     *
     * Three readers answer it three ways: YouTube fills in `videoId`, Instagram says `VIDEO` in
     * `mediaType` and carries the file in `videoUrl`, and an album may hold a video among its
     * pictures. Asked once here so the badge and the pane cannot disagree about it.
     */
    const videoParts = Array.isArray(post?.gallery) ? post.gallery.filter(item => item?.isVideo) : [];

    const isPlayable = !!post?.videoId
        || 'VIDEO' === post?.mediaType
        || !!post?.videoUrl
        || videoParts.length > 0;

    /**
     * Whether the badge is telling the truth.
     *
     * "This plays" and "there is a file to play" are two different claims, and only the first was
     * ever being made. Instagram declines to give `media_url` for some Reels — measured against a
     * real account, one of two Reels in the same twenty — so a slide could carry a play triangle over
     * a post whose video the popup has no means of starting. Pressed, it opened on the still, and
     * nothing about the badge had admitted that was all it could ever do.
     *
     * `feedEmbedUrl` puts it back where the slider has asked for the stand-in player: with something
     * that plays behind it the triangle is honest again. Without it the badge says what is actually
     * on offer — the post, on Instagram — rather than promising playback the page cannot deliver.
     */
    const hasVideoFile = !!post?.videoId || !!post?.videoUrl || videoParts.some(item => !!item?.videoUrl);

    const playsHere = hasVideoFile || !!feedEmbedUrl(post, socialQuery);

    const sourceIcon = 'social' === sourceType && socialQuery?.showSourceIcon !== false && (
        <span className={`bsb-social-source-icon bsb-source-${socialQuery?.feedType}`}>
            {socialQuery?.feedType === 'instagram' ? instagram : (socialQuery?.feedType === 'youtube' || socialQuery?.feedType === 'youtube_video' ? play : externalLink)}
        </span>
    );

    /**
     * The muted preview that plays where the slide stands, when the cursor rests on it.
     *
     * Feeds only — it is a feed's video that has somewhere to play from, and `hoverPreviewOf` returns
     * nothing for a slide with neither a file nor a `videoId` however the setting is left, so a photo
     * post and an RSS item are untouched. Independent of what a click does: previewing under the
     * cursor and sending the visitor to YouTube on click are two separate answers, and a slider is
     * allowed to give both.
     */
    const previewOffered = 'social' === sourceType ? hoverPreviewOf(post, socialQuery, videoConf) : null;

    /**
     * Whether a preview can run *here*, which is not the same as the slider having asked for one.
     *
     * An embed cannot play in the editor canvas — WordPress builds it as a `blob:` document and YouTube
     * refuses to play without a referrer, see `mayFrameEmbed`. A video file has no such trouble and
     * previews in both places.
     *
     * Asked at this level, and not left to the runtime check alone, because the answer decides what the
     * slide *looks* like as well as what it does: the play badge comes off a slide that reveals its
     * video under the cursor, and it must stay on one that cannot.
     */
    const preview = previewOffered && ('video' === previewOffered.kind || !isBackEnd)
        ? previewOffered
        : null;

    const hover = useHoverPreview(preview);

    /**
     * Whether a click docks the video in a corner instead of opening a pane over the page.
     *
     * **Only where there is something to play.** The dock holds a player and nothing else, so a photo
     * post has nothing to put in it — and a slider switched from a YouTube channel to an RSS feed keeps
     * whatever `playVideo` was left at. Those slides fall through to the popup below and open as the
     * post, which is the nearest honest thing a click can do for them.
     */
    const isMini = 'social' === sourceType
        && 'mini' === (socialQuery?.playVideo || 'popup')
        && hasVideoFile;

    /**
     * Everything the dock needs about this slide, gathered when it is asked for.
     *
     * A function and not a value, because it is only ever read inside a handler — building it on every
     * render would be work done for every slide of every slider on the chance one of them is clicked.
     *
     * `resolveTitle` rather than `post.title`, so the dock names the video the same way the slide does:
     * an ACF override, the Title Length setting, all of it already decided in one place.
     */
    const miniItem = () => ({
        videoId: post?.videoId || '',
        videoUrl: post?.videoUrl
            || (Array.isArray(post?.gallery) ? post.gallery.find(item => item?.isVideo && item?.videoUrl)?.videoUrl : '')
            || '',
        title: stripTags(resolveTitle(post, attributes)),
        link: post?.link || '',
        poster: post?.thumbnail?.url || '',
        feedType: socialQuery?.feedType || '',
        position: socialQuery?.miniPosition || 'bottom-right'
    });

    /**
     * The stage takes the click, so nothing here should.
     *
     * Set by the Thumbnails layout's own player — a thumbnail hands its video to the player above
     * rather than opening anything. Without this the slide would do both: the grid would move the
     * stage *and* a popup would open over it.
     *
     * Only where there is a stage to hand it to. `stage` can outlive the layout it was chosen for —
     * a slider switched from Thumbnails to Grid keeps the setting — and on any other layout it would
     * mean a click that does nothing at all, so those fall back to the popup below.
     */
    const isStagePlay = 'social' === sourceType
        && 'stage' === socialQuery?.playVideo
        && 'thumbnails' === attributes?.layoutType;

    const isFeedPopup = 'social' === sourceType
        && 'link' !== (socialQuery?.playVideo || 'popup')
        && !isStagePlay
        && !isMini
        && !!post?.link
        // A video plays; anything else with a picture opens as the post itself. This used to
        // require `videoId`, which only `YouTubeFeed` ever sets — so an Instagram or RSS slide
        // could never open a popup however the setting was left, because the one thing that
        // decided it was a field its reader had no reason to fill in.
        && ( !!post?.videoId || !!post?.thumbnail?.url );

    /**
     * What the pane holds: a player for a video, the post itself for everything else.
     *
     * Both go through `data-html`, so from Fancybox's side there is one mechanism and two fillings.
     */
    const playerHtml = ! isFeedPopup
        ? ''
        : ( post?.videoId
            ? feedPlayerHtml(post, socialQuery?.feedType, usePlyr, {
                ytAutoplay,
                ytMute,
                ytControls,
                ytFullscreen,
                ytKeyboard,
                ytCaptions,
                ytNoCookie,
                ytRel,
                ytLazy
            })
            : feedPostHtml(post, socialQuery, btnLabel) );

    /**
     * Whether the block was already selected when this interaction began.
     *
     * A ref and not state: it is read once, in a handler, and nothing on screen depends on it — as state
     * it would re-render every slide of the slider on every mousedown for no visible difference.
     */
    const wasSelected = useRef(false);

    /** The play trigger, so the editor can listen on it directly — see the effect below. */
    const playRef = useRef(null);

    /**
     * Opening the popup in the editor, and deciding whether this click is the popup's at all.
     *
     * **Why the editor opens it itself.** Fancybox opens from a delegated listener and gives up the
     * moment something has already called `preventDefault` on the event; in the editor canvas a click on
     * a slide is also how the block gets selected, so the popup could not be relied on to open there
     * while the identical markup worked on the front end. `bsb_open_popup` does what the delegated
     * handler would have done. Only bound in the editor: on the front end Fancybox is listening, and
     * doing both would open two.
     *
     * **The first click on the slider is not the popup's to take.** While the block is unselected, that
     * click is how the editor selects it — so it is left alone, and the popup opens on a click after
     * that. Taking it would mean a slider you cannot get the toolbar or the sidebar for by clicking it,
     * which is how every other block in the editor is selected. Nothing is lost by passing: the editor
     * suppresses a link's navigation in the canvas either way, so no visitor is sent to YouTube by a
     * click that only selected a block.
     *
     * **Passing means preventing, not just returning.** `Fancybox.bind` listens on the slide area — an
     * ancestor of this trigger — so on the way up the delegated handler runs and, finding a click nobody
     * prevented, opens the popup. That is the first click opening a popup even though this handler
     * declined it. `preventDefault` is what the delegated handler reads, so declining has to say so on
     * the event; the click still bubbles, so the editor goes on to select the block.
     *
     * **Which is also why these are native listeners and not React props.** React dispatches from the
     * canvas root, above the slide area, so a React handler runs *after* the delegated one and anything
     * it prevents is already too late. A listener on the trigger itself runs at the target, before every
     * ancestor.
     *
     * **And why the answer is recorded on mousedown rather than read here.** Selecting a block happens
     * on mousedown and focus, both of which are over before a click event exists — so by the time this
     * runs `isSelected` is already `true`. `wasSelected` is that prop as it stood when the interaction
     * began.
     *
     * `stopPropagation` once the click is ours, so it does not go on to be read as "select this block"
     * after we have taken it to mean "play this video" — and so the delegated handler does not open a
     * second lightbox over the one being opened here.
     *
     * No container is passed to the opener, and it does not need one: the group is named after this
     * block's own `clientId`, so searching the whole document for it finds this slider's slides and
     * nothing else. The document to search — and to open in — is taken from the trigger, which is the
     * only thing here that knows whether it is in the editor's iframe.
     */
    useEffect(() => {
        const trigger = playRef.current;

        if (!isBackEnd || !(isFeedPopup || isMini) || !trigger) {
            return;
        }

        const onPlayDown = () => { wasSelected.current = isSelected; };

        const onPlayClick = event => {
            // A click raised from the keyboard has no mousedown behind it — `detail` is 0 for those —
            // and reaching a link with the keyboard means the block is already selected and focused, so
            // there the prop is the honest answer.
            if (!(0 === event.detail ? isSelected : wasSelected.current)) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            // The dock and the pane are two answers to the same click, and the editor reaches both the
            // same way — which is the point of doing this here rather than in a second effect.
            if (isMini) {
                openMiniPlayer(attributes, miniItem(), trigger);
                return;
            }

            bsb_open_popup(clientId, attributes, trigger);
        };

        trigger.addEventListener('mousedown', onPlayDown);
        trigger.addEventListener('click', onPlayClick);

        return () => {
            trigger.removeEventListener('mousedown', onPlayDown);
            trigger.removeEventListener('click', onPlayClick);
        };
        // `post?.videoId` is in here for the trigger itself rather than for anything read above: a feed
        // that refetches can hand this slot a different video, and rebinding costs nothing next to the
        // chance of listeners left on an element React has replaced.
    }, [isBackEnd, isFeedPopup, isMini, isSelected, clientId, attributes, post?.videoId]);

    const showTitle = title?.isVisible !== false;
    const showDesc = desc?.isVisible !== false;
    const placeholderUrl = 'social' === sourceType ? socialQuery?.defaultImageUrl : '';
    const finalThumbnail = (thumbnail && thumbnail.url) ? thumbnail : (placeholderUrl ? { url: placeholderUrl, fallback: placeholderUrl, alt: post?.title || '' } : thumbnail);
    const slideImg = resolveSlideImage(post, attributes, finalThumbnail);
    const btnLink = resolveButtonLink(post, attributes);
    const postTitle = resolveTitle(post, attributes);

    /**
     * Swap in a second image if the first one is not there.
     *
     * A feed can only name a thumbnail it expects to exist — YouTube generates the widescreen frame
     * only for a video that got an HD render, so the chosen quality 404s for some of them. The feed
     * carries the file it named itself as `fallback`, and this is where that gets used. Nothing else
     * sets the key, so for every other source the handler never has anything to do.
     *
     * `srcset` has to go before `src` is touched, and that is the whole reason this was not working.
     * When an element has a `srcset` the browser picks from it and `src` is not consulted, so setting
     * `src` alone left the broken candidate selected and the swap changed nothing — the slide stayed
     * empty. A feed image always carries a `srcset`, so this was every video with no HD render.
     */
    const onImageError = event => {
        const { fallback } = slideImg || {};

        if (!fallback || event.target.src === fallback) {
            return;
        }

        // Removed rather than blanked: an empty `srcset` is still a `srcset`, and `sizes` without one
        // is meaningless.
        event.target.removeAttribute('srcset');
        event.target.removeAttribute('sizes');
        event.target.src = fallback;
    };

    /**
     * Everything the browser needs to fetch this picture well.
     *
     * `alt` was missing entirely, which left every post and feed slide unreadable to a screen reader
     * and unindexable as an image. The rest only appear when the source supplies them — a feed does,
     * because its pictures either come with known sizes (a stored attachment) or come from a service
     * that publishes the same frame at several widths.
     *
     * The first slide is the one the page is measured on: it loads eagerly and at high priority,
     * because it is almost always the Largest Contentful Paint. The rest wait until they are near.
     */
    const imgProps = {
        alt: slideImg?.alt || stripTags(postTitle) || '',
        onError: onImageError,
        decoding: 'async',
        ...(0 === index
            ? { loading: 'eager', fetchpriority: 'high' }
            : { loading: 'lazy' }),
        // Given together or not at all — a width without a height reserves nothing, so the page
        // still reflows as the image arrives.
        ...(slideImg?.width && slideImg?.height
            ? { width: slideImg.width, height: slideImg.height }
            : {})
    };

    // Optional chaining, because this is built before the `slideImg?.url` guard below rather than
    // inside it: a post with no featured image reaches here with `slideImg` undefined, and reading
    // `.url` off it would take the whole slider down with a TypeError.
    const isLazy = isLazyLoad && !isBackEnd;

    const picture = isLazy
        ? <img
            {...imgProps}
            data-src={slideImg?.url}
            data-srcset={slideImg?.srcset}
            data-sizes={slideImg?.srcset ? (slideImg?.sizes || '100vw') : undefined}
            className="d-block w-100 lazyload"
          />
        : <img
            {...imgProps}
            src={slideImg?.url}
            srcSet={slideImg?.srcset}
            sizes={slideImg?.srcset ? (slideImg?.sizes || '100vw') : undefined}
            className="d-block w-100 "
          />;

    const { linkTarget = '' } = socialQuery || {};

    /**
     * The whole picture as the link — one behaviour, asked for under two different names.
     *
     * **Why it was worth having.** The button was the only clickable thing on a slide, so a slider
     * with the button turned off was a page of pictures that did nothing when pressed. The caption
     * cannot stand in for it either: `.content-area` is `pointer-events: none` so the arrows
     * underneath stay reachable, and only the anchors inside it are given the clicks back.
     *
     * **A post or product slider links its picture always**, and takes `btnLink` rather than
     * `post.link`. The two are the same thing until an ACF Button Link field is assigned, and the
     * picture and the button leading to different places would be a slide arguing with itself.
     *
     * **A feed has been asking through `What it does` all along — and was not being answered.** With
     * that set to "Opens the original in a new tab" (or "Opens the video on YouTube") the slide took
     * neither the popup branch nor the dock branch, and fell through to a bare `<img>`: a setting
     * whose own help text says the visitor leaves the page for the original, on a picture that was
     * not a link at all. The only way out was the small button in the corner on hover. So this is
     * the same fix as the post slider's, arriving at a setting that already existed.
     *
     * **And the two cannot both claim the click**, which is why the picture is linked only away from
     * feeds: on a feed the answer belongs to `What it does`, and a post slider's habit of linking its
     * picture must not overrule it.
     */
    const isFeedLink = 'social' === sourceType && 'link' === (socialQuery?.playVideo || 'popup');

    /**
     * **A post or product slide always links, and no longer asks.** `image.link` used to gate this with a
     * "Nothing" option that only ever produced a picture which looks clickable and is not — see the note
     * in `General`, where the choice was removed. The attribute is left in `block.json` so an old slider
     * still validates; nothing reads it any more, which is what makes every one of them clickable
     * whatever they were saved with.
     */
    const imageHref = 'social' === sourceType
        ? (isFeedLink ? (post?.link || '') : '')
        : (btnLink || '');

    /**
     * Which "new tab" setting applies, since the two sources keep it in different places.
     *
     * A feed's is `Open links in a new tab`, the same one its button already follows — so the two
     * ways out of a feed slide open the same way. A post slider's belongs to the picture setting
     * itself, because its button has no such toggle to share.
     */
    const imageLinkTarget = 'social' === sourceType ? linkTarget : image?.linkTarget;

    /**
     * The blurred backdrop behind a feed slide's picture — the `blur` Image Fit.
     *
     * With that fit the picture is `contain`ed, so it is drawn whole and leaves the rest of the slide
     * empty. This fills that emptiness with the picture itself: the same file again, covering the
     * slide, enlarged and blurred out. All of the appearance is in `Style.js`; this is only the
     * element to hang it on.
     *
     * **The same props as the picture, deliberately.** Same `src`, same `srcset`, same `sizes`, same
     * loading — so the browser resolves the two to one candidate and fetches it once. A `background-
     * image` would have been less markup and a second download: a CSS URL cannot be a `srcset`, so on
     * a narrow slide the picture takes `mqdefault` and the backdrop would take the 1280px frame.
     *
     * `alt=''` and `aria-hidden`, because it says nothing the picture in front does not already say.
     *
     * Only for a feed. A post or an image slider fills its slide by cropping, so there is never a gap
     * behind the picture for this to show through.
     */
    const blurBackdrop = 'social' === sourceType
        && 'blur' === (socialQuery?.imageFit || 'blur')
        && slideImg?.url
        ? (isLazy
            ? <img
                {...imgProps}
                alt=''
                aria-hidden='true'
                data-src={slideImg.url}
                data-srcset={slideImg.srcset}
                data-sizes={slideImg.srcset ? (slideImg.sizes || '100vw') : undefined}
                className='bsb-feed-blur lazyload'
              />
            : <img
                {...imgProps}
                alt=''
                aria-hidden='true'
                src={slideImg.url}
                srcSet={slideImg.srcset}
                sizes={slideImg.srcset ? (slideImg.sizes || '100vw') : undefined}
                className='bsb-feed-blur'
              />)
        : null;

    /**
     * The badge, named once because two branches draw it.
     *
     * A play badge means "this plays" — so it goes on anything that does, and on nothing that does not.
     * `videoId` alone was the wrong question: only `YouTubeFeed` sets it, so an Instagram Reel is as
     * much a video as a YouTube one and was getting no badge at all. A photo still gets none.
     *
     * And a video with no file behind it gets a different one — see `playsHere`. The service's own mark
     * where there is one to use, a link glyph otherwise: both say "this leads somewhere" instead of
     * "this starts here", which is the only promise the pane can keep for it.
     */
    const playBadge = isPlayable && ('social' !== sourceType || socialQuery?.showPlayIcon !== false) && (
        <span className={`bsbFeedPlayIcon ${playsHere ? '' : 'is-external'}`}>
            {play}
        </span>
    );



    /**
     * The buttons that appear on the thumbnail while the cursor is on it.
     *
     * The pattern YouTube's own grid uses: the picture itself does whatever the slider is set to do, and
     * a small stack of actions in the corner offers the things that are *not* that. Here the first of
     * them is the one that was asked for — send this video to the corner player and carry on reading the
     * page — and the second is the way to the original.
     *
     * **Why the dock is reachable from here whatever "What it does" is set to.** The two are different
     * questions: that setting decides a click on the picture, and this is a button that says what it
     * does on its own. A visitor who wants the corner player should not need the slider to have been
     * configured for it.
     *
     * Shown by the stylesheet on hover and on `focus-within`, and only where a pointer can hover — see
     * `.bsbSlideActions`. Not rendered at all where there is nothing to send: an RSS item with no video
     * keeps just its link.
     */
    const hoverActions = 'social' === sourceType
        // `!== false`, so a slider saved before the toggle existed keeps the buttons it has had — see the
        // note on `showHoverActions` in SocialSlides.
        && false !== socialQuery?.hoverActions
        && isProActive()
        && (hasVideoFile || post?.link) && <div
            /* Shown by our own hover state and not by `.item:hover` — see `hovered` in useHoverPreview
               for the arrows that made the difference. */
            className={`bsbSlideActions ${hover.hovered ? 'is-shown' : ''}`}
            {...hover.keepHandlers}
        >
        {hasVideoFile && <button
            type='button'
            className='bsbSlideAction is-mini'
            aria-label={__('Play in the corner player', 'b-slider')}
            title={__('Play in the corner player', 'b-slider')}
            /* The picture's own click is not this one. `preventDefault` because a delegated Fancybox
               listener on an ancestor reads it, and `stopPropagation` so the editor does not take this
               as "select the block". The `mousedown` is deliberately left to bubble: the picture box
               stops the hover preview on it, which is exactly what should happen as the video docks. */
            onClick={event => {
                event.preventDefault();
                event.stopPropagation();

                openMiniPlayer(attributes, miniItem(), event.currentTarget);
            }}
        >
            {miniPlayerIcon}
        </button>}

        {post?.link && <a
            className='bsbSlideAction is-link'
            href={post.link}
            target='_blank'
            rel='noopener noreferrer'
            aria-label={__('Open the original', 'b-slider')}
            title={__('Open the original', 'b-slider')}
            onClick={event => event.stopPropagation()}
        >
            {externalLink}
        </a>}
    </div>;

    /**
     * The slide's own classes, and the two that must never be among them.
     *
     * **`is-previewing` and `has-hover-preview` live on `.img` instead, and this is not tidiness.** In the
     * default layout this element is also Bootstrap's `.carousel-item`, and Bootstrap slides by adding
     * and removing `active` on these at runtime. React does not know about those: it writes the whole
     * `className` string from its own render whenever its value changes — so a class that flips on hover
     * made React rewrite the attribute and wipe the `active` Bootstrap had just moved here. The carousel
     * was left with no active slide at all: the picture vanished and every arrow click after that did
     * nothing, because there was nothing for it to slide from.
     *
     * Measured: hover a video slide, press the arrow, and the index of the active `.item` went to -1 and
     * stayed there. Before the hover preview existed, nothing re-rendered a slide while it was on screen,
     * so nothing ever rewrote the attribute — which is why this arrived with the preview.
     *
     * What is left here is fixed for the life of the slide, so React computes the same string every
     * render and never touches the DOM attribute again. `.img` is ours alone, and carries the rest.
     */
    const wrapperClass = `item ${index === 0 ? 'active' : ''} ${isFeedPopup || isMini ? 'is-playable' : ''} ${imageHref ? 'is-linked' : ''} ${classNames.item || ''}`;

    return <div className={wrapperClass}>
        {/* Overlay anchor — only when there is a link but no image to carry it. The picture anchor
            handles the image case; this one handles the no-image case so the whole slide is still
            reachable without a visible image. Hidden from assistive technology because the button
            below already names the destination. */}
        {imageHref && !slideImg?.url && <SlideLink
            className='bsbSlideOverlay'
            href={imageHref}
            linkTarget={imageLinkTarget}
            rel={'_blank' === imageLinkTarget ? 'noopener noreferrer' : undefined}
            isBackEnd={isBackEnd}
            isSelected={isSelected}
            aria-hidden='true'
            tabIndex='-1'
        />}
        {/* The anchor goes *inside* `.img` rather than around it. Fancybox needs a link to bind to, but
            the slide picture is sized by `.item > .img img` — a wrapper between the two would take the
            picture out of that rule's reach and it would stop filling the slide. Inside, the rule still
            matches and Fancybox still has its trigger.

            The front end leaves the click to Fancybox's own delegated handler, which is why there is no
            `stopPropagation` for it: the handler listens on an ancestor, so a click stopped here would
            never reach it. In the editor that handler is the one thing that cannot be relied on — see
            `onPlayClick` — and there the click is ours to stop. */}
        {/* The hover handlers sit on the picture box and not on the anchor inside it, because the
            anchor is not always there: "Opens the original in a new tab" leaves the picture unwrapped,
            and a preview that only worked in popup mode would be a setting that silently does nothing
            for half of them. Hovering the caption laid over the slide counts as hovering this, which
            is what `mouseenter` on an ancestor means — and is what somebody reading the title of a
            video expects. */}
        <div
            className={`img ${preview ? 'has-hover-preview' : ''} ${hover.active ? 'is-previewing' : ''}`}
            ref={hover.hostRef}
            {...hover.handlers}
        >
            {sourceIcon}
            {blurBackdrop}
            {/* Over the picture, under the play badge — see `.bsbHoverPreview`. Rendered only while
                the hover is live, which is what keeps a slide nobody rests on free of charge. */}
            {hover.active && <HoverPreview
                preview={preview}
                imageFit={socialQuery?.imageFit || 'blur'}
                label={stripTags(postTitle) || __('Video preview', 'b-slider')}
                mediaRef={hover.mediaRef}
                sound={hover.sound}
            />}
            {slideImg?.url && (isMini
                /**
                 * The dock's trigger: a plain link, with no `data-fancybox` on it at all.
                 *
                 * That absence is the mechanism. `bsb_lightbox_config` binds Fancybox by that attribute,
                 * so a slide without it is invisible to the lightbox — which is exactly right here,
                 * because otherwise a click would open a pane *and* dock a player, two of the same video
                 * playing over each other.
                 *
                 * `href` stays the video's own page: it is what a visitor with no JavaScript follows, and
                 * what a middle-click or "open in new tab" is for. The handler takes the ordinary click
                 * and turns it into the dock.
                 *
                 * Bound as a React prop, and only on the front end. In the editor the same click is also
                 * how the block gets selected, so there it is a native listener on this element that
                 * decides whose click it is — see the effect above, which handles both modes. Doing both
                 * would dock the video twice.
                 */
                ? <a
                    ref={playRef}
                    className='bsbFeedPlay'
                    href={post?.link || '#'}
                    aria-label={stripTags(postTitle) || post?.link || ''}
                    {...(isBackEnd ? {} : {
                        onClick: event => {
                            event.preventDefault();
                            event.stopPropagation();

                            openMiniPlayer(attributes, miniItem(), event.currentTarget);
                        }
                    })}
                >
                    {picture}
                    {playBadge}
                </a>
                : isFeedPopup
                /* `data-html` is the player, and it is what decides the pane: handed only a URL Fancybox
                   builds its own iframe and YouTube's player appears — a different look from the video
                   source's popup, and deaf to every control setting the panel offers. `href` stays the
                   video's own page, which is what a visitor with no JavaScript follows and what the
                   Thumbs plugin reads. */
                ? <a
                    ref={playRef}
                    className='bsbFeedPlay'
                    data-fancybox={`${clientId}-video-gallery`}
                    data-html={playerHtml}
                    /**
                     * How the pane is actually told what to show.
                     *
                     * Fancybox works out a slide's type from the URL first — a YouTube or Vimeo
                     * address wins outright — and only then looks at `data-type`. Content comes
                     * from `src`, and `data-src` beats `href`. For a `html` slide the `src` *is*
                     * the markup, which is why it is handed over that way here.
                     *
                     * This is what was missing. `data-html` is copied onto the slide object along
                     * with the rest of the dataset, but nothing renders from it: an Instagram
                     * permalink is neither YouTube nor Vimeo, so the pane fell through to `iframe`
                     * — and Instagram refuses to be framed, so the popup opened empty. The play
                     * badge was right, the click was right, and the pane was a blocked iframe.
                     *
                     * Only for the post pane. A YouTube slide keeps the URL-detected route it has
                     * always used, untouched.
                     */
                    {...(post?.videoId ? {} : { 'data-type': 'html', 'data-src': playerHtml })}
                    data-caption=''
                    href={post.link}
                    aria-label={stripTags(postTitle) || post.link}
                >
                    {picture}
                    {playBadge}
                </a>
                /**
                 * The picture, wrapped in a link only where the slider asked for one — with an empty
                 * `href` this renders the bare `<img>` and nothing else, which is what every post
                 * slide was before the setting existed. See `LinkedPicture`.
                 *
                 * The label is left empty where `imgProps.alt` holds the title, because an image
                 * inside a link is already what names that link.
                 */
                : <LinkedPicture
                    href={imageHref}
                    linkTarget={imageLinkTarget}
                    label={imgProps.alt ? '' : (stripTags(postTitle) || imageHref)}
                    isBackEnd={isBackEnd}
                    isSelected={isSelected}
                >
                    {picture}
                </LinkedPicture>)}

        </div>

        {/**
          * The controls, outside the picture box on purpose.
          *
          * They used to sit inside `.img`, where the arrows took every click meant for them: the arrows
          * are two invisible full-height blocks laid over the sides of the slide, and `Style.js` gives
          * `.img` a `z-index` for the blurred backdrop — which makes it a stacking context, so nothing
          * inside it can be lifted above them. Pressing the speaker slid the carousel instead of turning
          * the sound on. Out here they are the arrows' equals, and the stylesheet puts them above.
          *
          * `keepHandlers` because the cursor is now outside the hovered box while it is on them — see
          * `GRACE` in HoverPreview for the ground the pointer has to cross to arrive.
          */}
        {hoverActions}

        {hover.active && <SoundButton
            sound={hover.sound}
            onToggle={hover.toggleSound}
            {...hover.keepHandlers}
        />}

        {(() => {
            const finalExcerpt = (post && showDesc) ? resolveExcerpt(post, attributes, ((!(attributes?.postsQuery?.isExcerptFromContent) || sourceType === 'social') && post?.excerpt) ? post.excerpt : (post?.content || post?.excerpt)) : '';
            const hasStats = 'social' === sourceType && showLikesComments && (Number.isFinite(post?.likes) || Number.isFinite(post?.comments));
            const hasTitle = showTitle && postTitle;
            const hasExcerpt = showDesc && finalExcerpt;
            const hasBtn = !!btnLabel;
            const hasContentArea = hasStats || hasTitle || hasExcerpt || hasBtn;

            return hasContentArea && (
                <div className={classNames.contentArea || 'content-area'}>
                    <div className={`captionContent ${classNames.captionContent || ''}`}>
                        {'social' === sourceType && showLikesComments && (Number.isFinite(post?.likes) || Number.isFinite(post?.comments)) && (
                            <div className="bsb-social-post-stats">
                                {Number.isFinite(post?.likes) && (
                                    <span className="bsb-stat-item bsb-stat-likes">
                                        {heartIcon}
                                        <span className="bsb-stat-count">{post.likes}</span>
                                    </span>
                                )}
                                {Number.isFinite(post?.comments) && (
                                    <span className="bsb-stat-item bsb-stat-comments">
                                        {commentIcon}
                                        <span className="bsb-stat-count">{post.comments}</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {showTitle && postTitle && createElement(tag, {
                            className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: postTitle }
                        }, null)}

                        {showDesc && <Excerpt attributes={attributes} classNames={classNames} post={post} />}

                        {btnLabel && <>
                            <div className={`carousel-button ${classNames.btn || ''}`}>
                                <SlideLink href={btnLink} linkTarget={imageLinkTarget} isBackEnd={isBackEnd} isSelected={isSelected} dangerouslySetInnerHTML={{ __html: btnLabel }} />
                            </div>
                        </>}
                    </div>
                </div>
            );
        })()}

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={post} attributes={attributes} classNames={classNames} isBackEnd={isBackEnd} isSelected={isSelected} />
    </div>
}
export default PostItem;

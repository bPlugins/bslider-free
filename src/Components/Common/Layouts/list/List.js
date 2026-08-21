import { useEffect, useMemo, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { plyrConfig, finishPlyr } from '../../../../utils/config';
import { openMiniPlayer } from '../../../../utils/miniPlayer';
import { getLocalizedDate } from '../../../../utils/functions';
import ListRow from './ListRow';

/**
 * The List layout: one video playing above, the rest of the channel waiting below.
 *
 * **Only ever drawn for a YouTube channel feed**, and the two pickers only offer it there — see
 * `layoutItem` and `selectLayoutOpt`, and the fallback in `Layout` that catches a slider whose feed was
 * changed out from under a layout it no longer fits. Every other source keeps the four it always had.
 *
 * **One player for the whole list, built on the first press and never rebuilt.** Choosing another video
 * hands the same Plyr instance a new `source`, which is what makes moving through a channel feel like a
 * playlist instead of a page reload — the same trick the corner player uses, measured there. Nothing is
 * loaded from YouTube until somebody presses play: until then the stage is the thumbnail the feed
 * already gave us.
 */
const List = ({ attributes, firstPosts, commonDeProps }) => {
    const { clientId, isBackEnd = false } = commonDeProps || {};
    const { listLayout = {}, socialQuery = {}, isLazyLoad } = attributes;
    const isLazy = isLazyLoad && !isBackEnd;

    const {
        rows = 4,
        autoplayNext = true,
        loopList = false,
        showFilter = true,
        showStageMeta = true,
        rememberProgress = true,
        stickyStage = false,
        listPosition = 'below'
    } = listLayout;

    /** Only items that can actually be played here — a channel feed is videos, but be sure of it. */
    const items = useMemo(
        () => (Array.isArray(firstPosts) ? firstPosts.filter(post => post?.videoId) : []),
        [firstPosts]
    );

    const [query, setQuery] = useState('');
    const [activeId, setActiveId] = useState('');
    const [started, setStarted] = useState(false);

    /**
     * What the list shows, which is not always what it holds.
     *
     * The filter is done here rather than by asking the server again: the whole channel is already in
     * the page, so typing is instant and costs nothing. Matching is case-folded and accent-blind enough
     * for a title in any of the scripts a channel might publish in — `localeCompare` is not used because
     * this is a substring test, not an ordering.
     */
    const shown = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return items;
        }

        return items.filter(post => String(post?.title || '').toLowerCase().includes(q));
    }, [items, query]);

    /** The video on the stage: whatever was chosen, or the first the list can offer. */
    const active = useMemo(
        () => items.find(post => post.videoId === activeId) || items[0] || null,
        [items, activeId]
    );

    /**
     * What has been watched, and how far.
     *
     * Kept in `localStorage` under this slider's own key, so a visitor who comes back to the page finds
     * the rows they have seen marked and the one they left half-finished ready to carry on. Per slider
     * rather than per site: two sliders on one page are two lists, and one channel's progress has no
     * business appearing under another's.
     *
     * A missing or unreadable store is not an error — Safari's private mode throws on `localStorage`
     * outright — so it degrades to "nothing watched yet" and the feature simply is not there.
     */
    const storeKey = `bsbList-${clientId}`;
    const [progress, setProgress] = useState({});

    useEffect(() => {
        if (!rememberProgress) {
            return;
        }

        try {
            const raw = window.localStorage.getItem(storeKey);
            setProgress(raw ? JSON.parse(raw) || {} : {});
        } catch (e) {
            // No store to read. The list works without one.
        }
    }, [storeKey, rememberProgress]);

    /** Written through a ref as well as state: the player's handlers need it without re-subscribing. */
    const progressRef = useRef({});
    progressRef.current = progress;

    const remember = (id, seconds, duration) => {
        if (!rememberProgress || !id || !duration) {
            return;
        }

        const next = { ...progressRef.current, [id]: { at: Math.round(seconds), of: Math.round(duration) } };

        progressRef.current = next;
        setProgress(next);

        try {
            window.localStorage.setItem(storeKey, JSON.stringify(next));
        } catch (e) {
            // Out of quota, or a store that refuses to be written. Nothing here depends on it.
        }
    };

    const stageRef = useRef(null);
    const mediaRef = useRef(null);
    const playerRef = useRef(null);
    const listRef = useRef(null);

    /** The order the "next" video is taken from — what the visitor can see, not the whole channel. */
    const orderRef = useRef([]);
    orderRef.current = shown.length ? shown : items;

    const activeRef = useRef('');
    activeRef.current = active?.videoId || '';

    const autoNextRef = useRef({ autoplayNext, loopList });
    autoNextRef.current = { autoplayNext, loopList };

    /**
     * Move to the video after this one.
     *
     * Held in a ref so the player's `ended` handler — bound once, when the player is built — always
     * reaches the current list rather than the one that existed at the time.
     */
    const advance = useRef(() => { });

    advance.current = () => {
        const order = orderRef.current;
        const at = order.findIndex(post => post.videoId === activeRef.current);
        const next = order[at + 1] || (autoNextRef.current.loopList ? order[0] : null);

        if (next) {
            setActiveId(next.videoId);
        }
    };

    /**
     * Give the player a video — the only route to the stage, and there are two callers.
     *
     * **The first press used to play nothing, and this is why.** Building the player and telling it what
     * to play were two separate effects: the build ran when the poster was pressed, while the source was
     * only ever set when the chosen video *changed*. Pressing play changes nothing about the choice — it
     * is already the first video — so the new player sat there with no source and an empty black stage.
     * Clicking a row worked, which is what made it look like the stage was fine and the button was not.
     *
     * Measured after the fact: the Plyr wrapper was in the page and no iframe with it.
     *
     * The resume point is applied on `playing` rather than on `ready`, because Plyr replays `ready` for
     * every source and seeking on it would fight the visitor's own scrubbing. It is a one-shot: the
     * handler removes itself, so a video watched to its end and chosen again starts from the top.
     */
    const applySource = (player, post) => {
        if (!player || !post?.videoId) {
            return;
        }

        player.source = {
            type: 'video',
            title: post.title || '',
            sources: [{ src: post.videoId, provider: 'youtube' }]
        };

        const seen = progressRef.current[post.videoId];

        if (seen?.at && seen?.of && seen.at < seen.of * 0.9) {
            const resume = () => {
                player.currentTime = seen.at;
                player.off('playing', resume);
            };

            player.on('playing', resume);
        }

        player.play()?.catch(() => { });
    };

    /**
     * The player itself, made once the visitor has asked for it.
     *
     * **`Plyr` rather than a bare iframe**, so the Player panel governs this stage exactly as it governs
     * the popup and the corner player: one set of controls, colours and behaviours across all three.
     *
     * The editor is left out on purpose. Its canvas is a `blob:` document, which cannot give YouTube the
     * referrer it insists on — the same wall the hover preview meets, measured there — so a player built
     * here would only ever show "Error 153". The stage keeps its thumbnail in the editor and says so.
     */
    useEffect(() => {
        if (!started || isBackEnd || playerRef.current || !mediaRef.current) {
            return;
        }

        const conf = { ...plyrConfig(attributes), autoplay: true };
        const player = finishPlyr(new Plyr(mediaRef.current, conf), conf);

        playerRef.current = player;

        player.on('ended', () => {
            if (autoNextRef.current.autoplayNext) {
                advance.current();
            }
        });

        /**
         * Where the visitor got to, sampled rather than streamed.
         *
         * `timeupdate` fires four times a second; writing to `localStorage` that often would be a write
         * per frame for nothing. Every five seconds of playback is close enough to resume from.
         */
        player.on('timeupdate', () => {
            const at = player.currentTime || 0;

            if (at && Math.floor(at) % 5 === 0) {
                remember(activeRef.current, at, player.duration || 0);
            }
        });

        player.on('pause', () => remember(activeRef.current, player.currentTime || 0, player.duration || 0));

        // The whole point of the note above `applySource`: a new player is given the video that is
        // already chosen, in the same breath as being built.
        applySource(player, items.find(post => post.videoId === activeRef.current) || items[0]);

        return () => {
            try {
                player.destroy();
            } catch (e) {
                // Already gone with the elements it was built on.
            }

            playerRef.current = null;
        };
        // `attributes` is deliberately not a dependency: a Player setting changed in the sidebar should
        // not tear a playing video down. The player is rebuilt when the slider itself is.
    }, [started, isBackEnd]);

    /**
     * The stage following the choice.
     *
     * A `source` swap, not a new player — see the note at the top. The resume point is applied here
     * rather than on `ready`, because Plyr replays `ready` for every source and seeking on it would fight
     * the visitor's own scrubbing.
     */
    useEffect(() => {
        applySource(playerRef.current, active);
    }, [active?.videoId]);

    /** The chosen row brought into view, for a list taller than its box. */
    useEffect(() => {
        listRef.current
            ?.querySelector('.bsbListRow.is-active')
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [active?.videoId, query]);

    /**
     * Playing in the editor, where the stage itself cannot.
     *
     * **The canvas is a `blob:` document.** WordPress builds it with `URL.createObjectURL`, and a document
     * with no http address has no referrer to offer — which YouTube treats as a refusal to identify
     * yourself and answers with "Error 153". Measured both ways, including with an explicit
     * `referrerpolicy`, which does not rescue it. So a player built inside the canvas can only ever show
     * that error, however it is written.
     *
     * The page *around* the canvas is an ordinary admin URL, and a player there plays. That is what this
     * does: the corner player, docked to the editor rather than to the slide — `openMiniPlayer` takes its
     * document from the element it is handed, and `document` here is the admin page, because the block's
     * JavaScript runs in that window while its elements live in the iframe.
     *
     * So in the editor a press does exactly what it says: it plays the video, in the one place in the
     * editor a YouTube video can be played.
     */
    const playInEditor = post => {
        if (!post?.videoId) {
            return;
        }

        openMiniPlayer(attributes, {
            videoId: post.videoId,
            title: String(post.title || '').replace(/<[^>]*>/g, ''),
            link: post.link || '',
            poster: post.thumbnail?.url || '',
            feedType: 'youtube',
            position: socialQuery?.miniPosition || 'bottom-right'
        }, document.body);
    };

    const choose = post => {
        setActiveId(post.videoId);

        if (isBackEnd) {
            playInEditor(post);

            return;
        }

        setStarted(true);
    };

    /**
     * Up and down the list with the keyboard, and Enter to play.
     *
     * The rows carry a roving `tabindex` — one stop for the whole list rather than one per video, which
     * on a channel with two hundred of them would be two hundred presses to get past the slider. Enter
     * and Space play the focused row; the arrows move focus without playing anything, so somebody can
     * look before they leap.
     */
    const onKeyDown = event => {
        const step = 'ArrowDown' === event.key ? 1 : ('ArrowUp' === event.key ? -1 : 0);

        if (!step) {
            return;
        }

        event.preventDefault();

        const rows = [...(listRef.current?.querySelectorAll('.bsbListRow') || [])];
        const at = rows.indexOf(event.target.closest('.bsbListRow'));
        const to = rows[Math.max(0, Math.min(rows.length - 1, at + step))];

        to?.focus();
    };

    if (!items.length) {
        return null;
    }

    const listStyle = { '--bsb-list-rows': rows };

    return <div
        className={`bsbList is-${'beside' === listPosition ? 'beside' : 'below'}${stickyStage ? ' has-sticky-stage' : ''}`}
        style={listStyle}
    >
        <div className='bsbListStage' ref={stageRef}>
            {/* The `<video>` Plyr adopts. Handed a `source` naming a provider it builds the provider's
                iframe itself, which is why one element serves every video in the list. */}
            {started && !isBackEnd
                ? <video ref={mediaRef} className='bsbListVideo' playsInline />
                : <button
                    type='button'
                    className='bsbListPoster'
                    onClick={() => (isBackEnd ? playInEditor(active) : setStarted(true))}
                    aria-label={sprintf(
                        /* translators: %s: a video title */
                        __('Play %s', 'b-slider'),
                        active?.title || __('this video', 'b-slider')
                    )}
                >
                    {active?.thumbnail?.url && (
                        isLazy ? (
                            <img
                                alt=''
                                data-src={active.thumbnail.url}
                                data-srcset={active.thumbnail.srcset || undefined}
                                data-sizes={active.thumbnail.srcset ? '(max-width: 782px) 100vw, 900px' : undefined}
                                className='lazyload'
                                decoding='async'
                            />
                        ) : (
                            <img
                                src={active.thumbnail.url}
                                srcSet={active.thumbnail.srcset || undefined}
                                sizes={active.thumbnail.srcset ? '(max-width: 782px) 100vw, 900px' : undefined}
                                alt=''
                                loading='lazy'
                                decoding='async'
                            />
                        )
                    )}

                    <span className='bsbListPlay' aria-hidden='true'>
                        <svg viewBox='0 0 24 24'><path d='M8 5v14l11-7z' fill='currentColor' /></svg>
                    </span>

                    {/* Said here rather than left as a puzzle: the canvas cannot play YouTube at all, and
                        a stage that did nothing when pressed would read as broken. */}
                    {isBackEnd && <span className='bsbListEditorNote'>
                        {__('Plays in a corner player — this canvas cannot host YouTube', 'b-slider')}
                    </span>}
                </button>}
        </div>

        {showStageMeta && active && <div className='bsbListStageMeta'>
            <h3 className='bsbListStageTitle' dangerouslySetInnerHTML={{ __html: active.title || '' }} />

            <div className='bsbListStageFacts'>
                {!!active.views && <span>{Number(active.views).toLocaleString()} {__('views', 'b-slider')}</span>}
                {/* `getLocalizedDate()`, the same call `ListRow` makes for a row's own date — this was
                    printing `active.date` on its own, so Date Format, the timezone conversion and
                    Translate Date all changed a row's date and left the stage above it unmoved: the two
                    could show a channel's date in two different words for the same setting. */}
                {!!active.date && <span>{getLocalizedDate(active, socialQuery)}</span>}
                {!!active.link && <a href={active.link} target='_blank' rel='noopener noreferrer'>
                    {__('Watch on YouTube', 'b-slider')}
                </a>}
            </div>
        </div>}

        <div className='bsbListPanel'>
            {showFilter && <div className='bsbListFilter'>
                <input
                    type='search'
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={__('Search this channel…', 'b-slider')}
                    aria-label={__('Search this channel', 'b-slider')}
                />
                <span className='bsbListCount'>
                    {sprintf(
                        /* translators: 1: how many videos are shown, 2: how many there are */
                        __('%1$s of %2$s', 'b-slider'),
                        shown.length,
                        items.length
                    )}
                </span>
            </div>}

            <div
                className='bsbListRows'
                ref={listRef}
                role='listbox'
                aria-label={__('Videos in this channel', 'b-slider')}
                onKeyDown={onKeyDown}
            >
                {shown.map((post, index) => <ListRow
                    key={post.videoId || index}
                    post={post}
                    attributes={attributes}
                    isActive={post.videoId === active?.videoId}
                    isNext={autoplayNext && shown[index - 1]?.videoId === active?.videoId}
                    seen={progress[post.videoId]}
                    onChoose={choose}
                    isBackEnd={isBackEnd}
                />)}

                {!shown.length && <p className='bsbListEmpty'>
                    {__('No video in this channel matches that.', 'b-slider')}
                </p>}
            </div>
        </div>
    </div>;
};

export default List;

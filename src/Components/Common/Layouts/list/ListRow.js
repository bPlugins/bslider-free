import { __ } from '@wordpress/i18n';
import HoverPreview, { hoverPreviewOf, useHoverPreview } from '../../single-item/HoverPreview';
import { getLocalizedDate } from '../../../../utils/functions';

/** `1:04:12`, `5:34`, `0:09` — a duration written the way a player writes it. */
const clock = seconds => {
    if (typeof seconds === 'string' && seconds.includes(':')) {
        return seconds;
    }

    const total = Math.max(0, Math.round(Number(seconds) || 0));

    if (!total) {
        return '';
    }

    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = n => String(n).padStart(2, '0');

    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

/** `1.2M`, `14K`, `938` — a view count as a person would say it aloud. */
const compact = count => {
    const n = Number(count) || 0;

    if (n >= 1000000) {
        return `${(n / 1000000).toFixed(n % 1000000 ? 1 : 0).replace(/\.0$/, '')}M`;
    }

    if (n >= 1000) {
        return `${(n / 1000).toFixed(n % 1000 ? 1 : 0).replace(/\.0$/, '')}K`;
    }

    return String(n);
};

/**
 * One video in the list.
 *
 * A `<div role="option">` rather than a `<button>`: the row is a choice among many in a listbox, which is
 * what a screen reader is told, and it holds a link of its own — a button containing a link is markup no
 * browser has a good answer for.
 *
 * **The hover preview is the same one the slides use.** `useHoverPreview` is called here per row, so a
 * row plays its video muted under the cursor exactly as a slide does, with the same delay, the same
 * respect for a touch screen and reduced motion, and the same single-preview-at-a-time rule — the
 * registry that enforces it is module scope, so a row and a slide cannot both be playing.
 */
const ListRow = ({ post, attributes, isActive, isNext, seen, onChoose, isBackEnd = false }) => {
    const { socialQuery = {}, listLayout = {}, videoConf, isLazyLoad } = attributes;
    const {
        showDuration = true,
        showViews = true,
        showDate = true,
        hoverPreviewRows = true,
        rememberProgress = true
    } = listLayout;

    const isLazy = isLazyLoad && !isBackEnd;

    /**
     * Whether this row previews under the cursor.
     *
     * Two settings have to agree: the slider's own hover preview, and this layout's. Handing
     * `hoverPreviewOf` a query with the preview switched off is how the second one says no, rather than
     * duplicating what that function already decides about ids and files.
     */
    const preview = hoverPreviewRows
        ? hoverPreviewOf(post, { ...socialQuery, hoverPreview: true }, videoConf)
        : null;

    const hover = useHoverPreview(preview);

    const watched = rememberProgress && seen?.at && seen?.of ? seen.at >= seen.of * 0.9 : false;
    const part = rememberProgress && seen?.at && seen?.of && !watched
        ? Math.min(100, Math.round((seen.at / seen.of) * 100))
        : 0;

    const duration = clock(post?.duration);

    return <div
        className={`bsbListRow${isActive ? ' is-active' : ''}${watched ? ' is-watched' : ''}`}
        role='option'
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        onClick={() => onChoose(post)}
        onKeyDown={event => {
            if ('Enter' === event.key || ' ' === event.key) {
                event.preventDefault();
                onChoose(post);
            }
        }}
    >
        <div className='bsbListThumb' ref={hover.hostRef} {...hover.handlers}>
            {post?.thumbnail?.url && (
                isLazy ? (
                    <img
                        alt=''
                        data-src={post.thumbnail.url}
                        className='lazyload'
                        decoding='async'
                    />
                ) : (
                    <img
                        src={post.thumbnail.url}
                        alt=''
                        loading='lazy'
                        decoding='async'
                    />
                )
            )}

            {hover.active && <HoverPreview
                preview={preview}
                imageFit='cover'
                label={post?.title || __('Video preview', 'b-slider')}
                mediaRef={hover.mediaRef}
                sound={hover.sound}
            />}

            {showDuration && !!duration && <span className='bsbListDuration'>{duration}</span>}

            {/* Where the visitor got to, drawn where every player draws it. Only for a video left
                part-finished: a bar at 0 or at 100 says nothing the row does not already say. */}
            {!!part && <span className='bsbListProgress' style={{ '--bsb-list-seen': `${part}%` }} />}
        </div>

        <div className='bsbListRowBody'>
            <span className='bsbListRowTitle' dangerouslySetInnerHTML={{ __html: post?.title || '' }} />

            <span className='bsbListRowMeta'>
                {showViews && !!post?.views && <span>{compact(post.views)} {__('views', 'b-slider')}</span>}
                {showDate && !!post?.date && <span>{getLocalizedDate(post, socialQuery)}</span>}
                {watched && <span className='bsbListWatched'>{__('Watched', 'b-slider')}</span>}
            </span>

            {/* Only ever one of these on screen, and only when the setting that fills it is on. It is the
                one place this list says what it is about to do by itself. */}
            {isNext && !isActive && <span className='bsbListUpNext'>{__('Up next', 'b-slider')}</span>}
        </div>
    </div>;
};

export default ListRow;

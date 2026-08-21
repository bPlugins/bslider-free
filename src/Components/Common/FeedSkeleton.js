import { __ } from '@wordpress/i18n';

/**
 * The shape of a slider that is on its way.
 *
 * A feed takes a moment to arrive: the address is debounced by 700ms, and the request behind it goes
 * out to YouTube, an RSS host or an API. What used to fill that gap was the state card for a feed with
 * nothing in it — "This feed has no videos yet", in warning amber, on a slider that was in fact
 * loading perfectly well. Somebody who has just picked a channel reads that as a failure and goes
 * looking for what they did wrong.
 *
 * So the gap is drawn as what is coming instead. Blocks in the layout's own proportions, a soft blur
 * over the picture areas the way a photograph resolves, and one line of text saying what is happening.
 * Nothing here claims to be data — the point is that it obviously is not, while still being the right
 * shape, so the slider appears to be filling in rather than to be broken and then suddenly fixed.
 *
 * Editor only. On the front end the feed is fetched and cached by PHP before anything renders, so a
 * visitor never waits on it and never sees this.
 */
const FeedSkeleton = ({ count = 3, tall = false, label = '' }) => <div
    className={`bsbFeedSkeleton ${tall ? 'is-tall' : 'is-row'}`}
    /* `aria-busy` rather than a hidden label: this is a placeholder for content, and a screen reader
       should hear that the region is loading, not read out three empty cards. */
    aria-busy='true'
>
    <div className='bsbFeedSkeletonGrid'>
        {Array.from({ length: count }, (unused, index) => (
            <div
                className='bsbFeedSkeletonCard'
                key={index}
                /* Staggered, so the shimmer reads as one wave crossing the row rather than as three
                   blocks pulsing in unison — which looks like a fault light. */
                style={{ animationDelay: `${index * 140}ms` }}
            >
                <div className='bsbFeedSkeletonThumb' />
                <div className='bsbFeedSkeletonLines'>
                    <span className='bsbFeedSkeletonLine is-title' />
                    <span className='bsbFeedSkeletonLine is-meta' />
                </div>
            </div>
        ))}
    </div>

    <p className='bsbFeedSkeletonNote'>
        <span className='bsbFeedSkeletonDot' aria-hidden='true' />
        {label || __('Reading the feed…', 'b-slider')}
    </p>
</div>;

export default FeedSkeleton;

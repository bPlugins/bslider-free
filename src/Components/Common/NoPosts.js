import { __ } from '@wordpress/i18n';
import { emptySliderIcon } from '../../utils/icons';

/**
 * What a slider shows when it has nothing to draw.
 *
 * Not an error, so it does not look like one. A post query that matched nothing has not broken —
 * and the red heading this used to be read as a fault in the plugin. A feed that could not be read
 * is the one case that really is a failure, and it says so in its own words.
 *
 * The wording turns on who is reading it. In the editor that is the person who can fix it, so it
 * names the panel and the controls to change. On the front end the same sentence would be telling a
 * visitor to open a sidebar they have no access to, so they get a plain line and nothing to act on.
 */
const NoPosts = ({ attributes, isEditor = false, feedError = '' }) => {
    const { sourceType, socialQuery = {} } = attributes;
    const isProduct = 'woo' === sourceType;
    const isFeed = 'social' === sourceType;

    /**
     * A feed with nothing in it says nothing to a visitor.
     *
     * Every one of these messages is about setting the slider up, which is not a visitor's job and
     * not their business either. An unconfigured feed simply draws no slider on the front end,
     * exactly as an empty one does.
     */
    if (isFeed && !isEditor) {
        return null;
    }

    /**
     * Either route counts as configured.
     *
     * Reading only the slider's own address left a slider that names a saved channel being told to
     * go and pick a channel it had already picked.
     */
    const hasAddress = !!(socialQuery?.source || '').trim() || !!(socialQuery?.channelId || '').trim();
    const feedType = socialQuery?.feedType || '';

    const state = (() => {
        // The one state here that is a real failure, so it is the one that reports what went wrong
        // rather than what to do next — the service's own message is more use than a guess at it.
        if (isFeed && feedError) {
            return {
                tone: 'warn',
                title: __('That feed could not be read', 'b-slider'),
                body: feedError,
                hint: __('Check the address in the Feed Settings panel.', 'b-slider')
            };
        }

        if (isFeed && !hasAddress) {
            if (!feedType) {
                return {
                    tone: 'setup',
                    title: __('Select a feed type', 'b-slider'),
                    body: __('Choose a feed type to pull content into your slider.', 'b-slider'),
                    hint: ''
                };
            }

            const byType = {
                rss: {
                    title: __('Pick an RSS feed to pull posts from', 'b-slider'),
                    body: __('Paste a valid RSS or Atom feed URL. The slider fills itself in and keeps up as the feed publishes new posts.', 'b-slider')
                },
                json: {
                    title: __('Pick a JSON endpoint to pull items from', 'b-slider'),
                    body: __('Paste an external JSON endpoint URL. The slider fills itself in and displays content from the API.', 'b-slider')
                },
                instagram: {
                    title: __('Pick an Instagram account to pull posts from', 'b-slider'),
                    body: __('Connect your Instagram account to pull posts. The slider fills itself in and keeps up as you publish new posts.', 'b-slider')
                },
                youtube_video: {
                    title: __('Paste a YouTube video URL', 'b-slider'),
                    body: __('One video, embedded as a single slide.', 'b-slider')
                }
            };

            const copy = byType[feedType] || {
                title: __('Pick a channel to pull videos from', 'b-slider'),
                body: __('Paste a YouTube channel URL, its @handle, or a playlist link. The slider fills itself in and keeps up as the channel publishes.', 'b-slider')
            };

            return {
                tone: 'setup',
                ...copy,
                // Only worth saying where somebody is setting a feed up for the first time.
                hint: 'instagram' === feedType
                    ? __('Instagram connections are saved once for the whole site, so every slider can pick them.', 'b-slider')
                    : __('Feeds are saved once for the whole site, so every slider can pick them.', 'b-slider')
            };
        }

        // Configured, and the service answered with nothing. Not a failure: a channel really can
        // have no videos in it yet.
        if (isFeed) {
            return {
                tone: 'setup',
                title: __('This feed has nothing in it yet', 'b-slider'),
                body: __('The feed was read and came back empty. It will fill in as soon as the account publishes something.', 'b-slider'),
                hint: ''
            };
        }

        return {
            tone: 'setup',
            title: isProduct
                ? __('No products to show', 'b-slider')
                : __('No posts to show', 'b-slider'),
            body: isEditor
                ? (isProduct
                    ? __('Nothing matched this query. Widen the categories, tags or offset in the Product Query panel — or publish a product.', 'b-slider')
                    : __('Nothing matched this query. Widen the categories, tags or offset in the Post Query panel — or publish a post.', 'b-slider'))
                : __('There is nothing to show here yet. Please check back soon.', 'b-slider'),
            hint: ''
        };
    })();

    return <div className={`bsbNoPosts is-${state.tone}`} role='status'>
        <span className='bsbNoPostsIcon'>{emptySliderIcon}</span>

        <h3 className='bsbNoPostsTitle'>{state.title}</h3>

        <p className='bsbNoPostsText'>{state.body}</p>

        {!!state.hint && <p className='bsbNoPostsHint'>{state.hint}</p>}
    </div>
}
export default NoPosts;

import { __ } from '@wordpress/i18n';
import Carousel from './Carousel';
import Default from './Default';
import Grid from './grid/Grid';
import Thumbnails from './thumbnails/Thumbnails';
import List from './list/List';
import NoPosts from '../NoPosts';
import Loading from '../Loading';
import FeedSkeleton from '../FeedSkeleton';
import { followIcon, followLabel, followersLabel, hasFeedProfile } from '../../../utils/feedProfile';

/** The class a feed's own colours hang off, for the header card and the follow button alike. */
const feedClass = feedType => `bsb-feed-${feedType}`;

/** A follower count as a person would write it: 1.2K, 3.4M, and small numbers in full. */
const compactCount = count => {
    const n = Number(count) || 0;

    if (n >= 1000000) {
        return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1).replace(/\.0$/, '')}M`;
    }

    if (n >= 1000) {
        return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1).replace(/\.0$/, '')}K`;
    }

    return String(n);
};

const Layout = (props) => {
    const { attributes, PostsGrid, firstPosts, commonDeProps, feedError, feedProfile, feedLoading = false, onOpenPanel, onOpenGlobal } = props;

    const { layoutType, sourceType, socialQuery = {} } = attributes;
    const layouts = { default: Default, carousel: Carousel, grid: ('posts' === sourceType || 'woo' === sourceType) ? PostsGrid : Grid, thumbnails: Thumbnails, list: List };

    /**
     * The List layout belongs to a YouTube channel, and to nothing else.
     *
     * Both pickers already hide it elsewhere, so this is the net under them: a slider saved as a channel
     * list and later pointed at an RSS feed, a single video or Instagram would otherwise render a stage
     * for videos that have no `videoId` and a list of nothing. It falls back to the layout every source
     * can draw rather than to an empty box.
     */
    const chosen = 'list' === layoutType && !('social' === sourceType && 'youtube' === socialQuery?.feedType)
        ? 'default'
        : layoutType;

    const LayoutComponent = layouts[chosen];

    const {
        showHeader = false,
        headerStyle = 'card',
        showChannelStats = false,
        showHeaderBanner = false,
        headerBanner = '',
        headerBannerHeight = 180,
        headerAvatar = '',
        headerName = '',
        headerBio = '',
        headerLink = '',
        headerFollowText = 'Follow',
        showFollowButton = false,
        followButtonText = '',
        followButtonAlign = 'center',
        showFollowers = false,
        feedType = 'youtube'
    } = socialQuery;

    /**
     * The account as it stands today, and what was typed over it.
     *
     * The block's own fields win where they hold something, and the account answers for the rest.
     * That is the whole of "fetched, and editable": nothing has to be copied into the block for the
     * header to work, and emptying a field gives the account its say back rather than blanking the
     * line — which is what a stored copy did.
     *
     * Two ways in and one shape out. On the front end `render.php` puts the profile on `socialQuery`
     * because that is what reaches the browser; in the editor there is no render, so `Edit` passes
     * what the feed request already brought back. Read together here so neither side has a version
     * of the header the other does not.
     */
    const account = feedProfile || socialQuery?.profile || {};

    /**
     * Whether this slider has anything standing behind it to introduce or to point at.
     *
     * A single YouTube video and a JSON document have not: one is a clip somebody embedded rather
     * than a channel, and the other describes no publisher at all. Both used to draw the card and
     * the button anyway wherever the toggles happened to be on — a slider carrying "Follow on
     * Instagram" under a video, because the settings are one panel shared by every feed type and
     * nothing here asked which one it was. See `PROFILE_FEED_TYPES`.
     */
    const isProfileFeed = 'social' === sourceType && hasFeedProfile(feedType);

    /**
     * What to show while the feed is on its way, which is two different situations.
     *
     * With nothing on screen yet the whole slider is a placeholder: `FeedSkeleton` in the shape of the
     * layout that is coming. Before this, that gap was filled by the state card for a feed with nothing
     * in it — a warning, in amber, about a feed that was loading normally.
     *
     * With slides already up — a refresh, or a setting changed — the slides stay. Replacing a working
     * preview with grey blocks every time somebody nudges "how many videos" would be worse than the
     * wait it covers, so that case gets a quiet marker instead and nothing moves.
     *
     * Only in the editor. On the front end PHP has the feed in hand before anything renders, so
     * `feedLoading` never arrives and both of these stay false.
     */
    const isEditorFeed = 'social' === sourceType && !!commonDeProps?.isBackEnd;
    const showSkeleton = isEditorFeed && feedLoading && !firstPosts?.length;
    const isRefreshing = isEditorFeed && feedLoading && !!firstPosts?.length;

    /** The skeleton in the proportions of the layout that is about to replace it. */
    const isTallLayout = !['grid', 'thumbnails'].includes(layoutType);
    const skeletonCount = isTallLayout ? 1 : 3;

    const profileAvatar = headerAvatar || account.avatar || '';

    /**
     * The wide picture above the card, on the same terms as every other header field: what was
     * chosen wins, and the account answers for it otherwise.
     *
     * Behind its own toggle rather than drawn whenever one exists. A banner is 180px of the page
     * before a visitor reaches a single slide, which is right for a channel presented as a channel
     * and wrong for a slider that happens to read one — so it is asked for, not assumed. Only
     * YouTube reports one today; `hasHeaderContent` below does not count it, since a banner with
     * no name or avatar under it is a stripe rather than a header.
     */
    const profileBanner = showHeaderBanner ? (headerBanner || account.banner || '') : '';
    const profileName = headerName || account.name || '';
    const profileBio = headerBio || account.bio || '';
    const profileLink = headerLink || account.link || '';
    const followers = Number(account.followers) || 0;

    /**
     * The other two numbers a channel reports about itself: how many videos, and how many times they
     * have been watched altogether. `YouTubeFeed::readProfile()` fills both in; the other readers
     * answer 0, which reads here as "nothing to print" exactly as `followers` does.
     */
    const postCount = Number(account.posts) || 0;
    const viewCount = Number(account.views) || 0;

    /**
     * Which of the two headers is drawn.
     *
     * `card` is the original — a tinted, accent-edged box with the account inside it, which suits a
     * feed embedded in a page of other content. `panel` is the channel-page arrangement: the banner
     * as a full-width block, the account on a plain surface under it, and the stats as one line.
     *
     * The difference is entirely CSS. Both draw the same fields from the same account, so nothing
     * below has to ask which is in use, and a slider can be switched between them without losing
     * anything it had typed.
     */
    const isPanelHeader = 'panel' === headerStyle;

    /**
     * Whether the card would have anything on it.
     *
     * The account answers for every field nobody typed over, and a service can decline to answer —
     * a YouTube channel read on a site with no API key comes back with nothing at all. An empty
     * bordered box above the slides is worse than no box, so the card waits until it has something
     * to introduce. The button under the slides has the same guard in `profileLink` below.
     */
    const hasHeaderContent = !!(profileAvatar || profileName || profileBio || profileLink);

    /**
     * The button under the slider, which is the same account link the header card offers.
     *
     * One link and two places it can appear, rather than a second copy of the same address to keep
     * in step — see the note on the field in `SocialHeaderSettings`.
     *
     * Only where there are slides above it. A follow button under an error message, or under a feed
     * still loading, is an invitation attached to nothing; `firstPosts` is `null` until the fetch
     * answers and empty when it found nothing, and neither is a slider.
     */
    const showFollow = isProfileFeed
        && showFollowButton
        && !!profileLink
        && !!firstPosts?.length;

    return (
        <>
            {/* Above the card and outside it, so a slider can show a banner with the header card
                turned off — a channel's picture over its videos, without the name repeated under it.
                `object-fit: cover` in style.scss does the cropping; a banner is 16:9-ish at the source
                and this strip never is. */}
            {isProfileFeed && !!profileBanner && (
                <div className={`bsb-social-profile-banner ${feedClass(feedType)}${isPanelHeader ? ' is-panel' : ''}`} style={{ height: `${headerBannerHeight}px` }}>
                    <img src={profileBanner} alt={profileName ? `${profileName} banner` : __('Channel banner', 'b-slider')} />
                </div>
            )}

            {isProfileFeed && showHeader && hasHeaderContent && (
                <div className={`bsb-social-profile-header ${feedClass(feedType)}${isPanelHeader ? ' is-panel' : ''}`}>
                    <div className="bsb-profile-info-wrap">
                        {!!profileAvatar && (
                            <div className="bsb-profile-avatar">
                                <img src={profileAvatar} alt={profileName || __('Profile Avatar', 'b-slider')} />
                            </div>
                        )}
                        <div className="bsb-profile-text">
                            {!!profileName && <h3 className="bsb-profile-name">{profileName}</h3>}
                            {!!profileBio && <p className="bsb-profile-bio">{profileBio}</p>}
                            {/* Only where the account actually reported one. Instagram gives
                                `followers_count` to a professional account and withholds it from a
                                personal one, and a YouTube channel may hide its subscriber count
                                outright; both come back as 0 — and "0 followers" under a feed with
                                posts in it is a number nobody has, not a fact. */}
                            {/* One line of numbers, the way the channel's own page writes it:
                                subscribers, videos, views, separated by dots. Each is dropped where
                                the service reported nothing, so the dots never lead or trail — a
                                channel hiding its subscriber count still gets a tidy line.

                                `showChannelStats` is the wider switch and `showFollowers` the older
                                one that only ever meant the first number. Both are honoured: turning
                                the new one on adds the other two, and a slider that never touches it
                                keeps exactly the line it had. */}
                            {(showFollowers || showChannelStats) && (followers > 0 || (showChannelStats && (postCount > 0 || viewCount > 0))) && (
                                <p className="bsb-profile-followers">
                                    {followers > 0 && (
                                        <span><strong>{compactCount(followers)}</strong> {followersLabel(feedType)}</span>
                                    )}

                                    {showChannelStats && postCount > 0 && (
                                        <span><strong>{compactCount(postCount)}</strong> {__('Videos', 'b-slider')}</span>
                                    )}

                                    {showChannelStats && viewCount > 0 && (
                                        <span><strong>{compactCount(viewCount)}</strong> {__('Views', 'b-slider')}</span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>
                    {!!profileLink && (
                        <div className="bsb-profile-action">
                            <a
                                href={profileLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bsb-follow-btn"
                            >
                                {headerFollowText || __('Follow', 'b-slider')}
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Drawn whether or not anything is loading, and hidden by CSS rather than by React.
                Mounted once for the life of the slider so the layout beside it keeps its place in the
                child order — appear here only while refreshing and every arriving feed would shift
                the carousel's index by one, which unmounts and re-initialises Swiper mid-preview. */}
            {isEditorFeed && <div className='bsbFeedActivityAnchor'>
                {/* A zero-height box of its own to hang off, rather than `position: relative` on
                    `.mainLayout` — that wrapper holds every layout this plugin draws, and making it a
                    containing block would re-anchor any arrow or caption inside it that positions
                    against something further out. */}
                <div className={`bsbFeedActivity ${isRefreshing ? 'is-on' : ''}`} aria-hidden={!isRefreshing}>
                    <span className='bsbFeedSkeletonDot' />
                    {__('Updating…', 'b-slider')}
                </div>
            </div>}

            {showSkeleton
                ? <FeedSkeleton count={skeletonCount} tall={isTallLayout} />
                : !firstPosts ? <Loading /> : firstPosts?.length || ['image', 'video'].includes(sourceType)
                    ? <LayoutComponent {...props} />
                    : <NoPosts {...{ ...props, isBackEnd: !!commonDeProps?.isBackEnd, feedError, onOpenPanel, onOpenGlobal }} />
            }

            {showFollow && (
                <div className={`bsb-social-follow-footer ${feedClass(feedType)} is-${followButtonAlign}`}>
                    <a
                        href={profileLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bsb-follow-btn"
                    >
                        {/* `aria-hidden`, because the label beside it already says where this goes —
                            a screen reader announcing the mark as well would say it twice. */}
                        {!!followIcon(feedType) && <span className="bsb-follow-btn-icon" aria-hidden="true">{followIcon(feedType)}</span>}
                        {followButtonText || followLabel(feedType)}
                    </a>
                </div>
            )}
        </>
    );
}
export default Layout;
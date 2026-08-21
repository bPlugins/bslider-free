import { __ } from '@wordpress/i18n';
import Carousel from './Carousel';
import Default from './Default';
import Grid from './grid/Grid';
import Thumbnails from './thumbnails/Thumbnails';
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
    const { attributes, PostsGrid, firstPosts, commonDeProps, feedError, feedProfile, feedLoading = false } = props;

    const { layoutType, sourceType, socialQuery = {} } = attributes;
    const layouts = { default: Default, carousel: Carousel, grid: ('posts' === sourceType || 'woo' === sourceType) ? PostsGrid : Grid, thumbnails: Thumbnails };

    /**
     * A feed slider draws the Default layout, whatever it was saved with.
     *
     * The other four are Premium — see `ProLayoutsPromo`. Both pickers already hide them, so this is
     * the net under them: a block built on a licensed site as a channel Carousel would otherwise ask
     * for a layout component this build has no feed support for.
     */
    const chosen = 'social' === sourceType ? 'default' : layoutType;

    const LayoutComponent = layouts[chosen];

    const {
        showHeader = false,
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
        feedType = 'youtube'
    } = socialQuery;

    /**
     * The account as it stands today, and what was typed over it.
     *
     * The block's own fields win where they hold something, and the account answers for the rest.
     * That is the whole of "fetched, and editable": nothing has to be copied into the block for the
     * header to work, and emptying a field gives the account its say back rather than blanking the
     * line.
     *
     * Two ways in and one shape out. On the front end `render.php` puts the profile on `socialQuery`
     * because that is what reaches the browser; in the editor there is no render, so `Edit` passes
     * what the feed request already brought back.
     */
    const account = feedProfile || socialQuery?.profile || {};

    /**
     * Whether this slider has anything standing behind it to introduce or to point at.
     *
     * A single YouTube video and a JSON document have not: one is a clip somebody embedded rather
     * than a channel, and the other describes no publisher at all. See `PROFILE_FEED_TYPES`.
     */
    const isProfileFeed = 'social' === sourceType && hasFeedProfile(feedType);

    /**
     * What to show while the feed is on its way, which is two different situations.
     *
     * With nothing on screen yet the whole slider is a placeholder, in the shape of what is coming.
     * With slides already up — a refresh, or a setting changed — the slides stay and a quiet marker
     * appears instead, because replacing a working preview with grey blocks every time somebody
     * nudges "how many videos" would be worse than the wait it covers.
     *
     * Only in the editor. On the front end PHP has the feed in hand before anything renders, so
     * `feedLoading` never arrives and both of these stay false.
     */
    const isEditorFeed = 'social' === sourceType && !!commonDeProps?.isBackEnd;
    const showSkeleton = isEditorFeed && feedLoading && !firstPosts?.length;
    const isRefreshing = isEditorFeed && feedLoading && !!firstPosts?.length;

    /* Only the editor sets this, so the empty state below can tell an author from a visitor and
       offer the fix to the one who can act on it. */
    const isEditor = true === commonDeProps?.isBackEnd;

    const profileAvatar = headerAvatar || account.avatar || '';

    /**
     * The wide picture above the card, on the same terms as every other header field: what was
     * chosen wins, and the account answers for it otherwise.
     *
     * Behind its own toggle rather than drawn whenever one exists. A banner is 180px of the page
     * before a visitor reaches a single slide, which is right for a channel presented as a channel
     * and wrong for a slider that happens to read one — so it is asked for, not assumed.
     */
    const profileBanner = showHeaderBanner ? (headerBanner || account.banner || '') : '';
    const profileName = headerName || account.name || '';
    const profileBio = headerBio || account.bio || '';
    const profileLink = headerLink || account.link || '';
    const followers = Number(account.followers) || 0;

    /**
     * Whether the card would have anything on it.
     *
     * The account answers for every field nobody typed over, and a service can decline to answer —
     * a YouTube channel read on a site with no API key comes back with nothing at all. An empty
     * bordered box above the slides is worse than no box, so the card waits until it has something
     * to introduce.
     */
    const hasHeaderContent = !!(profileAvatar || profileName || profileBio || profileLink);

    /**
     * The button under the slider, which is the same account link the header card offers.
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
                turned off — a channel's picture over its videos, without the name repeated under it. */}
            {isProfileFeed && !!profileBanner && (
                <div className={`bsb-social-profile-banner ${feedClass(feedType)}`} style={{ height: `${headerBannerHeight}px` }}>
                    <img src={profileBanner} alt={profileName ? `${profileName} banner` : __('Channel banner', 'b-slider')} />
                </div>
            )}

            {isProfileFeed && showHeader && hasHeaderContent && (
                <div className={`bsb-social-profile-header ${feedClass(feedType)}`}>
                    <div className="bsb-profile-info-wrap">
                        {!!profileAvatar && (
                            <div className="bsb-profile-avatar">
                                <img src={profileAvatar} alt={profileName || __('Profile Avatar', 'b-slider')} />
                            </div>
                        )}
                        <div className="bsb-profile-text">
                            {!!profileName && <h3 className="bsb-profile-name">{profileName}</h3>}
                            {!!profileBio && <p className="bsb-profile-bio">{profileBio}</p>}
                            {/* Only where the account actually reported one. A YouTube channel may
                                hide its subscriber count outright, which comes back as 0 — and
                                "0 subscribers" under a feed with videos in it is a number nobody
                                has, not a fact. */}
                            {followers > 0 && (
                                <p className="bsb-profile-followers">
                                    <span><strong>{compactCount(followers)}</strong> {followersLabel(feedType)}</span>
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
                <div className={`bsbFeedActivity ${isRefreshing ? 'is-on' : ''}`} aria-hidden={!isRefreshing}>
                    <span className='bsbFeedSkeletonDot' />
                    {__('Updating…', 'b-slider')}
                </div>
            </div>}

            {showSkeleton
                ? <FeedSkeleton count={1} tall={true} />
                : !firstPosts ? <Loading /> : firstPosts?.length || ['image', 'video'].includes(sourceType)
                    ? <LayoutComponent {...props} />
                    : <NoPosts {...{ attributes, isEditor, feedError }} />
            }

            {showFollow && (
                <div className={`bsb-social-follow-footer ${feedClass(feedType)} is-center`}>
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

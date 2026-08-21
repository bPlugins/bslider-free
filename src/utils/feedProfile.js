import { __ } from '@wordpress/i18n';
import { instagram, youtube, rss } from './icons';

/**
 * The feed types with an account, a channel or a publication standing behind them.
 *
 * The list `SocialFeed::PROFILE_TYPES` holds on the other side, and the reason the header card and
 * the follow button exist at all. Keep the two in step.
 *
 * `youtube_video` is out because a single video is not a channel: the slider is one clip somebody
 * embedded, and a "Subscribe" card over it is an invitation the block was never asked to make.
 * `json` is out because an arbitrary JSON document describes no publisher — there is nothing to read
 * a name or a picture out of, and no address to send anybody to. Instagram is out because it is
 * Premium, and this build has no reader for it.
 */
export const PROFILE_FEED_TYPES = ['youtube', 'rss'];

export const hasFeedProfile = feedType => PROFILE_FEED_TYPES.includes(feedType);

/**
 * What the follow button says when nobody has said otherwise.
 *
 * A function and not a constant map: `__()` at module scope runs while the bundle is being
 * evaluated, which on the front end is before `wp_set_script_translations` has handed the locale
 * data over — so a translated site would get the English back. Called during a render it is late
 * enough for the translations to be in place.
 *
 * The service's own verb, because "Follow" is not what YouTube calls it, nobody follows an RSS feed
 * at all, and a button that names the wrong action reads as a mistake on the site rather than as a
 * default nobody changed.
 */
export const followLabel = feedType => {
    if ('instagram' === feedType) {
        return __('Follow on Instagram', 'b-slider');
    }

    if ('youtube' === feedType) {
        return __('Subscribe on YouTube', 'b-slider');
    }

    if ('rss' === feedType) {
        return __('Visit Website', 'b-slider');
    }

    return __('Follow', 'b-slider');
};

/** The service's mark. A JSON feed has none, and gets none. */
export const followIcon = feedType => {
    if ('instagram' === feedType) {
        return instagram;
    }

    if ('youtube' === feedType) {
        return youtube();
    }

    return 'rss' === feedType ? rss : null;
};

/** What the service calls the people counted under the name — YouTube does not call them followers. */
export const followersLabel = feedType => 'youtube' === feedType
    ? __('subscribers', 'b-slider')
    : __('followers', 'b-slider');

/** An address of the right shape to show in an empty Profile Link field. */
export const profileLinkPlaceholder = feedType => {
    if ('instagram' === feedType) {
        return 'https://instagram.com/myusername';
    }

    if ('youtube' === feedType) {
        return 'https://youtube.com/@mychannel';
    }

    return 'https://example.com';
};

/** What the button that reads the profile offers to read it from. */
export const fillButtonLabel = feedType => {
    if ('instagram' === feedType) {
        return __('Fill from Instagram account', 'b-slider');
    }

    if ('youtube' === feedType) {
        return __('Fill from YouTube channel', 'b-slider');
    }

    return __('Fill from feed', 'b-slider');
};

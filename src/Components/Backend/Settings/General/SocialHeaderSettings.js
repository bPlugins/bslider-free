import { __ } from '@wordpress/i18n';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { TipToggle, TipText, TipRange } from '../../../Panel/TipField';
import { TextControl, SelectControl, ToggleControl, Button, Spinner } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import useFeedProfile from '../../../../hooks/useFeedProfile';
import { fillButtonLabel, followLabel, profileLinkPlaceholder } from '../../../../utils/feedProfile';
import { isProActive } from '../../../../utils/functions';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';

const SocialHeaderSettings = ({ attributes, setAttributes, updateObject, socialFeed, premiumProps }) => {
    const isPro = premiumProps?.isPremium ?? isProActive();
    const { socialQuery = {} } = attributes;
    const {
        feedType = 'youtube',
        channelId = '',
        source = '',
        showHeader = false,
        headerStyle = 'card',
        showChannelStats = false,
        showHeaderBanner = false,
        headerBanner = '',
        headerBannerHeight = 180,
        showFollowers = false,
        headerAvatar = '',
        headerName = '',
        headerBio = '',
        headerLink = '',
        headerFollowText = 'Follow',
        showFollowButton = false,
        followButtonText = '',
        followButtonAlign = 'center'
    } = socialQuery;

    /** The account link is shared, so it is offered as soon as anything is going to point at it. */
    const needsLink = !!showHeader || !!showFollowButton;

    /**
     * The account as the block will actually draw it, so the panel can show what a blank field means.
     *
     * The same profile `Layout` reads — it arrives with the feed request. Each field goes into its
     * control's `placeholder`, which is exactly the right shape for the rule: what is typed wins,
     * what is empty falls through to the account. A field showing greyed-out text the visitor will
     * see is a better answer than an empty box that looks broken.
     */
    const liveAccount = socialFeed?.profile || {};

    /** What the button under the slider will say if the label is left empty — see `Layout`. */
    const defaultFollowLabel = followLabel(feedType);

    const profile = useFeedProfile();

    /**
     * The address to ask about, where it is safe to send one.
     *
     * Instagram's "address" is its access token, and this is a query string — it would be written
     * into every access log between here and the server. A saved channel is named by its id instead
     * and the token is looked up on the side that already holds it, which is why connecting an
     * Instagram account saves a channel in the first place.
     */
    const askableSource = 'instagram' === feedType ? '' : source;

    /**
     * Whether there is anything to ask.
     *
     * The panel itself is only offered for a feed type with a profile behind it — see `General` —
     * so what is left to decide here is whether this slider has said *which* account yet, by naming
     * a saved channel or by carrying an address that may be sent.
     */
    const canFetch = !!channelId || !!askableSource;

    /**
     * Fill the four fields in from the account.
     *
     * Written in one `setAttributes`, not four `updateObject` calls: each of those reads the
     * `socialQuery` it closed over and writes the whole object back, so four in a row all start
     * from the same stale copy and only the last one survives.
     */
    const fillFromAccount = () => profile.fetch({ channelId, feedType, source: askableSource }).then(account => {
        if (!account) {
            return;
        }

        setAttributes({
            socialQuery: {
                ...socialQuery,
                showHeader: true,
                headerAvatar: account.avatar || headerAvatar,
                headerName: account.name || headerName,
                headerBio: account.bio || headerBio,
                headerLink: account.link || headerLink
            }
        });
    });

    const gap = 'mt15';

    /**
     * Whether this feed has a cover picture behind it at all.
     *
     * YouTube alone reports one — `InstagramFeed` and `RssFeed` answer with `''` deliberately, an
     * Instagram profile having no cover and an RSS channel's one image already being its avatar. The
     * controls are hidden rather than left to produce nothing, so the panel does not offer a banner
     * to a feed that can never draw one.
     */
    const canHaveBanner = 'youtube' === feedType;

    return (
        <PanelBody
            className='bPlPanelBody bsb_social_header_panel'
            title={__('Profile & Follow', 'b-slider')}
            badge={__('New', 'b-slider')}
            initialOpen={false}
        >
            {/* Above the card's own toggle, in the order the two are drawn. Its own switch rather than
                part of the card: a banner is a strip of picture before the visitor reaches a slide, and
                a slider that reads a channel is not always presenting itself as that channel. */}
            {canHaveBanner && <TipToggle
                label={__('Show Channel Banner', 'b-slider')}
                checked={!!showHeaderBanner}
                onChange={val => updateObject('socialQuery', 'showHeaderBanner', val)}
                tip={__('Display the channel’s wide cover image above the feed. Read from the channel unless you choose your own.', 'b-slider')}
            />}

            {canHaveBanner && !!showHeaderBanner && (
                <>
                    <div className={gap} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <MediaUpload
                            onSelect={media => updateObject('socialQuery', 'headerBanner', media.url)}
                            allowedTypes={['image']}
                            value={headerBanner}
                            render={({ open }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <TextControl
                                        label={__('Banner Image', 'b-slider')}
                                        value={headerBanner}
                                        onChange={val => updateObject('socialQuery', 'headerBanner', val)}
                                        placeholder={liveAccount.banner || __('Read from the channel', 'b-slider')}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button variant="secondary" onClick={open} size="small">
                                            {__('Choose Image', 'b-slider')}
                                        </Button>
                                        {!!headerBanner && (
                                            <Button variant="link" isDestructive onClick={() => updateObject('socialQuery', 'headerBanner', '')} size="small">
                                                {__('Remove', 'b-slider')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </div>

                    {/* Only where the channel reported none and none was chosen — the toggle is on and
                        nothing will be drawn, which is worth saying rather than leaving as a blank. A
                        channel that has never uploaded a banner is the ordinary case, not an error. */}
                    {!headerBanner && !liveAccount.banner && (
                        <p className='bsb_feed_note'>
                            {__('No banner found on this channel yet. Choose an image above, or press “Read account” to look again.', 'b-slider')}
                        </p>
                    )}

                    <TipRange
                        className={gap}
                        label={__('Banner Height', 'b-slider')}
                        labelPosition='side'
                        value={headerBannerHeight}
                        onChange={val => updateObject('socialQuery', 'headerBannerHeight', val)}
                        min={60}
                        max={400}
                        tip={__('How tall the strip is. The picture is cropped to fit, from the middle.', 'b-slider')}
                    />
                </>
            )}

            <TipToggle
                className={canHaveBanner ? gap : undefined}
                label={__('Show Profile Header', 'b-slider')}
                checked={!!showHeader}
                onChange={val => updateObject('socialQuery', 'showHeader', val)}
                tip={__('Display a profile header card above your feed slides.', 'b-slider')}
            />

            {/* Offered before the toggle is on, and turns it on — "fetch my profile" is the whole
                decision, and making somebody switch the card on first only to find the four fields
                still blank is two steps for one intention. */}
            {canFetch && (
                <div className={gap} style={{ marginTop: '10px' }}>
                    <Button
                        variant='secondary'
                        size='small'
                        disabled={profile.loading}
                        onClick={fillFromAccount}
                    >
                        {profile.loading
                            ? <><Spinner /> {__('Reading account…', 'b-slider')}</>
                            : fillButtonLabel(feedType)}
                    </Button>

                    {/**
                      * The way back out of a filled-in card.
                      *
                      * These four fields *override* the live account — see `profileAvatar` and
                      * `profileName` in Layout — so once they hold something, the card stops following
                      * the feed. That is the point of them, and it is also how a slider ends up showing
                      * one service's account over another's posts: fill them from an RSS publication,
                      * change the slider to Instagram, and the publication's name and picture stay.
                      * Switching service now clears them (see `handleFeedSelect`), but a slider already
                      * in that state needs a button, and emptying three fields and a picture by hand is
                      * not one.
                      *
                      * Only offered when there is something to clear, so it is not a dead control on a
                      * card nobody has touched.
                      */}
                    {(!!headerAvatar || !!headerName || !!headerBio || !!headerLink || !!headerBanner) && (
                        <Button
                            variant='link'
                            isDestructive
                            size='small'
                            style={{ marginTop: '6px' }}
                            onClick={() => setAttributes({
                                socialQuery: { ...socialQuery, headerAvatar: '', headerName: '', headerBio: '', headerLink: '', headerBanner: '' }
                            })}
                        >
                            {__('Clear these and follow the account again', 'b-slider')}
                        </Button>
                    )}

                    {!!profile.error && <p className='bsb_feed_note is-error'>{profile.error}</p>}
                </div>
            )}

            {!!showHeader && (
                <>
                    {isPro && (
                        <SelectControl
                            className={gap}
                            label={__('Header Style', 'b-slider')}
                            value={headerStyle}
                            options={[
                                { value: 'card', label: __('Card — tinted, with an accent edge', 'b-slider') },
                                { value: 'panel', label: __('Panel — plain, banner joined on top', 'b-slider') }
                            ]}
                            onChange={val => updateObject('socialQuery', 'headerStyle', val)}
                            help={'panel' === headerStyle
                                ? __('The banner and the account read as one block, the way a channel page does.', 'b-slider')
                                : undefined}
                        />
                    )}

                    {/* Only YouTube counts videos and lifetime views — see `readProfile` in each
                        reader. The toggle would be a switch for two numbers that are always 0. */}
                    {isPro && canHaveBanner && <ToggleControl
                        className={gap}
                        label={__('Show Channel Stats', 'b-slider')}
                        checked={!!showChannelStats}
                        onChange={val => updateObject('socialQuery', 'showChannelStats', val)}
                        help={__('Adds the video count and total views beside the subscriber count.', 'b-slider')}
                    />}

                    {!isPro && (
                        <ProNotice className='mt15' features={PRO_FEATURES.feedHeader} />
                    )}

                    <div className={gap} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <MediaUpload
                            onSelect={media => updateObject('socialQuery', 'headerAvatar', media.url)}
                            allowedTypes={['image']}
                            value={headerAvatar}
                            render={({ open }) => (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {/* The account's own value as the placeholder, because that is
                                        precisely what an empty field means now — see `liveAccount`. */}
                                    <TextControl
                                        label={__('Profile Avatar', 'b-slider')}
                                        value={headerAvatar}
                                        onChange={val => updateObject('socialQuery', 'headerAvatar', val)}
                                        placeholder={liveAccount.avatar || 'https://example.com/avatar.jpg'}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <Button variant="secondary" onClick={open} size="small">
                                            {__('Choose Image', 'b-slider')}
                                        </Button>
                                        {!!headerAvatar && (
                                            <Button variant="link" isDestructive onClick={() => updateObject('socialQuery', 'headerAvatar', '')} size="small">
                                                {__('Remove', 'b-slider')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </div>

                    <TextControl
                        className={gap}
                        label={__('Profile Name', 'b-slider')}
                        value={headerName}
                        onChange={val => updateObject('socialQuery', 'headerName', val)}
                        placeholder={liveAccount.name || __('e.g. My Brand', 'b-slider')}
                    />

                    <TextControl
                        className={gap}
                        label={__('Profile Bio', 'b-slider')}
                        value={headerBio}
                        onChange={val => updateObject('socialQuery', 'headerBio', val)}
                        placeholder={liveAccount.bio || __('e.g. Unleashing creativity', 'b-slider')}
                    />

                    {/* Offered only where the account reports one. Instagram gives `followers_count`
                        to a professional account and withholds it from a personal one, a YouTube
                        channel may hide its subscriber count outright, and an RSS feed has no such
                        number at all — and a switch that can only ever turn nothing on is worse
                        than no switch. */}
                    {isPro && liveAccount.followers > 0 && (
                        <TipToggle
                            className={gap}
                            label={'youtube' === feedType
                                ? __('Show Subscriber Count', 'b-slider')
                                : __('Show Follower Count', 'b-slider')}
                            checked={!!showFollowers}
                            onChange={val => updateObject('socialQuery', 'showFollowers', val)}
                            tip={__('Read from the account on each refresh, so it stays current.', 'b-slider')}
                        />
                    )}

                    <TextControl
                        className={gap}
                        label={__('Follow Button Label', 'b-slider')}
                        value={headerFollowText}
                        onChange={val => updateObject('socialQuery', 'headerFollowText', val)}
                        placeholder='Follow'
                    />
                </>
            )}

            {/* The second place the same account can be pointed at: a button under the slides, for
                somebody who has scrolled the whole feed and is at the moment most likely to act. It
                stands on its own — the header card can be off and this on, which is why the link
                below is not inside that toggle. */}
            <TipToggle
                className={gap}
                label={__('Show Follow Button Below Slider', 'b-slider')}
                checked={!!showFollowButton}
                onChange={val => updateObject('socialQuery', 'showFollowButton', val)}
                tip={__('Adds a single button under the last row of slides, linking to the account.', 'b-slider')}
            />

            {!!showFollowButton && (
                <>
                    <TipText
                        className={gap}
                        label={__('Button Label', 'b-slider')}
                        value={followButtonText}
                        onChange={val => updateObject('socialQuery', 'followButtonText', val)}
                        placeholder={defaultFollowLabel}
                        tip={__('Leave empty to use the label above, which follows the feed type.', 'b-slider')}
                    />

                    {isPro && (
                        <SelectControl
                            className={gap}
                            label={__('Button Alignment', 'b-slider')}
                            value={followButtonAlign}
                            options={[
                                { label: __('Left', 'b-slider'), value: 'left' },
                                { label: __('Center', 'b-slider'), value: 'center' },
                                { label: __('Right', 'b-slider'), value: 'right' }
                            ]}
                            onChange={val => updateObject('socialQuery', 'followButtonAlign', val)}
                        />
                    )}

                    {!isPro && (
                        <ProNotice className='mt15' features={PRO_FEATURES.feedFollowButton} />
                    )}
                </>
            )}

            {/* Last, and outside both toggles, because it belongs to neither on its own: the header
                card and the button under the slides point at the same account, so there is one
                address between them rather than two to keep in step. */}
            {needsLink && (
                <TipText
                    className={gap}
                    label={__('Profile Link (Follow URL)', 'b-slider')}
                    value={headerLink}
                    onChange={val => updateObject('socialQuery', 'headerLink', val)}
                    placeholder={liveAccount.link || profileLinkPlaceholder(feedType)}
                    tip={liveAccount.link
                        ? __('Left empty, the connected account’s own address is used.', 'b-slider')
                        : __('Without this there is nothing to follow, so the button is not drawn.', 'b-slider')}
                />
            )}
        </PanelBody>
    );
};

export default SocialHeaderSettings;

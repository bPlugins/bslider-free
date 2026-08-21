import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { TipSelect, TipRange, TipText } from '../../../Panel/TipField';
import { SelectControl, CheckboxControl } from '@wordpress/components';
import useYouTubeKey from '../../../../hooks/useYouTubeKey';
import useFeedChannels from '../../../../hooks/useFeedChannels';
import { isProActive } from '../../../../utils/functions';
import { Notice } from '../../../../../../bpl-tools/Components';

/**
 * Which of a channel's lists to read. Mirrors `YouTubeFeed::VIDEO_SETS`.
 *
 * Every one of these is a single playlist YouTube keeps for the channel, so picking one costs exactly
 * what picking any other does — see the note on that constant for what was measured. The order here
 * is the order somebody scans them in: the default first, the reason this control exists second.
 *
 * It sat in `SocialGeneral` under the channel picker until the order control was found to be quietly
 * undoing it. The two belong side by side: between them they are the whole answer to "what order do
 * the slides come in", and only one of them applies to any given feed.
 */
const videoSetOpt = [
    { label: __('Latest uploads', 'b-slider'), value: 'latest' },
    { label: __('Most viewed', 'b-slider'), value: 'popular' },
    // The three at the top are YouTube's own sort on a channel page — Latest, Popular, Oldest — in its
    // order. `needsKey` mirrors `YouTubeFeed::KEYED_SETS`: the public feed is fifteen entries with no
    // pagination of any kind, so with no key there is no way to reach a channel's oldest videos. It is
    // offered greyed out rather than hidden, because the reason is worth reading.
    { label: __('Oldest first', 'b-slider'), value: 'oldest', needsKey: true },
    { label: __('Latest, excluding Shorts', 'b-slider'), value: 'long' },
    { label: __('Shorts only', 'b-slider'), value: 'shorts' },
    // Not one of YouTube's lists — it reads the uploads and shuffles them, in
    // `SocialFeed::postProcessItems()`. It is here because it is an answer to the same question the
    // others answer, and because the order control — where a YouTube slider used to find Random —
    // no longer applies to this feed type.
    { label: __('Random', 'b-slider'), value: 'random' },
];

/* The panel's two jobs, in order: the first pair decides what set of slides there is, the four below
   take things out of that set. Neither is given a heading — the order the fields sit in is the whole
   of it, and each one says what it does on its own label. */

const SocialFiltering = ({ attributes, updateObject, premiumProps, setAttributes }) => {
    const { socialQuery } = attributes || {};
    const isPro = premiumProps?.isPremium ?? isProActive();

    useEffect(() => {
        if (!isPro) {
            let needsUpdate = false;
            const updatedQuery = { ...(socialQuery || {}) };

            if (socialQuery?.feedAgeLimit !== 0) {
                updatedQuery.feedAgeLimit = 0;
                needsUpdate = true;
            }

            if (socialQuery?.keywordFilter && socialQuery.keywordFilter !== '') {
                updatedQuery.keywordFilter = '';
                needsUpdate = true;
            }

            if (socialQuery?.excludeKeywordFilter && socialQuery.excludeKeywordFilter !== '') {
                updatedQuery.excludeKeywordFilter = '';
                needsUpdate = true;
            }

            if (needsUpdate) {
                setAttributes({
                    socialQuery: updatedQuery
                });
            }
        }
    }, [isPro, socialQuery?.feedAgeLimit, socialQuery?.keywordFilter, socialQuery?.excludeKeywordFilter]);
    const {
        per_page = 12,
        keywordFilter = '',
        excludeKeywordFilter = '',
        feedOrderBy = 'date_desc',
        feedOffset = 0,
        feedAgeLimit = 0,
        feedType = 'youtube',
        videoSet = 'latest',
        ytQueryType = 'channel',
        igAllowImage = true,
        igAllowAlbum = true,
        igAllowVideo = true,
        ytPrivacyStatus = 'all',
        channelId = '',
        source = ''
    } = socialQuery || {};

    const library = useFeedChannels();
    const normalize = str => (str || '').trim().toLowerCase().replace(/^@/, '');
    const currentChannel = library.channels?.find(ch => 
        (channelId && ch.id === channelId) || 
        (source && normalize(ch.source) === normalize(source))
    );
    const hasToken = !!currentChannel?.hasYtRefreshToken || !!currentChannel?.ytRefreshToken;

    const apiKey = useYouTubeKey();

    if (feedType === 'youtube_video') {
        return null;
    }

    /**
     * The ceiling this feed type answers to — the editor's copy of `SocialFeed::maxItems()`.
     *
     * YouTube is the only one that has to ask, because its ceiling depends on whether the site holds a
     * Data API key. The rest are fixed, so they are written here rather than fetched.
     *
     * **Only RSS used to be listed, and everything else fell through to the YouTube key's number.** A
     * JSON or Instagram slider was therefore capped at 15 on a site with no key — while the help text
     * beside the slider said "up to 100", and the server would have served 100. The slider is what the
     * user can actually reach, so that was the real limit, and it was the wrong one.
     */
    const FEED_MAX_ITEMS = { rss: 100, json: 100, instagram: 500 };
    const maxItems = 'youtube' === feedType ? apiKey.maxItems : (FEED_MAX_ITEMS[feedType] || 100);
    const gap = 'mt15';

    const isFiltered = !!keywordFilter.trim() || !!excludeKeywordFilter.trim() || feedOffset > 0 || feedAgeLimit > 0;

    const getLabels = (type) => {
        switch (type) {
            case 'youtube':
                return {
                    skipLabel: __('Videos to skip', 'b-slider'),
                    includeLabel: __('Only show videos with these words', 'b-slider'),
                    excludeLabel: __('Hide videos with these words', 'b-slider'),
                    // Not "of the feed": it counts from the top of the list the fields above have
                    // finished building, keywords and timeframe already applied.
                    skipHelp: __('Number of videos to drop from the front of the list, after the filters above.', 'b-slider'),
                    showHelp: __('Only display videos published within the selected timeframe.', 'b-slider'),
                    includeHelp: __('Only show videos containing these keywords in their title or content. Separate with commas.', 'b-slider'),
                    excludeHelp: __('Hide videos containing these keywords in their title or content. Separate with commas.', 'b-slider')
                };
            case 'instagram':
                return {
                    skipLabel: __('Posts to skip', 'b-slider'),
                    includeLabel: __('Only show posts with these words', 'b-slider'),
                    excludeLabel: __('Hide posts with these words', 'b-slider'),
                    skipHelp: __('Number of posts to drop from the front of the list, after the filters above.', 'b-slider'),
                    showHelp: __('Only display posts published within the selected timeframe.', 'b-slider'),
                    includeHelp: __('Only show posts containing these keywords in their title or content. Separate with commas.', 'b-slider'),
                    excludeHelp: __('Hide posts containing these keywords in their title or content. Separate with commas.', 'b-slider')
                };
            case 'rss':
            case 'json':
            default:
                return {
                    skipLabel: __('Items to skip', 'b-slider'),
                    includeLabel: __('Only show items with these words', 'b-slider'),
                    excludeLabel: __('Hide items with these words', 'b-slider'),
                    skipHelp: __('Number of items to drop from the front of the list, after the filters above.', 'b-slider'),
                    showHelp: __('Only display items published within the selected timeframe.', 'b-slider'),
                    includeHelp: __('Only show items containing these keywords in their title or content. Separate with commas.', 'b-slider'),
                    excludeHelp: __('Hide items containing these keywords in their title or content. Separate with commas.', 'b-slider')
                };
        }
    };

    const labels = getLabels(feedType);

    return (
        <PanelBody
            className='bPlPanelBody bsb_social_filtering_panel'
            title={<span className="bsb_feed_panel_title" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                <span>{(feedType === 'rss' || feedType === 'json') ? __('Feed Filtering', 'b-slider') : __('Social Filtering', 'b-slider')}</span>
                <span className='bsbPanelBadge' aria-hidden='true'>{__('New', 'b-slider')}</span>
                {isFiltered && <span className='bsb_status_badge is-ok'>{__('Active', 'b-slider')}</span>}
            </span>}
            initialOpen={false}
        >
            {/**
              * The order the slides come out in — one control for it, chosen by feed type.
              *
              * A YouTube channel gets "Which videos to show" and nothing else. It is not a filter but a
              * choice of list: Most viewed and Oldest first each arrive already in an order, and
              * YouTube is the only service that offers that. The order control used to sit here as well
              * and quietly won — a slider set to Most viewed was re-sorted by date on its way to
              * the page, and showed the newest video at the front with no indication why. Two
              * controls answering one question, with the loser invisible.
              *
              * Every other feed type is the other way round: the service hands over one list and
              * "What order they come in" is the only say there is over it. So it stays, and Random with it.
              * `SocialFeed::postProcessItems()` is written to match, and has to be — hiding a
              * control does not clear the value a slider already saved.
              */}
            {'youtube' === feedType ? <>
                {ytQueryType === 'channel' && (
                    <TipSelect
                        className={gap}
                        label={__('Which videos to show', 'b-slider')}
                        value={videoSet}
                        options={videoSetOpt.map(({ label, value, needsKey }) => ({
                            label,
                            value,
                            disabled: !!needsKey && !apiKey.hasKey
                        }))}
                        onChange={val => updateObject('socialQuery', 'videoSet', val)}
                        tip={__('The channel’s own lists — its newest uploads, its most watched, or only its Shorts.', 'b-slider')}
                    />
                )}

                {ytQueryType === 'channel' && !apiKey.hasKey && 'oldest' !== videoSet && (
                    <p className='bsb_feed_note'>
                        {__('“Oldest first” needs an API key — add one under Feed Settings → Connection. The public feed only ever returns a channel’s 15 most recent videos.', 'b-slider')}
                    </p>
                )}
            </> : <SelectControl
                className={gap}
                label={__('What order they come in', 'b-slider')}
                value={feedOrderBy}
                options={[
                    { label: __('Newest First', 'b-slider'), value: 'date_desc' },
                    { label: __('Oldest First', 'b-slider'), value: 'date_asc' },
                    { label: __('Random', 'b-slider'), value: 'random' },
                ]}
                onChange={val => updateObject('socialQuery', 'feedOrderBy', val)}
            />}

            {feedType !== 'youtube_video' && (
                <TipRange
                    className={gap}
                    label={(feedType === 'rss' || feedType === 'json' || feedType === 'instagram') ? __('How many slides', 'b-slider') : __('How many videos', 'b-slider')}
                    value={per_page}
                    onChange={val => updateObject('socialQuery', 'per_page', val)}
                    min={1}
                    max={maxItems}
                    tip={(feedType === 'rss' || feedType === 'json' || feedType === 'instagram')
                        ? sprintf(
                            /* translators: %d: the maximum number of slides this feed type can load */
                            __('Up to %d slides loaded from the feed.', 'b-slider'),
                            maxItems
                        )
                        : apiKey.hasKey
                            ? sprintf(
                                /* translators: %d: the maximum number of videos the API returns in one page */
                                __('Up to %d videos, read through the API key set in the Connection settings.', 'b-slider'),
                                maxItems
                            )
                            : sprintf(
                                /* translators: %d: the number of videos a public channel feed carries */
                                __('A channel’s public feed carries its %d most recent videos. Add an API key in the Connection settings for more.', 'b-slider'),
                                maxItems
                            )}
                />
            )}
            {/* "Use Custom Video Player Interface (Plyr)" stood here and has moved to the Player panel.
                It filtered nothing: every other control in this panel decides which videos reach the
                slider, and that one decides what a click on one of them opens — and, through
                `PlayerGeneral`, whether the four Plyr panels or the single native one are the ones on
                screen. A switch that puts four panels up or takes them down belongs beside the panels
                it governs, not a panel away from them. See `PlayerGeneral`, which now carries it in
                both of its branches. */}

            {/* Moved from Feed Settings' address step, where it sat beside the account picker asking
                a question that step never answers. `InstagramFeed::items()` takes these three exactly
                as it takes keywords or an age limit — as a filter on what is fetched — so this is
                where they belong: with the rest of what decides which of an account's posts reach the
                slider. */}
            {feedType === 'instagram' && (
                <div className={gap}>
                    <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px', color: '#1e293b' }}>
                        {__('Allowed Media Types', 'b-slider')}
                    </div>
                    <div className="bsb_choice_row">
                        <CheckboxControl
                            label={__('Images', 'b-slider')}
                            checked={igAllowImage}
                            onChange={val => updateObject('socialQuery', 'igAllowImage', val)}
                        />
                        <CheckboxControl
                            label={__('Albums', 'b-slider')}
                            checked={igAllowAlbum}
                            onChange={val => updateObject('socialQuery', 'igAllowAlbum', val)}
                        />
                        <CheckboxControl
                            label={__('Videos', 'b-slider')}
                            checked={igAllowVideo}
                            onChange={val => updateObject('socialQuery', 'igAllowVideo', val)}
                        />
                    </div>
                </div>
            )}

            {isPro && feedType === 'youtube' && ytQueryType === 'channel' && hasToken && (
                <TipSelect
                    className={gap}
                    label={__('Privacy Status Filter', 'b-slider')}
                    value={ytPrivacyStatus}
                    options={[
                        { label: __('All Videos', 'b-slider'), value: 'all' },
                        { label: __('Public Only', 'b-slider'), value: 'public' },
                        { label: __('Unlisted Only', 'b-slider'), value: 'unlisted' },
                        { label: __('Private Only', 'b-slider'), value: 'private' },
                    ]}
                    onChange={val => updateObject('socialQuery', 'ytPrivacyStatus', val)}
                    tip={__('Filter videos by their privacy status. Unlisted and Private videos require a saved YouTube Refresh Token.', 'b-slider')}
                />
            )}


            {isPro && feedType !== 'json' && (
                <TipSelect
                    className={gap}
                    label={__('How recent', 'b-slider')}
                    value={feedAgeLimit}
                    options={[
                        { label: __('Anytime', 'b-slider'), value: 0 },
                        { label: __('Last 24 Hours', 'b-slider'), value: 1 },
                        { label: __('Last 3 Days', 'b-slider'), value: 3 },
                        { label: __('Last 7 Days', 'b-slider'), value: 7 },
                        { label: __('Last 30 Days', 'b-slider'), value: 30 },
                    ]}
                    onChange={val => updateObject('socialQuery', 'feedAgeLimit', parseInt(val, 10))}
                    tip={labels.showHelp}
                />
            )}

            {/* Auto Timezone Conversion, Timezone Offset, Translate Date & Time, Date Format and
                Custom Date Format stood here and have moved to their own `SocialDateTime` panel. None
                of the five narrowed which items reach the slider — everything else in this panel does
                — they decided how an already-chosen item's date is written, which is a separate
                question asked in a separate place now. See that file for why it could not simply move
                into Social Badges' Publish Date section instead. */}

            {isPro && (
                <>
                    <TipText
                        className={gap}
                        label={labels.includeLabel}
                        placeholder={__('e.g. news, sports, tech', 'b-slider')}
                        value={keywordFilter}
                        onChange={val => updateObject('socialQuery', 'keywordFilter', val)}
                        tip={labels.includeHelp}
                    />

                    <TipText
                        className={gap}
                        label={labels.excludeLabel}
                        placeholder={__('e.g. ad, sponsored, promo', 'b-slider')}
                        value={excludeKeywordFilter}
                        onChange={val => updateObject('socialQuery', 'excludeKeywordFilter', val)}
                        tip={labels.excludeHelp}
                    />
                </>
            )}

            {/* Last, because it is the last thing the server does — see `postProcessItems()`. It
                counts from the top of the list every control above has finished building, so it can
                only be understood after them. It read as "skip the first few videos of the channel"
                while it sat above the keyword fields, which is not what it does. */}
            <TipRange
                className={gap}
                label={labels.skipLabel}
                value={feedOffset}
                onChange={val => updateObject('socialQuery', 'feedOffset', val)}
                min={0}
                max={50}
                step={1}
                tip={labels.skipHelp}
            />

            {!isPro && (
                <>
                    {feedType === 'youtube' && ytQueryType === 'channel' && (
                        <Notice className="mt20" status="premium" isIcon={true}>
                            {__('Privacy Status Filter, How recent (timeframe filter), and Keyword Filters (Include/Exclude) are available in the Premium version.', 'b-slider')}
                        </Notice>
                    )}
                    {feedType !== 'youtube' && feedType !== 'json' && (
                        <Notice className="mt20" status="premium" isIcon={true}>
                            {__('How recent (timeframe filter) and Keyword Filters (Include/Exclude) are available in the Premium version.', 'b-slider')}
                        </Notice>
                    )}
                    {feedType === 'json' && (
                        <Notice className="mt20" status="premium" isIcon={true}>
                            {__('Keyword Filters (Include/Exclude) are available in the Premium version.', 'b-slider')}
                        </Notice>
                    )}
                </>
            )}
        </PanelBody>
    );
};

export default SocialFiltering;

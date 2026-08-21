import { __, sprintf, _n } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { Button, Spinner, TextControl } from '@wordpress/components';
import { AccordionGroup, PanelBody } from '../../../Panel/AccordionPanel';
import { TipSelect, TipText } from '../../../Panel/TipField';
import { feedItem } from '../../Source/source-json-item';
import { adminUrl } from '../../../../utils/functions';
import { Notice } from '../../../../../../bpl-tools/Components';
import PremiumPanel from '../../../../../../bpl-tools/ProControls/PremiumPanel';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';
import useYouTubeKey from '../../../../hooks/useYouTubeKey';
import useFeedChannels from '../../../../hooks/useFeedChannels';

/* "Which videos to show" used to stand here, between the channel picker and the status line. It is in
   `SocialFiltering` now, beside "What order they come in" — the one other control that decides what order a feed
   comes out in. Keeping them apart was what let them disagree without anyone seeing it. */

/**
 * One numbered step of the panel.
 *
 * This used to be a `<Label>`, and only four of the panel's six groups had one — the address, the
 * single group that decides whether anything renders at all, was among the unmarked. `<Label>` also
 * could not carry the hierarchy: in this panel a field's own label renders with the same weight and
 * the same trailing rule, so "SEO" and "Description Length" looked like peers.
 *
 * The numbers are the point. They say what to do first without a sentence explaining it.
 */
const Step = ({ title, note }) => <div className='bsb_feed_section'>
    <span className='bsb_feed_step_title'>{title}</span>
    {!!note && <span className='bsb_feed_step_note'>{note}</span>}
</div>;

/**
 * The same numbered step, worn as a nested panel's heading.
 *
 * Steps 2 to 5 are panels rather than headings now — five sections of fields in one panel made the
 * sidebar a very long scroll, and four of the five are things you set once and never open again.
 *
 * The number stays because it is doing the same job it did as a heading: it says what to do first
 * without a sentence explaining it. What it does not reuse is `.bsb_feed_step_title` — a panel's own
 * title type and its open/closed colour belong to the panel, and a second set of type rules inside the
 * heading would fight them.
 */
const stepTitle = (title, badge = null) => <span className='bsb_feed_panel_title' style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
    <span>{title}</span>
    {badge}
</span>;

/**
 * The Connection panel, by name.
 *
 * Named because something outside it opens it: the note under `Which videos to show` explains that a set needs
 * an API key, and with the panel closed that note pointed at a drawer the reader then had to find. See
 * `AccordionGroup` for why opening by name has to go through the group.
 */
const CONNECTION_PANEL = 'feed-connection';

/**
 * Everything a feed slider is configured by.
 *
 * The address is the one setting that decides whether anything renders at all, so the panel also
 * carries the fetch's own state: what the server said when it last tried, how many items came back,
 * and a way to ask again without waiting for the cache to lapse.
 *
 * Ordered by what has to be true before the next thing matters: an address, then the connection that
 * reads it reliably, then what each slide shows, then the two things a working slider can do without
 * — a local copy and structured data. The API key sits in step 2 rather than at the bottom because
 * YouTube rate-limits the public feed: the fix for a failure in step 1 should not be five sections
 * further down.
 */
const SocialGeneral = ({ attributes, setAttributes, updateObject, socialFeed }) => {
    const { socialQuery } = attributes;
    // What each slide shows, whether it is stored, and the profile header all read their own
    // settings in their own panels now — this one is the address, the connection and the schema.
    const { feedType = 'youtube', channelId = '', source = '', jsonRootKey = '', jsonImageKey = '', jsonTitleKey = '', jsonLinkKey = '', jsonExcerptKey = '', jsonButtonTextKey = '', jsonDateKey = '', jsonAuthorKey = '', ytQueryType = 'channel', ytSearchTerm = '' } = socialQuery || {};
    const { items, error, loading, refresh } = socialFeed || {};

    const apiKey = useYouTubeKey();
    const library = useFeedChannels();

    // Adding from here saves to the site's library and points this slider at the entry, so the same
    // channel is never typed twice and the dashboard shows it immediately.
    const [isAdding, setIsAdding] = useState(false);
    const [draft, setDraft] = useState({ label: '', source: '', ytRefreshToken: '' });
    const [justSaved, setJustSaved] = useState('');
    const [customLabel, setCustomLabel] = useState('');
    const isCustom = !channelId;

    /**
     * Hold the Premium-only feed settings at their free values.
     *
     * The server already refuses them — `SocialFeed::cacheTtl()` ignores a saved window without a
     * licence, and `YouTubeFeed::items()` forces the query back to a plain channel read. This is the
     * editor saying so, rather than leaving a block carrying settings that quietly do nothing.
     *
     * A block built on a licensed site and opened here is the case that matters: it arrives with a
     * search query and a two-hour cache, and without this it would look like it still had them.
     */
    useEffect(() => {
        let needsUpdate = false;
        const updatedQuery = { ...(socialQuery || {}) };

        if (socialQuery?.ytQueryType && socialQuery.ytQueryType !== 'channel') {
            updatedQuery.ytQueryType = 'channel';
            updatedQuery.source = '';
            needsUpdate = true;
        }

        if (socialQuery?.cacheTime && socialQuery.cacheTime !== 21600) {
            updatedQuery.cacheTime = 21600;
            needsUpdate = true;
        }

        if (socialQuery?.seoSchema && socialQuery.seoSchema !== 'off') {
            updatedQuery.seoSchema = 'off';
            needsUpdate = true;
        }

        if (needsUpdate) {
            setAttributes({ socialQuery: updatedQuery });
        }
    }, [socialQuery?.ytQueryType, socialQuery?.cacheTime, socialQuery?.seoSchema]);

    /**
     * Whether this service's address may live on the slider itself.
     *
     * Instagram's "address" is an access token, and a slider's own address is a block attribute —
     * saved into post content and printed into the page for the browser to read. A saved account
     * keeps the token in an option instead, where only the server ever sees it, so for Instagram
     * that is the only way offered. See the note in render.php.
     */
    const allowsCustom = 'instagram' !== feedType;
    const showCustom = isCustom && allowsCustom;

    const filteredChannels = library.channels.filter(channel => channel.feedType === feedType);
    const picked = library.channels.find(channel => channel.id === channelId) || null;
    const hasAddress =ytQueryType === 'search' && feedType === 'youtube' ? !!ytSearchTerm.trim() : (!!(channelId || '').trim() || !!(source || '').trim());

    const addChannel = () => library
        .save({ 
            label: draft.label.trim(), 
            feedType, 
            source: draft.source.trim(),
            ...(feedType === 'youtube' ? { ytRefreshToken: (draft.ytRefreshToken || '').trim() } : {})
        })
        .then(saved => {
            if (saved) {
                setDraft({ label: '', source: '', ytRefreshToken: '' });
                setIsAdding(false);
                // Saved to the library and nothing more. Pointing this slider at it is a separate
                // decision, and making it happen as a side effect of "add" meant the dropdown changed
                // what the slider showed without anybody choosing it.
                setJustSaved(saved.label || saved.source);
            }
        });
    // The import's own state moved out with the panel that shows it — see SocialStore, which runs
    // `useFeedMedia` for itself. A second copy here drove a second import poll for nothing.
    const [keyInput, setKeyInput] = useState('');
    const [isKeyOpen, setIsKeyOpen] = useState(false);

    /* The sections below used to be openable from outside themselves, by way of an `open` object held
       here. Nothing asks anymore: the one caller was the "Open Connection" link under "Which videos to show",
       and that control now lives in `SocialFiltering`, a panel away. Reaching across two sidebar
       panels is not something `AccordionGroup` can do — it opens a panel within its own group — so
       the note went with the control and points at Connection settings in words instead. */

    const feed = feedItem.find(item => item.feedType === feedType);


    /**
     * The gap every control after the first in its step carries.
     *
     * `.bPlPanelBody` zeroes the margin WordPress's controls ship with, on the understanding that each
     * field brings its own — see the note beside that rule in editor.scss. This panel never did, so
     * How many videos, Thumbnail Quality and Description Length sat flush against each other with
     * no gap at all. Named once here so the whole panel keeps one beat.
     */
    const gap = 'mt15';



    const saveKey = key => apiKey.save(key).then(saved => {
        if (saved) {
            setKeyInput('');
            setIsKeyOpen(false);
            // The ceiling and the video count both change with the key, and every cached feed was
            // just retired server-side — so the preview has to be asked again.
            refresh?.();
        }
    });

    return <>
        <PanelBody className='bPlPanelBody' panelId='feed-settings' title={__('Feed Settings', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={true}>
        <Step title={__('Source', 'b-slider')} note={__('Required', 'b-slider')} />



        {feedType === 'youtube_video' ? (
            <TipText
                className={gap}
                label={__('YouTube Video URL', 'b-slider')}
                value={source}
                placeholder='https://www.youtube.com/watch?v=...'
                onChange={val => {
                    setAttributes({
                        socialQuery: {
                            ...(attributes.socialQuery || {}),
                            channelId: '',
                            source: val
                        }
                    });
                }}
                tip={__('Enter a YouTube video URL. Used by this slider only.', 'b-slider')}
            />
        ) : (
            <>

                {feedType === 'youtube' && ytQueryType === 'search' ? (
                    <TipText
                        className={gap}
                        label={__('YouTube Search Term', 'b-slider')}
                        value={ytSearchTerm}
                        placeholder={__('e.g. WordPress, Music, Tech', 'b-slider')}
                        onChange={val => {
                            setAttributes({
                                socialQuery: {
                                    ...(attributes.socialQuery || {}),
                                    ytSearchTerm: val,
                                    source: val
                                }
                            });
                        }}
                        tip={__('Search YouTube for videos matching this term.', 'b-slider')}
                    />
                ) : (
                    <>
                        {/* The library first, because a site with saved channels should be picking rather than
                            typing. `__custom__` keeps the old behaviour available for a one-off address. */}
                        <TipSelect
                            label={feedType === 'rss' ? __('Feed', 'b-slider') : (feedType === 'json' ? __('JSON Feed', 'b-slider') : feedType === 'instagram' ? __('Instagram Account', 'b-slider') : __('Channel', 'b-slider'))}
                            // `''` is "nothing chosen yet", which is where a new slider starts. A slider saved before
                            // the library existed carries an address and no id, so it opens on the one-off option.
                            value={channelId || (showCustom ? '__custom__' : '')}
                            options={[
                                { value: '', label: feedType === 'rss' ? __('— Select a feed —', 'b-slider') : (feedType === 'json' ? __('— Select a JSON feed —', 'b-slider') : feedType === 'instagram' ? __('— Select an Instagram Account —', 'b-slider') : __('— Select a channel —', 'b-slider')) },
                                ...filteredChannels.map(channel => ({ value: channel.id, label: channel.label })),
                                // Instagram has no one-off option: its address is a credential. See `allowsCustom`.
                                ...(allowsCustom ? [{ value: '__custom__', label: feedType === 'rss' ? __('Use a one-off feed URL', 'b-slider') : (feedType === 'json' ? __('Use a one-off JSON URL', 'b-slider') : __('Use a one-off address', 'b-slider')) }] : [])
                            ]}
                            onChange={val => {
                                setJustSaved('');

                                if ('__custom__' === val) {
                                    // Back to an address of this slider's own; the field below appears for it.
                                    setAttributes({
                                        socialQuery: {
                                            ...(attributes.socialQuery || {}),
                                            channelId: ''
                                        }
                                    });

                                    return;
                                }

                                // A saved channel owns the address, so the slider's own copy is cleared — left
                                // behind it would stay in the cache key and in `FeedStore`'s reach after the switch.
                                setAttributes({
                                    socialQuery: {
                                        ...(attributes.socialQuery || {}),
                                        source: '',
                                        channelId: val
                                    }
                                });
                            }}
                            /* "Nothing saved yet" is also what an unanswered request looks like — the list is
                               empty either way — so while it is out the hint says which of the two this is.
                               Without that it announced an empty library and then corrected itself. */
                            tip={library.loading
                                ? __('Reading the site’s saved list…', 'b-slider')
                                : filteredChannels.length
                                    ? (feedType === 'rss' || feedType === 'json'
                                        ? __('Saved feeds are shared by every slider on the site — edit one in Settings and they all follow.', 'b-slider')
                                        : __('Saved channels are shared by every slider on the site — edit one in Settings and they all follow.', 'b-slider'))
                                    : __('Nothing saved yet. Add one below, or under bSlider in the toolbar.', 'b-slider')}
                        />

                        {/* Privacy Status Filter used to stand here as well as in `SocialFiltering`, and
                            both copies rendered: same control, same `ytPrivacyStatus`, and the same
                            condition down to the token check. Whichever one somebody moved, the other
                            sat above or below it showing the old value until the panel re-rendered.

                            It is a filter — "which of this channel's videos reach the slider" — so the
                            one in `SocialFiltering` is the one kept, beside the count and the keywords
                            that narrow the same list. This is the address panel, and an address does not
                            depend on it. */}

                        {/* Added, but deliberately not selected. Says so, and where to go next. */}
                        {!!justSaved && <p className='bsb_feed_note is-ok'>
                            {sprintf(
                                /* translators: %s: the channel's name */
                                feedType === 'rss'
                                    ? __('“%s” saved to the site. Pick it in Feed above to use it here.', 'b-slider')
                                    : (feedType === 'json'
                                        ? __('“%s” saved to the site. Pick it in JSON Feed above to use it here.', 'b-slider')
                                        : feedType === 'instagram'
                                            ? __('“%s” saved to the site. Pick it in Instagram Account above to use it here.', 'b-slider')
                                            : __('“%s” saved to the site. Pick it in Channel above to use it here.', 'b-slider')),
                                justSaved
                            )}
                        </p>}

                        {/* An account's address is its token, so the note says one is held rather than
                            printing a piece of it — the panel opens for anyone who may edit a post. */}
                        {!!picked && <p className='bsb_feed_note'>
                            {picked.feedType === 'instagram'
                                ? <em>{__('Connected — the access token is kept on the site, not in this slider.', 'b-slider')}</em>
                                : <code>{picked.source}</code>}
                        </p>}

                        {/* "Allowed Media Types" stood here and has moved to Social Filtering. It picks
                            which of an account's posts are fetched at all — `InstagramFeed::items()`
                            takes the three as filters, the same as keywords or an age limit do — which
                            is a question this step, about the account's own address, was never asking. */}

                        {showCustom && (
                            <>
                                <TextControl
                                    label={feedType === 'rss' ? __('Feed Name', 'b-slider') : (feedType === 'json' ? __('JSON Name', 'b-slider') : __('Channel Name', 'b-slider'))}
                                    value={customLabel}
                                    placeholder={feedType === 'rss' ? __('e.g. Our blog feed', 'b-slider') : (feedType === 'json' ? __('e.g. JSON endpoint', 'b-slider') : __('e.g. Our tutorials', 'b-slider'))}
                                    onChange={setCustomLabel}
                                    help={__('Optional. Enter a name if you want to save this source to the site.', 'b-slider')}
                                />

                                <TipText
                                    className={gap}
                                    label={feedType === 'rss' ? __('RSS Feed URL', 'b-slider') : (feedType === 'json' ? __('JSON Endpoint URL', 'b-slider') : __('Channel URL, @handle or ID', 'b-slider'))}
                                    value={source}
                                    placeholder={feedType === 'rss' ? 'https://example.com/feed/' : (feedType === 'json' ? 'https://example.com/api.json' : 'https://www.youtube.com/@handle')}
                                    onChange={val => updateObject('socialQuery', 'source', val)}
                                    tip={feedType === 'rss' ? __('A valid RSS or Atom feed URL. Used by this slider only.', 'b-slider') : (feedType === 'json' ? __('A valid JSON endpoint URL. Used by this slider only.', 'b-slider') : __('A channel URL, its @handle, its UC… ID, or a playlist URL. Used by this slider only.', 'b-slider'))}
                                />

                                {!!source.trim() && (
                                    <div className='bsb_feed_actions' style={{ marginTop: '8px' }}>
                                        <Button
                                            variant='secondary'
                                            size='small'
                                            disabled={library.saving}
                                            onClick={() => {
                                                library.save({
                                                    label: (customLabel.trim() || source.trim()),
                                                    feedType,
                                                    source: source.trim()
                                                }).then(saved => {
                                                    if (saved) {
                                                        setCustomLabel('');
                                                        setAttributes({
                                                            socialQuery: {
                                                                ...(attributes.socialQuery || {}),
                                                                channelId: saved.id,
                                                                source: ''
                                                            }
                                                        });
                                                    }
                                                });
                                            }}
                                        >
                                            {library.saving ? __('Saving…', 'b-slider') : (feedType === 'rss' ? __('Save & Load Feed', 'b-slider') : (feedType === 'json' ? __('Save & Load JSON', 'b-slider') : __('Save & Load Channel', 'b-slider')))}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {feedType === 'youtube' && ytQueryType === 'channel' && apiKey.hasKey && (
                            <>



                            </>
                        )}

                        {isAdding ? <div className='bsb_channel_add'>
                            <TextControl
                                label={__('Name', 'b-slider')}
                                value={draft.label}
                                placeholder={feedType === 'rss' ? __('e.g. Our blog feed', 'b-slider') : (feedType === 'json' ? __('e.g. JSON endpoint', 'b-slider') : feedType === 'instagram' ? __('e.g. @username', 'b-slider') : __('e.g. Our tutorials', 'b-slider'))}
                                onChange={val => setDraft({ ...draft, label: val })}
                            />

                            <TextControl
                                className={gap}
                                label={feedType === 'rss' ? __('RSS Feed URL', 'b-slider') : (feedType === 'json' ? __('JSON Endpoint URL', 'b-slider') : feedType === 'instagram' ? __('Instagram Access Token', 'b-slider') : __('Channel URL, @handle or ID', 'b-slider'))}
                                value={draft.source}
                                placeholder={feedType === 'rss' ? 'https://example.com/feed/' : (feedType === 'json' ? 'https://example.com/api.json' : feedType === 'instagram' ? __('Paste Access Token here', 'b-slider') : 'https://www.youtube.com/@handle')}
                                onChange={val => setDraft({ ...draft, source: val })}
                            />

                            {feedType === 'youtube' && (
                                <TextControl
                                    className={gap}
                                    label={__('YouTube Refresh Token (Optional for Private Videos)', 'b-slider')}
                                    value={draft.ytRefreshToken || ''}
                                    placeholder={__('Enter Refresh Token', 'b-slider')}
                                    onChange={val => setDraft({ ...draft, ytRefreshToken: val })}
                                />
                            )}

                            {!!library.error && <p className='bsb_feed_note is-error'>{library.error}</p>}

                            <div className='bsb_feed_actions'>
                                <Button variant='primary' size='small' disabled={library.saving || !draft.source.trim()} onClick={addChannel}>
                                    {library.saving ? __('Saving…', 'b-slider') : feedType === 'rss' ? __('Save feed', 'b-slider') : (feedType === 'json' ? __('Save JSON feed', 'b-slider') : feedType === 'instagram' ? __('Save Account', 'b-slider') : __('Save channel', 'b-slider'))}
                                </Button>

                                <Button variant='tertiary' size='small' disabled={library.saving} onClick={() => { setDraft({ label: '', source: '', ytRefreshToken: '' }); setIsAdding(false); }}>
                                    {__('Cancel', 'b-slider')}
                                </Button>
                            </div>
                        </div> : <div className='bsb_feed_actions'>
                            <Button variant='secondary' size='small' onClick={() => setIsAdding(true)}>
                                {feedType === 'rss' ? __('+ Add a feed', 'b-slider') : (feedType === 'json' ? __('+ Add a JSON feed', 'b-slider') : feedType === 'instagram' ? __('+ Add Instagram Account', 'b-slider') : __('+ Add a channel', 'b-slider'))}
                            </Button>
                        </div>}
                    </>
                )}
            </>
        )}

        {/* What the last fetch did. `loading` alone is not enough: an address that resolves to
            nothing and one that has not been typed yet both show no slides, and only this says
            which. */}
        <div className='bsb_feed_status'>
            {loading ? <span className='is-loading'><Spinner /> {__('Reading the feed…', 'b-slider')}</span>
                : error ? <span className='is-error'>{error}</span>
                    : items?.length ? <span className='is-ok'>{sprintf(
                        /* translators: %d: number of items/videos loaded from the feed */
                        (feedType === 'rss' || feedType === 'json')
                            ? _n('%d item loaded', '%d items loaded', items.length, 'b-slider')
                            : _n('%d video loaded', '%d videos loaded', items.length, 'b-slider'),
                        items.length
                    )}</span>
                        : source ? <span className='is-muted'>{__('Nothing came back from that feed.', 'b-slider')}</span>
                            : <span className='is-muted'>{(feedType === 'rss' || feedType === 'json') ? __('Add a feed URL above to load slides.', 'b-slider') : __('Add an address above to load videos.', 'b-slider')}</span>}

            {hasAddress && !loading && <Button variant='secondary' size='small' onClick={refresh}>
                {__('Refresh', 'b-slider')}
            </Button>}
        </div>

        {/* Everything past the address, in panels. Step 1 stays out here: it is the one group that
            decides whether anything renders at all, and the status line above reports on it, so neither
            is ever behind a click. */}
        <div className='bsb_feed_sections'>
            {/* A group of its own. Sharing the sidebar's would mean opening a section here closes the
                Feed Settings panel it lives in, taking itself off the screen with it — see the note on
                `AccordionGroup`. */}
            <AccordionGroup>
                {/* Second, not last. The key is a site setting rather than part of this slider — it is
                    saved through its own route and never written into the block, see
                    SocialFeed::apiKey() — but it is what makes step 1 dependable, and its own note says
                    why: YouTube answers 404 to public-feed requests it could serve. Somebody whose
                    address will not load needs this within reach of the thing that failed. */}
                {feedType !== 'youtube_video' && (
                    <PanelBody
                        className='bPlPanelBody bsb_feed_panel'
                        panelId={CONNECTION_PANEL}
                        /* Named for what is actually in it, which is only YouTube's two: the API key and
                           the thumbnail quality it unlocks. Every other feed type is left with Feed Cache
                           Time alone, and Instagram was being handed a step called Connection holding
                           nothing that connects to anything — its token is the address, typed in the step
                           above, and the key block below is `feedType === 'youtube'` throughout. */
                        title={stepTitle(
                            'youtube' === feedType ? __('Connection', 'b-slider') : __('Cache Settings', 'b-slider'),
                            (feedType === 'youtube' && !apiKey.loading) ? (
                                apiKey.hasKey ? <span className='bsb_status_badge is-ok'>{__('Connected', 'b-slider')}</span> : <span className='bsb_status_badge is-muted'>{__('Public Feed', 'b-slider')}</span>
                            ) : null
                        )}
                        initialOpen={false}
                        {...(feedType !== 'youtube' ? { badge: <PremiumBadge /> } : {})}
                    >
                    {feedType === 'youtube' ? (
                        apiKey.loading ? <p className='bsb_feed_note'><Spinner /> {__('Checking…', 'b-slider')}</p> : <>
                            <div className='bsb_feed_status'>
                                {apiKey.hasKey
                                    ? <span className='is-ok'>
                                        {apiKey.inherited
                                            ? __('Using the key from Video Gallery for YouTube', 'b-slider')
                                            : sprintf(
                                                /* translators: %s: the last four characters of the saved API key */
                                                __('Key saved (%s)', 'b-slider'),
                                                apiKey.masked
                                            )}
                                    </span>
                                    // Names the service, because the step above it is called Connection rather than
                                    // YouTube API Key now.
                                    : <span className='is-muted'>{__('No API key — using YouTube’s public feed', 'b-slider')}</span>}

                                {apiKey.canManage && !isKeyOpen && <Button variant='secondary' size='small' onClick={() => setIsKeyOpen(true)}>
                                    {apiKey.hasKey ? __('Change', 'b-slider') : __('Add key', 'b-slider')}
                                </Button>}
                            </div>

                            {/* Not a sales pitch — a measured fact. YouTube rate-limits the public feed by answering
                                404 to requests it could serve, and a small channel is refused far more often than a
                                busy one, so a slider set up without a key can take a few goes at Refresh to fill. */}
                            {!apiKey.hasKey && !isKeyOpen && <p className='bsb_feed_note'>
                                {__('The public feed is rate-limited by YouTube and can refuse to answer. A key makes it reliable, and raises the limit to 200 videos.', 'b-slider')}
                            </p>}

                            {isKeyOpen && apiKey.canManage && <>
                                <TipText
                                    className={gap}
                                    label={__('YouTube API key', 'b-slider')}
                                    value={keyInput}
                                    placeholder={__('AIza…', 'b-slider')}
                                    onChange={setKeyInput}
                                    tip={__('Needed for view counts, durations and the most-viewed list.', 'b-slider')}
                                />

                                {!!apiKey.error && <p className='bsb_feed_note is-error'>{apiKey.error}</p>}

                                <div className='bsb_feed_actions'>
                                    <Button variant='primary' size='small' disabled={apiKey.saving || !keyInput.trim()} onClick={() => saveKey(keyInput.trim())}>
                                        {apiKey.saving ? __('Saving…', 'b-slider') : __('Save key', 'b-slider')}
                                    </Button>

                                    <Button variant='tertiary' size='small' disabled={apiKey.saving} onClick={() => { setKeyInput(''); setIsKeyOpen(false); }}>
                                        {__('Cancel', 'b-slider')}
                                    </Button>

                                    {apiKey.hasKey && !apiKey.inherited && <Button variant='link' isDestructive size='small' disabled={apiKey.saving} onClick={() => saveKey('')}>
                                        {__('Remove', 'b-slider')}
                                    </Button>}
                                </div>
                            </>}

                        </>
                    ) : (
                        <PremiumPanel
                            title={__('Feed Cache Settings', 'b-slider')}
                            description={__('Control feed cache time to optimize performance and prevent exceeding API rate limits.', 'b-slider')}
                            pricingUrl={adminUrl()}
                            buttonLabel={__('Get Pro', 'b-slider')}
                        />
                    )}

                    {/* "YouTube Thumbnail Quality" stood here and has moved to Slides → The picture,
                        beside Image Fit — it is what the slide's picture looks like, not a setting
                        about reaching the service the way the API key and cache time above it are. */}

                    </PanelBody>
                )}



                {hasAddress && feedType !== 'youtube_video' && feedType !== 'rss' && feedType !== 'json' && feedType !== 'instagram' && (
                    <PanelBody
                        className='bPlPanelBody bsb_feed_panel'
                        title={stepTitle(__('SEO', 'b-slider'))}
                        initialOpen={false}
                        badge={<PremiumBadge />}
                    >
                    <PremiumPanel
                        title={__('SEO Video Schema & Structured Data', 'b-slider')}
                        description={__('Add rich results (JSON-LD) structured data to help search engines understand your feed videos.', 'b-slider')}
                        pricingUrl={adminUrl()}
                        buttonLabel={__('Get Pro', 'b-slider')}
                    />
                    </PanelBody>
                )}
            </AccordionGroup>
        </div>

        {feed && !feed.available && <p className='bsb_feed_note'>
            {__('This feed type is not available yet.', 'b-slider')}
        </p>}

        {feedType === 'youtube' && (
            <Notice className="mt15" status="premium" isIcon={true}>
                {__('YouTube Search, Channel Playlist, and Feed Cache Time are available in the Premium version.', 'b-slider')}
            </Notice>
        )}
        {(feedType === 'rss' || feedType === 'json') && (
            <Notice className="mt15" status="premium" isIcon={true}>
                {__('Feed Cache Time is available in the Premium version.', 'b-slider')}
            </Notice>
        )}
    </PanelBody>

        {feedType === 'json' && hasAddress && (
            <PanelBody
                className='bPlPanelBody'
                panelId='json-schema-mapping'
                title={__('JSON Fields Mapping', 'b-slider')}
                badge={__('New', 'b-slider')}
                initialOpen={false}
            >
                <TipText
                    label={__('Slides List Key', 'b-slider')}
                    value={jsonRootKey}
                    onChange={val => updateObject('socialQuery', 'jsonRootKey', val)}
                    placeholder='e.g. items (leave empty for root array)'
                    tip={__('Optional key holding the array of posts. Leave blank if the JSON root is itself the array.', 'b-slider')}
                />
                 <TipText
                    className={gap}
                    label={__('Slide Title Key', 'b-slider')}
                    value={jsonTitleKey}
                    onChange={val => updateObject('socialQuery', 'jsonTitleKey', val)}
                    placeholder='e.g. title'
                    tip={__('Key holding the title string in each item object.', 'b-slider')}
                />
                <TipText
                    className={gap}
                    label={__('Description / Excerpt Key', 'b-slider')}
                    value={jsonExcerptKey}
                    onChange={val => updateObject('socialQuery', 'jsonExcerptKey', val)}
                    placeholder='e.g. description or excerpt'
                    tip={__('Key holding the description/excerpt string in each item object.', 'b-slider')}
                />
                <TipText
                    className={gap}
                    label={__('Button Label Key', 'b-slider')}
                    value={jsonButtonTextKey}
                    onChange={val => updateObject('socialQuery', 'jsonButtonTextKey', val)}
                    placeholder='e.g. button_text'
                    tip={__('Key holding the custom button text in each item object.', 'b-slider')}
                />
                <TipText
                    className={gap}
                    label={__('Button Link / URL Key', 'b-slider')}
                    value={jsonLinkKey}
                    onChange={val => updateObject('socialQuery', 'jsonLinkKey', val)}
                    placeholder='e.g. url or permalink'
                    tip={__('Key holding the permalink URL in each item object.', 'b-slider')}
                />
                <TipText
                    className={gap}
                    label={__('Slide Image Key', 'b-slider')}
                    value={jsonImageKey}
                    onChange={val => updateObject('socialQuery', 'jsonImageKey', val)}
                    placeholder='e.g. image_url or src'
                    tip={__('Key holding the featured image URL in each item object.', 'b-slider')}
                />
                <TipText
                    className={gap}
                    label={__('Publish Date Key', 'b-slider')}
                    value={jsonDateKey}
                    onChange={val => updateObject('socialQuery', 'jsonDateKey', val)}
                    placeholder='e.g. date'
                    tip={__('Key holding the custom date in each item object.', 'b-slider')}
                />
                <TipText
                    className={gap}
                    label={__('Author Name Key', 'b-slider')}
                    value={jsonAuthorKey}
                    onChange={val => updateObject('socialQuery', 'jsonAuthorKey', val)}
                    placeholder='e.g. author'
                    tip={__('Key holding the custom author in each item object.', 'b-slider')}
                />
            </PanelBody>
        )}
    </>;
};

export default SocialGeneral;

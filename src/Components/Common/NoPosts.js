import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { SelectControl, TextControl, Button, CheckboxControl } from '@wordpress/components';
import useFeedChannels from '../../hooks/useFeedChannels';

/** A small line drawing per state. Inline so the empty state costs no request of its own. */
const icons = {
    address: <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <path d='M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
        <circle cx='12' cy='10' r='2.5' stroke='currentColor' strokeWidth='1.5' />
    </svg>,
    empty: <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <rect x='3' y='5' width='18' height='14' rx='3' stroke='currentColor' strokeWidth='1.5' />
        <path d='M3 15l4.5-3.5L12 15l3-2.5L21 17' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
    </svg>,
    warning: <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
        <path d='M12 4.5 21 19.5H3L12 4.5Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
        <path d='M12 10v4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
        <circle cx='12' cy='16.6' r='.9' fill='currentColor' />
    </svg>
};

/** The sliders icon, used on the action whichever form it takes. */
const hintIcon = <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='M4 7h16M4 12h16M4 17h16' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
    <circle cx='9' cy='7' r='2' fill='currentColor' />
    <circle cx='15' cy='12' r='2' fill='currentColor' />
    <circle cx='11' cy='17' r='2' fill='currentColor' />
</svg>;

/**
 * What a slider shows when it has nothing to show.
 *
 * Two audiences, and they want opposite things. In the editor this is the most useful moment to
 * explain what is missing and where to fix it. On the front end a visitor must never be told to
 * "check the Feed Settings panel" — that is a note to the site's author printed on a public page —
 * so a feed with nothing in it renders nothing at all and the page simply moves on.
 *
 * The post sources keep their long-standing front-end message; only the feed source, which is new,
 * starts out silent there.
 */
/** Shown on the button that opens the site-wide panel. */
const globeIcon = <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <circle cx='12' cy='12' r='8.5' stroke='currentColor' strokeWidth='1.5' />
    <path d='M3.5 12h17M12 3.5c2.2 2.3 3.3 5.2 3.3 8.5S14.2 18.2 12 20.5c-2.2-2.3-3.3-5.2-3.3-8.5S9.8 5.8 12 3.5Z' stroke='currentColor' strokeWidth='1.5' />
</svg>;

const arrowIcon = <svg className='bsbEmptyArrow' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='M9 6l6 6-6 6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
</svg>;

const NoPosts = ({ attributes, setAttributes = null, isBackEnd = false, feedError = '', onOpenPanel = null, onOpenGlobal = null }) => {
    const { sourceType, socialQuery } = attributes;

    const library = useFeedChannels();
    const feedType = socialQuery?.feedType || '';
    const isRss = 'rss' === feedType;
    const isInstagram = 'instagram' === feedType;
    const isJson = 'json' === feedType;

    const isCustom = !socialQuery?.channelId;
    const [customUrl, setCustomUrl] = useState(socialQuery?.source || '');
    const [customLabel, setCustomLabel] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(socialQuery?.channelId || '');
    const [allowImage, setAllowImage] = useState(socialQuery?.igAllowImage ?? true);
    const [allowAlbum, setAllowAlbum] = useState(socialQuery?.igAllowAlbum ?? true);
    const [allowVideo, setAllowVideo] = useState(socialQuery?.igAllowVideo ?? true);

    /**
     * Instagram's own way back into the "add a new one" fields, once the site already has one saved.
     *
     * Every other feed type keeps a door open through the dropdown itself: picking "Use a one-off
     * address" clears `channelId`, which is what `showCustom` is watching, so the fields reopen
     * whenever that option is chosen again. Instagram cannot use `channelId` the same way — its
     * dropdown selection is held in `selectedAccount` until "Fetch Feed" commits it, precisely so
     * choosing an account does not yet decide anything — so a state of its own stands in for the flag
     * `showCustom` would otherwise be.
     *
     * Without this the form's visibility was `showCustom || !filteredChannels.length`, which is a
     * door that opens for Instagram exactly once — until the first account is ever saved to the site
     * — and never again after, with a picked account still sat right beside the now-permanently-shut
     * door. This is what "Add a new account" in the dropdown opens instead, every time.
     */
    const [wantsNewInstagramAccount, setWantsNewInstagramAccount] = useState(false);

    useEffect(() => {
        setCustomUrl(socialQuery?.source || '');
        setCustomLabel('');
        setSelectedAccount(socialQuery?.channelId || '');
        setAllowImage(socialQuery?.igAllowImage ?? true);
        setAllowAlbum(socialQuery?.igAllowAlbum ?? true);
        setAllowVideo(socialQuery?.igAllowVideo ?? true);
        setWantsNewInstagramAccount(false);
    }, [socialQuery?.source, socialQuery?.channelId, socialQuery?.igAllowImage, socialQuery?.igAllowAlbum, socialQuery?.igAllowVideo]);

    const filteredChannels = library.channels?.filter(channel => channel.feedType === feedType) || [];

    /**
     * Whether this service's address may live on the slider itself.
     *
     * Instagram's is an access token, and a slider's own address is a block attribute — saved into
     * post content and printed into the page. A saved account keeps it in an option instead, so for
     * Instagram that is the only route offered. See the note in render.php.
     */
    const allowsCustom = !isInstagram;
    const showCustom = isCustom && allowsCustom;

    const isFeed = 'social' === sourceType;
    // Either route counts as configured. Reading only the slider's own address left a slider that
    // names a saved channel being offered the "pick a channel" form it had already been through.
    const hasAddress = !!(socialQuery?.source || '').trim() || !!(socialQuery?.channelId || '').trim();

    if (isFeed && !isBackEnd) {
        return null;
    }

    const state = (() => {
        if (isFeed && feedError) {
            return {
                icon: 'warning',
                tone: 'warn',
                title: __('That feed could not be read', 'b-slider'),
                body: feedError,
                hint: __('Open Feed Settings', 'b-slider'),
                panel: 'feed-settings',
                global: true
            };
        }

        if (isFeed && !hasAddress) {
            const feedType = socialQuery?.feedType || '';
            const isRss = 'rss' === feedType;
            const isInstagram = 'instagram' === feedType;
            const isJson = 'json' === feedType;
            const ytQueryType = socialQuery?.ytQueryType || 'channel';

            if (!feedType) {
                return {
                    icon: 'address',
                    tone: 'setup',
                    title: __('Select Feed Type', 'b-slider'),
                    body: __('Choose a feed type to pull content into your slider.', 'b-slider'),
                    hint: __('Open Feed Settings', 'b-slider'),
                    panel: 'feed-settings',
                    global: false
                };
            }

            if (feedType === 'youtube' && ytQueryType === 'search') {
                return {
                    icon: 'address',
                    tone: 'setup',
                    title: __('Search YouTube for videos', 'b-slider'),
                    body: __('Enter a search term to find YouTube videos. The slider will pull and display matching videos.', 'b-slider'),
                    hint: __('Open Feed Settings', 'b-slider'),
                    panel: 'feed-settings',
                    global: true
                };
            }

            return {
                icon: 'address',
                tone: 'setup',
                title: isRss 
                    ? __('Pick an RSS feed to pull posts from', 'b-slider')
                    : isInstagram
                    ? __('Pick an Instagram account to pull posts from', 'b-slider')
                    : isJson
                    ? __('Pick a JSON endpoint to pull items from', 'b-slider')
                    : __('Pick a channel to pull videos from', 'b-slider'),
                body: isRss
                    ? __('Paste a valid RSS or Atom feed URL. The slider fills itself in and keeps up as the feed publishes new posts.', 'b-slider')
                    : isInstagram
                    ? __('Connect your Instagram account to pull posts. The slider fills itself in and keeps up as you publish new posts.', 'b-slider')
                    : isJson
                    ? __('Paste an external JSON endpoint URL. The slider fills itself in and displays content from the API.', 'b-slider')
                    : __('Paste a YouTube channel URL, its @handle, or a playlist link. The slider fills itself in and keeps up as the channel publishes.', 'b-slider'),
                hint: __('Open Feed Settings', 'b-slider'),
                panel: 'feed-settings',
                global: true,
                // Only worth saying where somebody is setting a feed up for the first time.
                note: isRss
                    ? __('Feeds are saved once for the whole site, so every slider can pick them.', 'b-slider')
                    : isInstagram
                    ? __('Instagram connections are saved once for the whole site, so every slider can pick them.', 'b-slider')
                    : isJson
                    ? __('JSON endpoints are saved once for the whole site, so every slider can pick them.', 'b-slider')
                    : __('Channels and the API key are saved once for the whole site, so every slider can pick them.', 'b-slider')
            };
        }

        if (isFeed) {
            const feedType = socialQuery?.feedType || 'youtube';
            const isRss = 'rss' === feedType;
            const isInstagram = 'instagram' === feedType;
            const isJson = 'json' === feedType;

            return {
                icon: 'empty',
                tone: 'warn',
                title: isRss
                    ? __('This feed has no posts yet', 'b-slider')
                    : isInstagram
                    ? __('This account has no posts yet', 'b-slider')
                    : isJson
                    ? __('This endpoint returned no items', 'b-slider')
                    : __('This feed has no videos yet', 'b-slider'),
                body: isRss
                    ? __('The RSS feed was found, but it has no posts. Check the address, or try again in a moment.', 'b-slider')
                    : isInstagram
                    ? __('The Instagram account was found, but it has no posts. Check the account, or try again in a moment.', 'b-slider')
                    : isJson
                    ? __('The JSON endpoint was reached, but returned no items. Check the URL and format, or try again in a moment.', 'b-slider')
                    : __('The channel was found, but it published nothing this slider can show. Check the address, or try again in a moment.', 'b-slider'),
                hint: __('Open Feed Settings', 'b-slider'),
                panel: 'feed-settings',
                global: true
            };
        }

        return 'posts' === sourceType
            ? {
                icon: 'empty',
                tone: 'warn',
                title: __('No posts match this query', 'b-slider'),
                body: __('Nothing was found for the categories, tags and filters chosen. Widen the query, or publish a post that fits it.', 'b-slider'),
                hint: __('Post Query', 'b-slider')
            }
            : {
                icon: 'empty',
                tone: 'warn',
                title: __('No products match this query', 'b-slider'),
                body: __('Nothing was found for the categories, tags and filters chosen. Widen the query, or publish a product that fits it.', 'b-slider'),
                hint: __('Post Query', 'b-slider')
            };
    })();

    // The front end keeps the plain sentence the post sources have always shown.
    if (!isBackEnd) {
        return <p className='bsbNoPosts'>{state.title}</p>;
    }

    return (
        <div className="bsb_main_parent" style={{ border: 'none', background: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
            <div className={`bsbEmptyState is-${state.tone}`} style={{ position: 'relative' }}>
                {isFeed && setAttributes && (
                    <button
                        className="bsb_backBtn"
                        onClick={() => {
                            setAttributes({
                                layoutType: '',
                                socialQuery: {
                                    ...(socialQuery || {}),
                                    feedType: '',
                                    channelId: '',
                                    source: ''
                                }
                            });
                        }}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            left: '15px',
                        }}
                    >
                        &larr; {__('Back to Select Feed Type', 'b-slider')}
                    </button>
                )}

                <span className='bsbEmptyIcon' style={{ marginTop: isFeed ? '25px' : '0px' }}>{icons[state.icon]}</span>

                <h3 className='bsbEmptyTitle'>{state.title}</h3>
                <p className='bsbEmptyBody'>{state.body}</p>

                {!!state.note && <p className='bsbEmptyNote'>{state.note}</p>}

                {/* The form that gets this slider its address, laid out by `.bsbCardSelector` rather
                    than by inline styles: the fields in it need shaping the sidebar's `.bPlPanelBody`
                    rules do not reach — this is the canvas — and a stylesheet is where a select's
                    arrow, a label's type and a focus ring can be said once for all of them. */}
                {isFeed && !hasAddress && setAttributes && (
                    <div className="bsbCardSelector">
                        {feedType === 'youtube_video' ? (
                            <div className="bsbCardSelectorGroup">
                                <TextControl
                                    label={__('YouTube Video URL', 'b-slider')}
                                    value={customUrl}
                                    placeholder='https://www.youtube.com/watch?v=...'
                                    onChange={setCustomUrl}
                                />
                                <div className="bsbCardSelectorActions">
                                    <Button
                                        variant="primary"
                                        disabled={!customUrl.trim()}
                                        onClick={() => {
                                            setAttributes({
                                                socialQuery: {
                                                    ...(socialQuery || {}),
                                                    source: customUrl.trim(),
                                                    channelId: ''
                                                }
                                            });
                                        }}
                                    >
                                        {__('Load Video', 'b-slider')}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* The dropdown is drawn from the first paint and never swapped out.
                                    While the site's saved list is on its way it holds one inert option
                                    saying so — the field keeps its place, its label and its exact height,
                                    so nothing here moves when the real options arrive.

                                    A placeholder in its stead, however well sized, still has to be
                                    replaced by the control — and swapping one for the other is a second
                                    reflow of the card. The only version of this that does not move is the
                                    one where the control was always the control. */}
                                <SelectControl
                                    label={isRss ? __('Saved RSS Feeds', 'b-slider') : (isJson ? __('Saved JSON Feeds', 'b-slider') : isInstagram ? __('Saved Instagram Accounts', 'b-slider') : __('Saved Channels', 'b-slider'))}
                                    value={isInstagram ? (wantsNewInstagramAccount ? '__custom__' : selectedAccount) : (socialQuery?.ytQueryType === 'search' ? '__search__' : (socialQuery?.channelId || (showCustom ? '__custom__' : '')))}
                                    disabled={library.loading}
                                    options={library.loading
                                        ? [{ value: '', label: isRss ? __('Loading saved feeds…', 'b-slider') : (isJson ? __('Loading saved endpoints…', 'b-slider') : isInstagram ? __('Loading saved accounts…', 'b-slider') : __('Loading saved channels…', 'b-slider')) }]
                                        : [
                                            { value: '', label: isRss ? __('— Select a feed —', 'b-slider') : (isJson ? __('— Select a JSON endpoint —', 'b-slider') : isInstagram ? __('— Select an Instagram Account —', 'b-slider') : __('— Select a channel —', 'b-slider')) },
                                            ...filteredChannels.map(channel => ({ value: channel.id, label: channel.label })),
                                            ...(feedType === 'youtube' ? [{ value: '__search__', label: __('YouTube Search', 'b-slider') }] : []),
                                            ...(allowsCustom ? [{ value: '__custom__', label: isRss ? __('Use a one-off feed URL', 'b-slider') : (isJson ? __('Use a one-off JSON URL', 'b-slider') : __('Use a one-off address', 'b-slider')) }] : []),
                                            /* Instagram's address is a credential rather than a URL, so
                                               nothing it picks here is ever a one-off — `allowsCustom` keeps
                                               it out of the branch above for exactly that reason. Same slot in
                                               the list and the same door into the fields below it, worded for
                                               what actually happens: this account gets saved to the site, the
                                               only route offered for it, never printed into the page itself. */
                                            ...(isInstagram ? [{ value: '__custom__', label: __('Add a new account', 'b-slider') }] : [])
                                        ]}
                                    onChange={(val) => {
                                        if (isInstagram) {
                                            if ('__custom__' === val) {
                                                setSelectedAccount('');
                                                setWantsNewInstagramAccount(true);
                                            } else {
                                                setWantsNewInstagramAccount(false);
                                                setSelectedAccount(val);
                                            }
                                            return;
                                        }
                                        if (val === '__custom__') {
                                            setAttributes({
                                                socialQuery: {
                                                    ...(socialQuery || {}),
                                                    ytQueryType: 'channel',
                                                    channelId: '',
                                                    source: ''
                                                }
                                            });
                                        } else if (val === '__search__') {
                                            setAttributes({
                                                socialQuery: {
                                                    ...(socialQuery || {}),
                                                    ytQueryType: 'search',
                                                    channelId: '',
                                                    source: socialQuery?.ytSearchTerm || ''
                                                }
                                            });
                                        } else {
                                            setAttributes({
                                                socialQuery: {
                                                    ...(socialQuery || {}),
                                                    ytQueryType: 'channel',
                                                    channelId: val,
                                                    source: ''
                                                }
                                            });
                                        }
                                    }}
                                />

                                {isInstagram && !!selectedAccount && (
                                    <div className="bsbCardSelectorGroup" style={{ marginTop: '15px' }}>
                                        <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px', color: '#1e293b' }}>
                                            {__('Allowed Media Types', 'b-slider')}
                                        </div>
                                        <div className="bsb_choice_row" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: '12px' }}>
                                            <CheckboxControl
                                                label={__('Images', 'b-slider')}
                                                checked={allowImage}
                                                onChange={setAllowImage}
                                            />
                                            <CheckboxControl
                                                label={__('Albums', 'b-slider')}
                                                checked={allowAlbum}
                                                onChange={setAllowAlbum}
                                            />
                                            <CheckboxControl
                                                label={__('Videos', 'b-slider')}
                                                checked={allowVideo}
                                                onChange={setAllowVideo}
                                            />
                                        </div>
                                        <div className="bsbCardSelectorActions">
                                            <Button
                                                variant="primary"
                                                onClick={() => {
                                                    setAttributes({
                                                        socialQuery: {
                                                            ...(socialQuery || {}),
                                                            ytQueryType: 'channel',
                                                            channelId: selectedAccount,
                                                            source: '',
                                                            igAllowImage: allowImage,
                                                            igAllowAlbum: allowAlbum,
                                                            igAllowVideo: allowVideo
                                                        }
                                                    });
                                                }}
                                            >
                                                {__('Fetch Feed', 'b-slider')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {!library.loading && (socialQuery?.ytQueryType === 'search') && (
                                    <div className="bsbCardSelectorGroup">
                                        <TextControl
                                            label={__('YouTube Search Term', 'b-slider')}
                                            value={customUrl}
                                            placeholder={__('e.g. WordPress, Music, Tech', 'b-slider')}
                                            onChange={setCustomUrl}
                                        />
                                        <div className="bsbCardSelectorActions">
                                            <Button
                                                variant="primary"
                                                disabled={!customUrl.trim()}
                                                onClick={() => {
                                                    setAttributes({
                                                        socialQuery: {
                                                            ...(socialQuery || {}),
                                                            ytSearchTerm: customUrl.trim(),
                                                            source: customUrl.trim(),
                                                            channelId: ''
                                                        }
                                                    });
                                                }}
                                            >
                                                {__('Load Videos', 'b-slider')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* `!library.loading` first, and it is the whole point of this line.
                                    An unanswered request and a site with nothing saved are both an empty
                                    list, so this form used to be drawn immediately and then withdrawn the
                                    instant the real list arrived — the fields flashing past on the way to
                                    a dropdown, taking the card's height with them. Now it waits until
                                    there is an answer, and appears once. */}
                                {/* `wantsNewInstagramAccount` on top of the other two: Instagram reaches this
                                    the same way the others do now — picking "Add a new account" from the
                                    dropdown above — but `showCustom` can never be true for it, so its own flag
                                    stands in for the door the other feed types open through `channelId`. */}
                                {!library.loading && socialQuery?.ytQueryType !== 'search' && (showCustom || !filteredChannels.length || wantsNewInstagramAccount) && (
                                    <div className="bsbCardSelectorGroup">
                                        {/* Only where there was a list to choose from. With nothing
                                            saved yet these fields are the whole form, not the
                                            alternative to something above them. */}
                                        {!!filteredChannels.length && <span className="bsbCardSelectorOr">
                                            {isRss ? __('or add a new feed', 'b-slider') : (isJson ? __('or add a new endpoint', 'b-slider') : isInstagram ? __('connecting a new account', 'b-slider') : __('or add a new channel', 'b-slider'))}
                                        </span>}

                                        <TextControl
                                            label={isRss ? __('Feed Name', 'b-slider') : (isJson ? __('JSON Name', 'b-slider') : isInstagram ? __('Account Name', 'b-slider') : __('Channel Name', 'b-slider'))}
                                            value={customLabel}
                                            placeholder={isRss ? __('e.g. Our Blog Feed', 'b-slider') : (isJson ? __('e.g. Image CDN', 'b-slider') : isInstagram ? __('e.g. @username', 'b-slider') : __('e.g. Our Tutorials', 'b-slider'))}
                                            onChange={setCustomLabel}
                                        />

                                        <TextControl
                                            label={isRss ? __('RSS Feed URL', 'b-slider') : (isJson ? __('JSON Endpoint URL', 'b-slider') : isInstagram ? __('Instagram Access Token', 'b-slider') : __('Channel URL, @handle or ID', 'b-slider'))}
                                            value={customUrl}
                                            placeholder={isRss ? 'https://example.com/feed/' : (isJson ? 'https://example.com/api.json' : isInstagram ? 'Paste Access Token here' : 'https://www.youtube.com/@handle')}
                                            onChange={setCustomUrl}
                                        />

                                        {isInstagram && (
                                            <div style={{ marginTop: '15px', width: '100%' }}>
                                                <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '13px', color: '#1e293b' }}>
                                                    {__('Allowed Media Types', 'b-slider')}
                                                </div>
                                                <div className="bsb_choice_row" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: '12px' }}>
                                                    <CheckboxControl
                                                        label={__('Images', 'b-slider')}
                                                        checked={allowImage}
                                                        onChange={setAllowImage}
                                                    />
                                                    <CheckboxControl
                                                        label={__('Albums', 'b-slider')}
                                                        checked={allowAlbum}
                                                        onChange={setAllowAlbum}
                                                    />
                                                    <CheckboxControl
                                                        label={__('Videos', 'b-slider')}
                                                        checked={allowVideo}
                                                        onChange={setAllowVideo}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="bsbCardSelectorActions">
                                            {/* "Load only" writes the address onto the slider itself, which
                                                for Instagram would be writing a token into post content —
                                                so there the account is saved to the site or not used. */}
                                            {allowsCustom && <Button
                                                variant="secondary"
                                                disabled={!customUrl.trim()}
                                                onClick={() => {
                                                    setAttributes({
                                                        socialQuery: {
                                                            ...(socialQuery || {}),
                                                            source: customUrl.trim(),
                                                            channelId: ''
                                                        }
                                                    });
                                                }}
                                            >
                                                {isRss ? __('Load Feed Only', 'b-slider') : (isJson ? __('Load JSON Only', 'b-slider') : __('Load Channel Only', 'b-slider'))}
                                            </Button>}

                                            <Button
                                                variant="primary"
                                                disabled={!customUrl.trim() || library.saving}
                                                onClick={() => {
                                                    library.save({
                                                        label: (customLabel.trim() || customUrl.trim()),
                                                        feedType,
                                                        source: customUrl.trim()
                                                    }).then(saved => {
                                                        if (saved) {
                                                            setAttributes({
                                                                socialQuery: {
                                                                    ...(socialQuery || {}),
                                                                    channelId: saved.id,
                                                                    source: '',
                                                                    igAllowImage: allowImage,
                                                                    igAllowAlbum: allowAlbum,
                                                                    igAllowVideo: allowVideo
                                                                }
                                                            });
                                                        }
                                                    });
                                                }}
                                            >
                                                {library.saving
                                                    ? __('Saving…', 'b-slider') 
                                                    : isRss 
                                                    ? __('Save & Load Feed', 'b-slider') 
                                                    : isJson
                                                    ? __('Save & Load JSON', 'b-slider')
                                                    : isInstagram
                                                    ? __('Save & Load Account', 'b-slider')
                                                    : __('Save & Load Channel', 'b-slider')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {feedType && (
                    <span className='bsbEmptyActions'>
                        {state.panel && onOpenPanel
                            ? <button type='button' className='bsbEmptyAction' onClick={() => onOpenPanel(state.panel)}>
                                {hintIcon}
                                {isRss ? __('Open RSS Settings', 'b-slider') : (isJson ? __('Open JSON Settings', 'b-slider') : isInstagram ? __('Open Instagram Settings', 'b-slider') : __('Open YouTube Settings', 'b-slider'))}
                                {arrowIcon}
                            </button>
                            : <span className='bsbEmptyHint'>{hintIcon}{state.hint}</span>}

                        {state.global && onOpenGlobal && feedType !== 'youtube_video' && <button type='button' className='bsbEmptyAction is-quiet' onClick={onOpenGlobal}>
                            {globeIcon}
                            {isRss ? __('Site RSS feeds', 'b-slider') : (isJson ? __('Site JSON feeds', 'b-slider') : isInstagram ? __('Site Instagram Accounts', 'b-slider') : __('Site channels & API key', 'b-slider'))}
                            {arrowIcon}
                        </button>}
                    </span>
                )}
            </div>
        </div>
    );
};

export default NoPosts;

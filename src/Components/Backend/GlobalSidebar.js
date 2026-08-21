import { __, sprintf, _n } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/edit-post';
import { Button, Spinner, TextControl } from '@wordpress/components';

import { PanelBody, AccordionGroup } from '../Panel/AccordionPanel';
import useFeedChannels from '../../hooks/useFeedChannels';
import useYouTubeKey from '../../hooks/useYouTubeKey';
import { socialFeed as socialFeedIcon } from '../../utils/icons';

/**
 * A new channel, before anything is typed into it.
 *
 * An address and a name for it — that is the whole record. It used to carry `per_page` as the channel's
 * default, and it could never take effect: `block.json` ships that key inside the `socialQuery` default
 * and `updateObject` writes the object back whole, so a slider always arrived already carrying its own
 * and the channel's copy was never read. See the note on `FeedChannels::resolve()`. It is a per-slider
 * setting, in the Feed Settings panel.
 */

/**
 * How the editor addresses this sidebar.
 *
 * Gutenberg names a plugin sidebar `plugin/sidebar`, and anything opening one has to pass that exact
 * string. Built here from the two halves and exported, so the registration below and the button that
 * opens it cannot drift apart — a mismatch is a button that silently does nothing.
 */
export const PLUGIN_NAME = 'b-slider';
export const SIDEBAR_NAME = 'global-settings';
export const GLOBAL_SIDEBAR = `${PLUGIN_NAME}/${SIDEBAR_NAME}`;

/**
 * The site's saved channels, from inside the editor.
 *
 * The same library the dashboard manages and the block's picker reads, on the same hook — so a
 * channel added in any of the three shows up in the other two.
 */
const Channels = ({ type = 'youtube' }) => {
    const library = useFeedChannels();
    const isRss = type === 'rss';
    const isJson = type === 'json';
    const isInstagram = type === 'instagram';
    const blank = { id: '', label: '', feedType: type, source: '', jsonRootKey: '', jsonImageKey: '', jsonTitleKey: '', jsonLinkKey: '', jsonExcerptKey: '', jsonButtonTextKey: '', jsonDateKey: '', jsonAuthorKey: '', ytRefreshToken: '' };

    const filteredChannels = library.channels.filter(channel => channel.feedType === type);

    // Which channel the slider being edited is on. The panel is site-wide, so without this a person
    // looking at four saved channels has no way to tell which one they are actually looking at.
    const currentChannel = useSelect(select => {
        const block = select('core/block-editor')?.getSelectedBlock?.();

        return 'bsb/slider' === block?.name ? (block.attributes?.socialQuery?.channelId || '') : '';
    }, []);
    const [editing, setEditing] = useState(null);

    const submit = () => library.save(editing).then(saved => saved && setEditing(null));

    if (library.loading) {
        return <p className='bsbGlobalEmpty'><Spinner /> {__('Loading…', 'b-slider')}</p>;
    }

    return <>
        {filteredChannels.length
            ? <ul className='bsbGlobalList'>
                {filteredChannels.map(channel => <li
                    key={channel.id}
                    className={channel.id === currentChannel ? 'is-current' : ''}
                >
                    <span className='bsbGlobalDot'>{(channel.label || '?').trim().charAt(0).toUpperCase()}</span>

                    <span className='bsbGlobalText'>
                        <strong>
                            {channel.label}
                            {channel.id === currentChannel && <span className='bsbGlobalBadge'>
                                {__('this slider', 'b-slider')}
                            </span>}
                        </strong>
                        {/* An Instagram account arrives masked — the token never leaves the server.
                            See FeedChannels::forDisplay(). */}
                        <code>{channel.sourceMasked || channel.source}</code>
                    </span>

                    <span className='bsbGlobalFoot'>
                        <em>
                            {channel.usedBy.length
                                ? sprintf(
                                    /* translators: %d: how many sliders use this channel */
                                    _n('%d slider', '%d sliders', channel.usedBy.length, 'b-slider'),
                                    channel.usedBy.length
                                )
                                : __('unused', 'b-slider')}
                            {!isRss && !!channel.videos && ` · ${sprintf(
                                /* translators: %d: how many videos are imported for this channel */
                                __('%d imported', 'b-slider'), channel.videos
                            )}`}
                        </em>

                        <span className='bsbGlobalRowActions'>
                            <Button size='small' variant='tertiary' onClick={() => setEditing({ ...blank, ...channel })}>
                                {__('Edit', 'b-slider')}
                            </Button>
                            <Button size='small' variant='link' isDestructive onClick={() => library.remove(channel.id)}>
                                {__('Remove', 'b-slider')}
                            </Button>
                        </span>
                    </span>
                </li>)}
            </ul>
            : <p className='bsbGlobalEmpty'>
                {isJson
                    ? __('No JSON feeds saved yet. Add one and every slider on the site can pick it.', 'b-slider')
                    : isRss
                    ? __('No RSS feeds saved yet. Add one and every slider on the site can pick it.', 'b-slider')
                    : __('No channels saved yet. Add one and every slider on the site can pick it.', 'b-slider')}
            </p>}

        {editing ? <div className='bsbGlobalForm'>
            <TextControl
                label={__('Name', 'b-slider')}
                value={editing.label}
                placeholder={isJson ? __('e.g. Our API feed', 'b-slider') : isRss ? __('e.g. Our blog feed', 'b-slider') : isInstagram ? __('e.g. @username', 'b-slider') : __('e.g. Our tutorials', 'b-slider')}
                onChange={val => setEditing({ ...editing, label: val })}
            />

            {/* An account being edited arrives with no token — it never left the server — so the
                field starts empty and an empty field means "keep the one held". */}
            <TextControl
                label={isInstagram ? __('Instagram Access Token', 'b-slider') : (isRss || isJson) ? __('Feed URL', 'b-slider') : __('Channel URL, @handle or ID', 'b-slider')}
                value={editing.source}
                placeholder={isInstagram
                    ? (editing.hasSource ? __('Leave blank to keep the saved token', 'b-slider') : __('Paste Access Token here', 'b-slider'))
                    : (isRss || isJson) ? 'https://example.com/feed/' : 'https://www.youtube.com/@handle'}
                onChange={val => setEditing({ ...editing, source: val })}
                help={isInstagram && editing.hasSource
                    ? sprintf(
                        /* translators: %s: the masked token, e.g. ••••••••1a2b */
                        __('A token ending %s is saved. Type a new one only to replace it.', 'b-slider'),
                        editing.sourceMasked || ''
                    )
                    : undefined}
            />

            {type === 'youtube' && (
                <TextControl
                    label={__('YouTube Refresh Token (Optional for Private Videos)', 'b-slider')}
                    value={editing.ytRefreshToken || ''}
                    placeholder={editing.hasYtRefreshToken ? __('Leave blank to keep the saved token', 'b-slider') : __('Enter Refresh Token', 'b-slider')}
                    onChange={val => setEditing({ ...editing, ytRefreshToken: val })}
                    help={editing.hasYtRefreshToken
                        ? sprintf(
                            /* translators: %s: the masked token, e.g. ••••••••1a2b */
                            __('A token ending %s is saved. Type a new one only to replace it.', 'b-slider'),
                            editing.ytRefreshTokenMasked || ''
                        )
                        : undefined}
                />
            )}

            {isJson && (
                <>
                    <TextControl
                        label={__('Slides List Key', 'b-slider')}
                        value={editing.jsonRootKey || ''}
                        placeholder='e.g. data.posts'
                        onChange={val => setEditing({ ...editing, jsonRootKey: val })}
                    />
                    <TextControl
                        label={__('Slide Title Key', 'b-slider')}
                        value={editing.jsonTitleKey || ''}
                        placeholder='e.g. title'
                        onChange={val => setEditing({ ...editing, jsonTitleKey: val })}
                    />
                    <TextControl
                        label={__('Description / Excerpt Key', 'b-slider')}
                        value={editing.jsonExcerptKey || ''}
                        placeholder='e.g. excerpt'
                        onChange={val => setEditing({ ...editing, jsonExcerptKey: val })}
                    />
                    <TextControl
                        label={__('Button Label Key', 'b-slider')}
                        value={editing.jsonButtonTextKey || ''}
                        placeholder='e.g. button_text'
                        onChange={val => setEditing({ ...editing, jsonButtonTextKey: val })}
                    />
                    <TextControl
                        label={__('Button Link / URL Key', 'b-slider')}
                        value={editing.jsonLinkKey || ''}
                        placeholder='e.g. link'
                        onChange={val => setEditing({ ...editing, jsonLinkKey: val })}
                    />
                    <TextControl
                        label={__('Slide Image Key', 'b-slider')}
                        value={editing.jsonImageKey || ''}
                        placeholder='e.g. media.url'
                        onChange={val => setEditing({ ...editing, jsonImageKey: val })}
                    />
                    <TextControl
                        label={__('Publish Date Key', 'b-slider')}
                        value={editing.jsonDateKey || ''}
                        placeholder='e.g. date'
                        onChange={val => setEditing({ ...editing, jsonDateKey: val })}
                    />
                    <TextControl
                        label={__('Author Name Key', 'b-slider')}
                        value={editing.jsonAuthorKey || ''}
                        placeholder='e.g. author'
                        onChange={val => setEditing({ ...editing, jsonAuthorKey: val })}
                    />
                </>
            )}

            {!!library.error && <p className='bsbGlobalError'>{library.error}</p>}

            <div className='bsbGlobalActions'>
                <Button variant='primary' size='small' disabled={library.saving || (!editing.source.trim() && !editing.hasSource)} onClick={submit}>
                    {library.saving ? __('Saving…', 'b-slider') : __('Save', 'b-slider')}
                </Button>
                <Button variant='tertiary' size='small' disabled={library.saving} onClick={() => setEditing(null)}>
                    {__('Cancel', 'b-slider')}
                </Button>
            </div>
        </div> : <div className='bsbGlobalActions'>
            <Button variant='secondary' size='small' onClick={() => setEditing({ ...blank })}>
                {isJson ? __('+ Add JSON feed', 'b-slider') : isRss ? __('+ Add RSS feed', 'b-slider') : isInstagram ? __('+ Add Instagram Account', 'b-slider') : __('+ Add a channel', 'b-slider')}
            </Button>
        </div>}
    </>;
};

/** The one key the site holds. Never shown in full — see `SocialFeed::get_key()`. */
const ApiKey = ({ state: key }) => {
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const save = value => key.save(value).then(saved => {
        if (saved) {
            setInput('');
            setIsOpen(false);
        }
    });

    if (key.loading) {
        return <p className='bsbGlobalEmpty'><Spinner /> {__('Checking…', 'b-slider')}</p>;
    }

    return <>
        <p className='bsbGlobalState'>
            {key.hasKey
                ? (key.inherited
                    ? __('Using the key from Video Gallery for YouTube.', 'b-slider')
                    : sprintf(
                        /* translators: %s: last four characters of the saved key */
                        __('Key saved (%s).', 'b-slider'),
                        key.masked
                    ))
                : __('No key. Channels read the public feed: 15 videos, and YouTube rate-limits it.', 'b-slider')}
        </p>

        {isOpen && <div className='bsbGlobalForm'>
            <TextControl value={input} placeholder='AIza…' onChange={setInput} />
            <p className='bsbGlobalHelp'>
                {__('Under API restrictions pick YouTube Data API v3. Leave Application restrictions as None or restrict by IP — a referrer restriction always fails, because your server sends no referrer.', 'b-slider')}
            </p>
            {!!key.error && <p className='bsbGlobalError'>{key.error}</p>}

            <div className='bsbGlobalActions'>
                <Button variant='primary' size='small' disabled={key.saving || !input.trim()} onClick={() => save(input.trim())}>
                    {key.saving ? __('Saving…', 'b-slider') : __('Save key', 'b-slider')}
                </Button>
                <Button variant='tertiary' size='small' disabled={key.saving} onClick={() => { setInput(''); setIsOpen(false); }}>
                    {__('Cancel', 'b-slider')}
                </Button>
            </div>
        </div>}

        {!isOpen && <div className='bsbGlobalActions'>
            {key.canManage && <Button variant='secondary' size='small' onClick={() => setIsOpen(true)}>
                {key.hasKey ? __('Change key', 'b-slider') : __('Add key', 'b-slider')}
            </Button>}

            {key.hasKey && !key.inherited && key.canManage && <Button variant='link' isDestructive size='small' onClick={() => save('')}>
                {__('Remove', 'b-slider')}
            </Button>}
        </div>}
    </>;
};

/**
 * bSlider's own panel in the editor, reached by an icon in the top toolbar.
 *
 * These are site settings, not block settings: one channel library and one API key serve every
 * slider on the site. They belong in the dashboard, and they are also here — because the moment
 * somebody needs them is while they are building a slider, and sending them out of the editor to
 * the dashboard and back is the wrong shape for that moment.
 *
 * Nothing is duplicated but the markup: the dashboard screens, the block's picker and this all read
 * and write through `useFeedChannels` and `useYouTubeKey`, so there is one source of truth.
 */
const GlobalSidebar = () => {
    // Read once here rather than in both panels: the channel form needs the ceiling the key sets, and
    // the key panel needs the key, and two calls would be two requests for one answer.
    const key = useYouTubeKey();

    return <PluginSidebar
        name={SIDEBAR_NAME}
    title={__('bSlider', 'b-slider')}
    icon={socialFeedIcon(24, 24)}
    className='bsbGlobalSidebar'
>
        <AccordionGroup>
            <PanelBody title={__('YouTube Channels', 'b-slider')} initialOpen={true}>
                <Channels type="youtube" />
            </PanelBody>

            <PanelBody title={__('YouTube API Key', 'b-slider')} initialOpen={false}>
                <ApiKey state={key} />
            </PanelBody>

            <PanelBody title={__('RSS Feeds', 'b-slider')} initialOpen={false}>
                <Channels type="rss" />
            </PanelBody>

            <PanelBody title={__('JSON Feeds', 'b-slider')} initialOpen={false}>
                <Channels type="json" />
            </PanelBody>

            <PanelBody title={__('Instagram Accounts', 'b-slider')} initialOpen={false}>
                <Channels type="instagram" />
            </PanelBody>
        </AccordionGroup>
    </PluginSidebar>;
};

/**
 * Registered only where a `PluginSidebar` exists.
 *
 * The widget screen and the site editor load block scripts too but have no post-editor sidebar to
 * hang this on, and calling `registerPlugin` there throws — taking the block registration down with
 * it, which would leave the slider missing from the inserter entirely.
 */
export const registerGlobalSidebar = () => {
    if ('function' !== typeof registerPlugin || 'undefined' === typeof PluginSidebar) {
        return;
    }

    registerPlugin(PLUGIN_NAME, {
        icon: socialFeedIcon(24, 24),
        render: GlobalSidebar
    });
};

export default GlobalSidebar;

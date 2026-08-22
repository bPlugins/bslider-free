import { __, sprintf, _n } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import useFeedChannels from '../../../hooks/useFeedChannels';


/**
 * What to say about an Instagram connection's health, or nothing.
 *
 * Mirrors `FeedChannels::tokenState()`. A healthy token says how long it has left rather than
 * saying "fine" — the number is what tells somebody the renewal is actually happening, and a
 * connection that quietly stopped renewing looks identical to one that never needed to.
 */
const tokenNote = channel => {
    const days = channel.tokenDays || 0;

    switch (channel.tokenState) {
        case 'expired':
            return __('Connection expired — paste a new access token to reconnect.', 'b-slider');
        case 'failing':
            return __('Instagram is refusing this token. Paste a new one to reconnect.', 'b-slider');
        case 'expiring':
            return sprintf(
                /* translators: %d: days until the token expires */
                _n('Renews within %d day.', 'Renews within %d days.', days, 'b-slider'),
                days
            );
        case 'ok':
            return sprintf(
                /* translators: %d: days until the token expires */
                _n('Connected · renews in %d day.', 'Connected · renews in %d days.', days, 'b-slider'),
                days
            );
        case 'unknown':
            // Instagram only reveals a token's life when it hands over a new one, so a freshly
            // connected account has no date yet. Saying so beats an empty row, which reads as
            // "something is wrong and nobody will say what".
            return __('Connected · renewal is checked within a day.', 'b-slider');
        default:
            return '';
    }
};

/** Inline so a two-glyph notice costs no icon font and no extra request. */
const tickIcon = <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='m5 12.5 4.5 4.5L19 7' stroke='currentColor' strokeWidth='2.6' strokeLinecap='round' strokeLinejoin='round' />
</svg>;

const crossIcon = <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='M6 6l12 12M18 6 6 18' stroke='currentColor' strokeWidth='2.2' strokeLinecap='round' />
</svg>;

const alertIcon = <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='M12 7v6' stroke='currentColor' strokeWidth='2.4' strokeLinecap='round' />
    <circle cx='12' cy='17' r='1.3' fill='currentColor' />
</svg>;

/**
 * The form for one channel, used both to add and to edit.
 *
 * Rendered inside the table as a row of its own — under the channel being changed, or at the top when
 * adding. It used to sit below the whole table, which meant editing the fifth of ten channels put the
 * form off the bottom of the screen with nothing to say which row it belonged to.
 */
const ChannelForm = ({ draft, setDraft, saving, error, onSave, onCancel }) => {
    const isNew = !draft.id;
    const currentFeedType = draft.feedType || 'youtube';

    const feedTypes = [
        { value: 'youtube', label: __('YouTube Channel', 'b-slider') },
        { value: 'rss', label: __('RSS Feed', 'b-slider') },
        { value: 'json', label: __('JSON Feed', 'b-slider') },
        { value: 'instagram', label: __('Instagram Feed', 'b-slider') },
    ];

    return <tr className='bsbChannelEditRow'>
        <td colSpan={4}>
            <div className='bsbChannelForm'>
                <h4>{isNew 
                    ? (currentFeedType === 'rss' ? __('Add a feed', 'b-slider') : currentFeedType === 'json' ? __('Add JSON feed', 'b-slider') : currentFeedType === 'instagram' ? __('Add Instagram Account', 'b-slider') : __('Add a channel', 'b-slider')) 
                    : (currentFeedType === 'rss' ? __('Edit feed', 'b-slider') : currentFeedType === 'json' ? __('Edit JSON feed', 'b-slider') : currentFeedType === 'instagram' ? __('Edit Instagram Account', 'b-slider') : __('Edit channel', 'b-slider'))}</h4>

                <div className='bsbFormGrid'>
                    <label className='wide'>
                        <span>{__('Feed Type', 'b-slider')}</span>
                        <select
                            value={currentFeedType}
                            onChange={e => setDraft({ ...draft, feedType: e.target.value })}
                        >
                            {feedTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </label>

                    <label className='wide'>
                        <span>{__('Name', 'b-slider')}</span>
                        <input
                            type='text'
                            value={draft.label}
                            placeholder={currentFeedType === 'rss' ? __('e.g. Our blog feed', 'b-slider') : currentFeedType === 'json' ? __('e.g. Our API feed', 'b-slider') : currentFeedType === 'instagram' ? __('e.g. @username', 'b-slider') : __('e.g. Our tutorials', 'b-slider')}
                            onChange={e => setDraft({ ...draft, label: e.target.value })}
                        />
                        <em>{__('Only for you — this is what the pickers show.', 'b-slider')}</em>
                    </label>

                    <label className='wide'>
                        <span>{currentFeedType === 'instagram' ? __('Instagram Access Token', 'b-slider') : (currentFeedType === 'rss' || currentFeedType === 'json') ? __('Feed URL', 'b-slider') : __('Channel address', 'b-slider')}</span>
                        <input
                            type='text'
                            value={draft.source}
                            placeholder={currentFeedType === 'instagram'
                                ? (draft.hasSource ? __('Leave blank to keep the saved token', 'b-slider') : __('Paste Instagram Access Token here', 'b-slider'))
                                : (currentFeedType === 'rss' || currentFeedType === 'json') ? 'https://example.com/feed/' : 'https://www.youtube.com/@handle'}
                            onChange={e => setDraft({ ...draft, source: e.target.value })}
                        />
                        {/* An account being edited arrives with no token — it never left the server —
                            so an empty field means "keep the one held". */}
                        <em>{currentFeedType === 'instagram'
                            ? (draft.hasSource
                                ? sprintf(
                                    /* translators: %s: the masked token, e.g. ••••••••1a2b */
                                    __('A token ending %s is saved. Type a new one only to replace it.', 'b-slider'),
                                    draft.sourceMasked || ''
                                )
                                : __('An access token from the Instagram API with Instagram Login.', 'b-slider'))
                            : (currentFeedType === 'rss' || currentFeedType === 'json')
                            ? __('A valid RSS, Atom or JSON feed URL.', 'b-slider')
                            : __('A channel URL, its @handle, its UC… ID, or a playlist URL.', 'b-slider')}</em>
                    </label>

                    {currentFeedType === 'youtube' && (
                        <label className='wide'>
                            <span>{__('YouTube Refresh Token (Optional for Private Videos)', 'b-slider')}</span>
                            <input
                                type='text'
                                value={draft.ytRefreshToken || ''}
                                placeholder={draft.hasYtRefreshToken ? __('Leave blank to keep the saved token', 'b-slider') : __('Enter Refresh Token', 'b-slider')}
                                onChange={e => setDraft({ ...draft, ytRefreshToken: e.target.value })}
                            />
                            <em>{draft.hasYtRefreshToken
                                ? sprintf(
                                    /* translators: %s: the masked token, e.g. ••••••••1a2b */
                                    __('A token ending %s is saved. Type a new one only to replace it.', 'b-slider'),
                                    draft.ytRefreshTokenMasked || ''
                                )
                                : __('Required only if you wish to display private or unlisted videos in the slider.', 'b-slider')}</em>
                        </label>
                    )}

                    {currentFeedType === 'json' && (
                        <>
                            <label className='wide'>
                                <span>{__('Slides List Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonRootKey || ''}
                                    placeholder='e.g. data.posts'
                                    onChange={e => setDraft({ ...draft, jsonRootKey: e.target.value })}
                                />
                                <em>{__('Path to list array inside JSON response (e.g. "data.posts"). Leave empty if root is array.', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Slide Title Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonTitleKey || ''}
                                    placeholder='e.g. title'
                                    onChange={e => setDraft({ ...draft, jsonTitleKey: e.target.value })}
                                />
                                <em>{__('Field name for slide title text.', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Description / Excerpt Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonExcerptKey || ''}
                                    placeholder='e.g. excerpt'
                                    onChange={e => setDraft({ ...draft, jsonExcerptKey: e.target.value })}
                                />
                                <em>{__('Field name for slide description caption text.', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Button Label Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonButtonTextKey || ''}
                                    placeholder='e.g. button_text'
                                    onChange={e => setDraft({ ...draft, jsonButtonTextKey: e.target.value })}
                                />
                                <em>{__('Field name for custom button text.', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Button Link / URL Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonLinkKey || ''}
                                    placeholder='e.g. link'
                                    onChange={e => setDraft({ ...draft, jsonLinkKey: e.target.value })}
                                />
                                <em>{__('Field name for slide redirect URL.', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Slide Image Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonImageKey || ''}
                                    placeholder='e.g. media.url'
                                    onChange={e => setDraft({ ...draft, jsonImageKey: e.target.value })}
                                />
                                <em>{__('Field name for slide image source URL (dot-notation supported).', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Publish Date Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonDateKey || ''}
                                    placeholder='e.g. date'
                                    onChange={e => setDraft({ ...draft, jsonDateKey: e.target.value })}
                                />
                                <em>{__('Field name for slide publish date.', 'b-slider')}</em>
                            </label>
                            <label className='wide'>
                                <span>{__('Author Name Key', 'b-slider')}</span>
                                <input
                                    type='text'
                                    value={draft.jsonAuthorKey || ''}
                                    placeholder='e.g. author'
                                    onChange={e => setDraft({ ...draft, jsonAuthorKey: e.target.value })}
                                />
                                <em>{__('Field name for slide author.', 'b-slider')}</em>
                            </label>
                        </>
                    )}
                </div>

                {!!error && <p className='bsbFormError'>{error}</p>}

                <div className='bsbFormActions'>
                    <button className='button button-primary' disabled={saving || (!draft.source.trim() && !draft.hasSource)} onClick={onSave}>
                        {saving ? __('Saving…', 'b-slider') : isNew 
                            ? (currentFeedType === 'rss' ? __('Add feed', 'b-slider') : currentFeedType === 'json' ? __('Add JSON feed', 'b-slider') : currentFeedType === 'instagram' ? __('Add Account', 'b-slider') : __('Add channel', 'b-slider')) 
                            : __('Save changes', 'b-slider')}
                    </button>
                    <button className='button' disabled={saving} onClick={onCancel}>
                        {__('Cancel', 'b-slider')}
                    </button>
                </div>
            </div>
        </td>
    </tr>;
};

/**
 * The site's saved feeds, managed in one place.
 *
 * A channel here is *referenced* by the sliders that show it, never copied into them — so this is
 * where an address is corrected, a name changed or a default adjusted, and every slider follows.
 * Each row says which sliders depend on it, because that is what makes a delete safe or not.
 */
/**
 * The confirmation a feed or account gets when it is removed, already filled in with its name.
 *
 * One `sprintf` per string — see the note on `savedNote` in `SocialGeneral` for why a ternary
 * loses its `translators:` comments by the time `make-pot` reads the bundle.
 */
const removeNote = (isInstagram, name) => {
    if (isInstagram) {
        return sprintf(
            /* translators: %s: the account's name */
            __('Remove Instagram account “%s”? Any sliders using it will go back to loading live directly.', 'b-slider'),
            name
        );
    }

    return sprintf(
        /* translators: %s: the feed's name */
        __('Remove feed “%s”? Any sliders using it will go back to reading the feed live directly.', 'b-slider'),
        name
    );
};

const Channels = ({ type = 'youtube' }) => {
    const library = useFeedChannels();

    const [draft, setDraft] = useState(null);
    const [saved, setSaved] = useState('');

    const blank = { id: '', label: '', feedType: type, source: '', jsonRootKey: '', jsonImageKey: '', jsonTitleKey: '', jsonLinkKey: '', jsonExcerptKey: '', jsonButtonTextKey: '', jsonDateKey: '', jsonAuthorKey: '', ytRefreshToken: '' };
    const isRss = type === 'rss';
    const isJson = type === 'json';
    const isInstagram = type === 'instagram';

    const filteredChannels = library.channels.filter(channel => channel.feedType === type);
    const isAdding = draft && !draft.id;

    const submit = () => library.save(draft).then(result => {
        if (result) {
            setSaved(result.label || result.source);
            setDraft(null);
        }
    });

    const remove = channel => {
        // eslint-disable-next-line no-alert
        if (!window.confirm((isRss || isJson || isInstagram)
            ? removeNote(isInstagram, channel.label)
            : channel.usedBy.length
            ? sprintf(
                /* translators: 1: channel name, 2: number of sliders using it */
                __('Remove “%1$s”? %2$d slider(s) still use it, and they fall back to whatever address they last carried.', 'b-slider'),
                channel.label, channel.usedBy.length
            )
            : sprintf(
                /* translators: %s: channel name */
                __('Remove “%s”? Anything it imported stays on the site and shows up under Storage as unused.', 'b-slider'),
                channel.label
            ))) {
            return;
        }

        library.remove(channel.id);
    };

    const formProps = {
        draft,
        setDraft,
        saving: library.saving,
        error: library.error,
        onSave: submit,
        onCancel: () => setDraft(null)
    };

    if (library.loading) {
        return <p className='bsbConfigureEmpty'>{__('Loading…', 'b-slider')}</p>;
    }

    // Connections a person has to fix by hand — a withdrawn permission, a changed password. The
    // ones that renew themselves are not in here; those are the whole point of the upkeep run.
    const needsAttention = filteredChannels.filter(
        channel => 'expired' === channel.tokenState || 'failing' === channel.tokenState
    );

    // How long before a token lapses the plugin starts renewing it. From the server, so this
    // explanation cannot say one thing while `InstagramFeed::REFRESH_WINDOW` does another.
    const renewsFrom = library.instagram?.renewsFromDays || 14;

    return <div className='bsbSettingsSection'>
        {isInstagram && <div className='bsbExplainer'>
            <strong>{__('How the connection stays alive', 'b-slider')}</strong>
            <p>
                {sprintf(
                    /* translators: %d: how many days before expiry renewal begins */
                    __('An Instagram access token lasts about 60 days, and once it has lapsed it cannot be renewed — only replaced. So bSlider renews yours before that happens, starting %d days before it runs out. Each renewal buys another 60 days, so the date keeps moving forward and never arrives.', 'b-slider'),
                    renewsFrom
                )}
            </p>
            <p>
                {__('It is attempted two ways, and either one on its own is enough: once a day on a schedule, and again whenever a slider reads the feed — so it does not depend on WordPress’s scheduler running on a quiet site. You need do nothing unless an account is marked above as needing reconnection, which only happens if the Instagram password changed or the app’s permission was withdrawn.', 'b-slider')}
            </p>
        </div>}

        {!!needsAttention.length && <div className='bsbAttention'>
            <strong>{_n('This account needs reconnecting', 'These accounts need reconnecting', needsAttention.length, 'b-slider')}</strong>
            <p>
                {sprintf(
                    /* translators: %s: a list of Instagram account names */
                    _n(
                        '%s has stopped working — usually because the Instagram password changed, or the app’s permission was withdrawn. Its sliders keep showing what was last fetched, but nothing new will arrive until you paste a new access token below.',
                        '%s have stopped working — usually because an Instagram password changed, or the app’s permission was withdrawn. Their sliders keep showing what was last fetched, but nothing new will arrive until you paste new access tokens below.',
                        needsAttention.length,
                        'b-slider'
                    ),
                    needsAttention.map(channel => channel.label).join(', ')
                )}
            </p>
        </div>}

        <div className='bsbSectionHead'>
            <p className='bsbSectionIntro'>
                {isJson
                    ? __('Save a JSON feed once and every slider can pick it. Change an address or a name here and the sliders showing it follow.', 'b-slider')
                    : isRss
                    ? __('Save an RSS feed once and every slider can pick it. Change an address or a name here and the sliders showing it follow.', 'b-slider')
                    : isInstagram
                    ? __('Connect an Instagram account once and every slider can pick it. Update access credentials here and the sliders showing it follow.', 'b-slider')
                    : __('Save a channel once and every slider can pick it. Change an address or a name here and the sliders showing it follow — nothing needs re-importing.', 'b-slider')}
            </p>

            {/* The screen's primary action, at the top where a primary action belongs. It used to sit
                under the table, below the fold on any site with a few channels. */}
            {!!filteredChannels.length && !draft && <button className='button button-primary' onClick={() => setDraft({ ...blank })}>
                {isJson ? __('Add JSON feed', 'b-slider') : isRss ? __('Add RSS feed', 'b-slider') : isInstagram ? __('Add Instagram Account', 'b-slider') : __('Add channel', 'b-slider')}
            </button>}
        </div>

        {/* `role="status"` rather than an alert: saving worked, so this is worth announcing but not
            worth interrupting whatever the screen reader was already saying. */}
        {!!saved && <div className='bsbConfigureNotice is-ok' role='status'>
            <span className='bsbNoticeIcon'>{tickIcon}</span>

            <span className='bsbNoticeText'>
                <strong>{sprintf(
                    /* translators: %s: the channel's name */
                    __('“%s” is saved', 'b-slider'),
                    saved
                )}</strong>
                {/* The old wording — "available to every slider on this site" — was true and told
                    nobody where to go next. This one names the place. */}
                <span>{__('Every slider can pick it now, from the Feed Settings panel in the editor.', 'b-slider')}</span>
            </span>

            <button
                type='button'
                className='bsbNoticeClose'
                aria-label={__('Dismiss this message', 'b-slider')}
                onClick={() => setSaved('')}
            >
                {crossIcon}
            </button>
        </div>}

        {/* Same shape as the success notice above it — an icon on one and not the other made the two
            look like they came from different screens. `is-error` is the component's default tone,
            so it sets no variables of its own. */}
        {!!library.error && !draft && <div className='bsbConfigureNotice is-error'>
            <span className='bsbNoticeIcon'>{alertIcon}</span>
            <span className='bsbNoticeText'>{library.error}</span>
        </div>}

        {/* Nothing saved yet: the empty state is the call to action rather than a note about one. */}
        {!filteredChannels.length && !draft && <div className='bsbEmptyPanel'>
            <span className='bsbEmptyPanelIcon'>
                <svg viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                    <path d='M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4a2.5 2.5 0 0 0-1.8 1.8C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.7 19 12 19 12 19s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8Z' stroke='currentColor' strokeWidth='1.5' strokeLinejoin='round' />
                    <path d='M10 9.2v5.6l5-2.8-5-2.8Z' fill='currentColor' />
                </svg>
            </span>

            <h3>{isJson ? __('No JSON feeds saved yet', 'b-slider') : isRss ? __('No RSS feeds saved yet', 'b-slider') : isInstagram ? __('No Instagram accounts saved yet', 'b-slider') : __('No channels saved yet', 'b-slider')}</h3>
            <p>{isJson
                ? __('A saved JSON feed is an address kept once for the whole site. Any slider can pick it, and correcting it here corrects every slider at once.', 'b-slider')
                : isRss 
                ? __('A saved RSS feed is an address kept once for the whole site. Any slider can pick it, and correcting it here corrects every slider at once.', 'b-slider')
                : isInstagram
                ? __('A saved Instagram connection is kept once for the whole site. Any slider can pick it, and correcting it here corrects every slider at once.', 'b-slider')
                : __('A saved channel is an address kept once for the whole site. Any slider can pick it, and correcting it here corrects every slider at once.', 'b-slider')}</p>

            <button className='button button-primary button-hero' onClick={() => setDraft({ ...blank })}>
                {isJson ? __('Add your first JSON feed', 'b-slider') : isRss ? __('Add your first RSS feed', 'b-slider') : isInstagram ? __('Add your first Instagram Account', 'b-slider') : __('Add your first channel', 'b-slider')}
            </button>
        </div>}

        {(!!filteredChannels.length || isAdding) && <table className='bsbUsageTable bsbChannelTable'>
            <thead>
                <tr>
                    <th scope='col'>{(isRss || isJson) ? __('Feed Name', 'b-slider') : isInstagram ? __('Account / Username', 'b-slider') : __('Feed / Channel', 'b-slider')}</th>
                    {/* No "Videos" column any more. It printed the channel's own `per_page`, a default
                        nothing could read back — see the note in ChannelForm. "Imported" stays: that
                        one counts what is really on this site. */}
                    {(!isRss && !isJson && !isInstagram) && <th scope='col' className='num'>{__('Imported', 'b-slider')}</th>}
                    <th scope='col'>{__('Used by', 'b-slider')}</th>
                    <th scope='col'><span className='screen-reader-text'>{__('Actions', 'b-slider')}</span></th>
                </tr>
            </thead>

            <tbody>
                {/* Adding opens at the top; editing opens under the row it belongs to. */}
                {isAdding && <ChannelForm {...formProps} />}

                {filteredChannels.map(channel => [
                    // `data-label` is what the narrow layout prints in front of each cell once the
                    // columns stack — the header row is off screen by then, and a bare "12" under a
                    // channel name says nothing.
                    <tr key={channel.id} className={draft?.id === channel.id ? 'is-editing' : ''}>
                        <td data-label={isInstagram ? __('Account / Username', 'b-slider') : (isRss || isJson) ? __('Feed Name', 'b-slider') : __('Feed / Channel', 'b-slider')}>
                            <span className='bsbChannelCell'>
                                <span className='bsbChannelAvatar'>
                                    {channel.avatar ? (
                                        <img src={channel.avatar} alt='' style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        (channel.label || '?').trim().charAt(0).toUpperCase()
                                    )}
                                </span>
                                <span className='bsbChannelIdent'>
                                    <strong>
                                        {channel.label}
                                        <span className='bsb_feed_type_tag' style={{
                                            fontSize: '10px',
                                            textTransform: 'uppercase',
                                            background: '#f1f1f1',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            marginLeft: '8px',
                                            fontWeight: 'normal',
                                            color: '#666'
                                        }}>
                                            {channel.feedType === 'rss' ? 'RSS' : channel.feedType === 'json' ? 'JSON' : channel.feedType === 'instagram' ? 'Instagram' : 'YouTube'}
                                        </span>
                                    </strong>
                                    {/* The address lives with the name rather than in a column of its
                                        own, where a pasted URL squeezed everything else off screen. */}
                                    <code>{channel.sourceMasked || channel.source}</code>
                                    {/* An Instagram connection is the one address here that can
                                        stop working on its own. Said next to the account rather
                                        than only in a notice, so somebody who came here to check
                                        finds the answer where they looked. */}
                                    {!!tokenNote(channel) && <em className={`bsbTokenNote is-${channel.tokenState}`}>
                                        {tokenNote(channel)}
                                    </em>}
                                </span>
                            </span>
                        </td>

                        {(!isRss && !isJson && !isInstagram) && <td className='num' data-label={__('Imported', 'b-slider')}>
                            {channel.videos
                                ? channel.videos
                                : <span className='bsbMuted'>{__('none', 'b-slider')}</span>}
                        </td>}

                        {/* One chip per slider rather than a comma-separated run: the titles are
                            arbitrary length, and a row using four sliders used to read as a
                            paragraph wrapped inside a table cell. */}
                        <td data-label={__('Used by', 'b-slider')}>
                            {channel.usedBy.length
                                ? <span className='bsbUsedList'>
                                    {channel.usedBy.map((use, n) => use.editUrl
                                        ? <a key={n} className='bsbUsedChip' href={use.editUrl}>{use.title}</a>
                                        : <span key={n} className='bsbUsedChip'>{use.title}</span>)}
                                </span>
                                : <span className='bsbMuted'>{__('no slider yet', 'b-slider')}</span>}
                        </td>

                        <td className='act'>
                            <span className='bsbRowActions'>
                                <button
                                    className='button'
                                    disabled={library.saving}
                                    onClick={() => { setSaved(''); setDraft({ ...blank, ...channel }); }}
                                >
                                    {__('Edit', 'b-slider')}
                                </button>
                                <button className='button-link bsbRemoveLink' disabled={library.saving} onClick={() => remove(channel)}>
                                    {__('Remove', 'b-slider')}
                                </button>
                            </span>
                        </td>
                    </tr>,

                    draft?.id === channel.id && <ChannelForm key={`${channel.id}-form`} {...formProps} />
                ])}
            </tbody>
        </table>}
    </div>;
};

export default Channels;

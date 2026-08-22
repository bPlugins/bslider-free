import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import useYouTubeKey from '../../../hooks/useYouTubeKey';

/**
 * The credentials this plugin holds, in the one place a site owner would look for them.
 *
 * A key is a site setting, not a slider setting — one key serves every slider — so this is its real
 * home. The block's own panel keeps a copy of the control because that is where its absence is felt
 * (the video count is capped without it), and both drive the same hook and the same route.
 *
 * Built to grow: the roadmap adds Unsplash and Pexels keys for the stock library, so each service is
 * a section of its own rather than this page being about YouTube.
 */
const Integrations = () => {
    const key = useYouTubeKey();
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    // Google OAuth State
    const [oauth, setOauth] = useState({
        clientId: '',
        clientSecret: '',
        hasClientId: false,
        hasClientSecret: false,
        inheritedId: false,
        inheritedSecret: false,
        canManage: false,
        loading: true,
        saving: false,
        error: '',
    });
    const [oauthOpen, setOauthOpen] = useState(false);
    const [clientIdInput, setClientIdInput] = useState('');
    const [clientSecretInput, setClientSecretInput] = useState('');

    useEffect(() => {
        let cancelled = false;

        apiFetch({ path: '/bsb/v1/youtube-oauth' })
            .then(res => {
                if (!cancelled) {
                    setOauth({
                        clientId: res.clientId || '',
                        clientSecret: res.clientSecret || '',
                        hasClientId: !!res.hasClientId,
                        hasClientSecret: !!res.hasClientSecret,
                        inheritedId: !!res.inheritedId,
                        inheritedSecret: !!res.inheritedSecret,
                        canManage: !!res.canManage,
                        loading: false,
                        saving: false,
                        error: '',
                    });
                    setClientIdInput(res.clientId || '');
                    setClientSecretInput(res.clientSecret || '');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOauth(prev => ({ ...prev, loading: false }));
                }
            });

        return () => { cancelled = true; };
    }, []);

    const save = value => key.save(value).then(saved => {
        if (saved) {
            setInput('');
            setIsOpen(false);
        }
    });

    const saveOAuth = (clientId, clientSecret) => {
        setOauth(prev => ({ ...prev, saving: true, error: '' }));

        return apiFetch({
            path: '/bsb/v1/youtube-oauth',
            method: 'POST',
            data: { clientId, clientSecret }
        }).then(res => {
            setOauth({
                clientId: res.clientId || '',
                clientSecret: res.clientSecret || '',
                hasClientId: !!res.hasClientId,
                hasClientSecret: !!res.hasClientSecret,
                inheritedId: !!res.inheritedId,
                inheritedSecret: !!res.inheritedSecret,
                canManage: !!res.canManage,
                loading: false,
                saving: false,
                error: '',
            });
            setClientIdInput(res.clientId || '');
            setClientSecretInput(res.clientSecret || '');
            setOauthOpen(false);
        }).catch(err => {
            setOauth(prev => ({
                ...prev,
                saving: false,
                error: err?.message || __('The credentials could not be saved.', 'b-slider')
            }));
        });
    };

    return <div className='bsbSettingsSection'>
        <p className='bsbSectionIntro'>
            {__('Keys are stored on this site and never written into a page, so they are not visible to visitors.', 'b-slider')}
        </p>

        <div className='bsbIntegration'>
            <div className='bsbIntegrationHead'>
                <div>
                    <strong>{__('YouTube Data API', 'b-slider')}</strong>
                    <span className='bsbIntegrationMeta'>
                        {__('Optional. Without a key a channel’s public feed gives 15 videos and is rate-limited by YouTube; with one you get up to 200, plus each video’s length and view count.', 'b-slider')}
                    </span>
                </div>

                <span className={`bsbBadge ${key.hasKey ? 'is-on' : ''}`}>
                    {key.loading
                        ? __('Checking…', 'b-slider')
                        : key.hasKey ? __('Connected', 'b-slider') : __('Not set', 'b-slider')}
                </span>
            </div>

            {!key.loading && <div className='bsbIntegrationBody'>
                {key.hasKey && !isOpen && <p className='bsbKeyState'>
                    {key.inherited
                        ? __('Using the key from the Video Gallery for YouTube plugin.', 'b-slider')
                        : sprintf(
                            /* translators: %s: the last four characters of the saved key */
                            __('Key saved (%s).', 'b-slider'),
                            key.masked
                        )}
                </p>}

                {!key.hasKey && !isOpen && <p className='bsbKeyState'>
                    {__('Sliders are reading the public feed.', 'b-slider')}
                </p>}

                {isOpen && <>
                    <input
                        type='text'
                        className='regular-text'
                        value={input}
                        placeholder='AIza…'
                        onChange={e => setInput(e.target.value)}
                    />

                    <p className='bsbKeyHelp'>
                        {__('A YouTube Data API v3 key from the Google Cloud Console. Under API restrictions choose YouTube Data API v3; leave Application restrictions as None or restrict by IP — a referrer restriction will always fail, because the request is made by your server and carries no referrer.', 'b-slider')}
                    </p>

                    {!!key.error && <p className='bsbKeyError'>{key.error}</p>}
                </>}

                <div className='bsbIntegrationActions'>
                    {!isOpen && key.canManage && <button className='button' onClick={() => setIsOpen(true)}>
                        {key.hasKey ? __('Change key', 'b-slider') : __('Add key', 'b-slider')}
                    </button>}

                    {isOpen && <>
                        <button
                            className='button button-primary'
                            disabled={key.saving || !input.trim()}
                            onClick={() => save(input.trim())}
                        >
                            {key.saving ? __('Saving…', 'b-slider') : __('Save key', 'b-slider')}
                        </button>

                        <button className='button' disabled={key.saving} onClick={() => { setInput(''); setIsOpen(false); }}>
                            {__('Cancel', 'b-slider')}
                        </button>
                    </>}

                    {key.hasKey && !key.inherited && !isOpen && key.canManage && <button
                        className='button-link bsbRemoveLink'
                        disabled={key.saving}
                        onClick={() => save('')}
                    >
                        {__('Remove', 'b-slider')}
                    </button>}

                    {!key.canManage && <span className='bsbIntegrationMeta'>
                        {__('Only an administrator can change this.', 'b-slider')}
                    </span>}
                </div>
            </div>}
        </div>

        {/* Google OAuth Credentials Integration */}
        <div className='bsbIntegration' style={{ marginTop: '20px' }}>
            <div className='bsbIntegrationHead'>
                <div>
                    <strong>{__('YouTube OAuth Application Credentials', 'b-slider')}</strong>
                    <span className='bsbIntegrationMeta'>
                        {__('Required for displaying private or unlisted videos in the slider.', 'b-slider')}
                    </span>
                </div>

                <span className={`bsbBadge ${oauth.hasClientId && oauth.hasClientSecret ? 'is-on' : ''}`}>
                    {oauth.loading
                        ? __('Checking…', 'b-slider')
                        : (oauth.hasClientId && oauth.hasClientSecret) ? __('Connected', 'b-slider') : __('Not set', 'b-slider')}
                </span>
            </div>

            {!oauth.loading && <div className='bsbIntegrationBody'>
                {oauth.hasClientId && oauth.hasClientSecret && !oauthOpen && <p className='bsbKeyState'>
                    {oauth.inheritedId || oauth.inheritedSecret
                        ? __('Using client credentials defined in wp-config.php.', 'b-slider')
                        : sprintf(
                            /* translators: 1: last characters of the client ID, 2: last characters of the client secret */
                            __('OAuth credentials saved (Client ID ending %1$s, Client Secret ending %2$s).', 'b-slider'),
                            oauth.clientId,
                            oauth.clientSecret
                        )}
                </p>}

                {(!oauth.hasClientId || !oauth.hasClientSecret) && !oauthOpen && <p className='bsbKeyState'>
                    {__('OAuth credentials are not set.', 'b-slider')}
                </p>}

                {oauthOpen && <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                {__('Google Client ID', 'b-slider')}
                            </label>
                            <input
                                type='text'
                                className='regular-text'
                                style={{ width: '100%', maxWidth: '400px' }}
                                value={clientIdInput}
                                placeholder={oauth.hasClientId ? __('Leave blank to keep saved ID', 'b-slider') : 'e.g. 12345-abcde.apps.googleusercontent.com'}
                                onChange={e => setClientIdInput(e.target.value)}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                {__('Google Client Secret', 'b-slider')}
                            </label>
                            <input
                                type='password'
                                className='regular-text'
                                style={{ width: '100%', maxWidth: '400px' }}
                                value={clientSecretInput}
                                placeholder={oauth.hasClientSecret ? __('Leave blank to keep saved Secret', 'b-slider') : 'e.g. GOCSPX-1a2b3c4d'}
                                onChange={e => setClientSecretInput(e.target.value)}
                            />
                        </div>
                    </div>

                    <p className='bsbKeyHelp'>
                        {__('A Google OAuth 2.0 Web Application credential Client ID and Client Secret from the Google Cloud Console. These credentials are used to refresh access tokens for channels that require private/protected video access.', 'b-slider')}
                    </p>

                    {!!oauth.error && <p className='bsbKeyError'>{oauth.error}</p>}
                </>}

                <div className='bsbIntegrationActions'>
                    {!oauthOpen && oauth.canManage && <button className='button' onClick={() => setOauthOpen(true)}>
                        {oauth.hasClientId && oauth.hasClientSecret ? __('Change credentials', 'b-slider') : __('Add credentials', 'b-slider')}
                    </button>}

                    {oauthOpen && <>
                        <button
                            className='button button-primary'
                            disabled={oauth.saving || (!clientIdInput.trim() && !clientSecretInput.trim() && !oauth.hasClientId && !oauth.hasClientSecret)}
                            onClick={() => saveOAuth(clientIdInput.trim(), clientSecretInput.trim())}
                        >
                            {oauth.saving ? __('Saving…', 'b-slider') : __('Save credentials', 'b-slider')}
                        </button>

                        <button className='button' disabled={oauth.saving} onClick={() => { setClientIdInput(oauth.clientId); setClientSecretInput(oauth.clientSecret); setOauthOpen(false); }}>
                            {__('Cancel', 'b-slider')}
                        </button>
                    </>}

                    {oauth.hasClientId && oauth.hasClientSecret && !oauth.inheritedId && !oauthOpen && oauth.canManage && <button
                        className='button-link bsbRemoveLink'
                        disabled={oauth.saving}
                        onClick={() => saveOAuth('', '')}
                    >
                        {__('Remove', 'b-slider')}
                    </button>}

                    {!oauth.canManage && <span className='bsbIntegrationMeta'>
                        {__('Only an administrator can change this.', 'b-slider')}
                    </span>}
                </div>
            </div>}
        </div>
    </div>;
};

export default Integrations;

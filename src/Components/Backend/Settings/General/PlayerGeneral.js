import { __ } from '@wordpress/i18n';
import { CheckboxControl, SelectControl, ToggleControl } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import FieldGroup from '../../../Panel/FieldGroup';
import { TipToggle, TipRange } from '../../../Panel/TipField';
import { BControlPro } from '../../../../../../bpl-tools/ProControls';
import { ColorControl, Label, Notice } from '../../../../../../bpl-tools/Components';
import { HTML5_ONLY, PLAYER_DEFAULTS, playerConf } from '../../../../utils/config';

const RATIO_OPTIONS = [
    { label: __('From the video itself', 'b-slider'), value: '' },
    { label: '16:9', value: '16:9' },
    { label: '4:3', value: '4:3' },
    { label: '1:1', value: '1:1' },
    { label: '21:9', value: '21:9' },
    { label: __('9:16 (vertical)', 'b-slider'), value: '9:16' }
];

/**
 * Every button Plyr can put in the bar, in the order it draws them.
 *
 * `pro: true` marks the ones a licence buys; they are filtered out below rather than listed and
 * disabled, so the panel offers nothing that would not work if it were pressed.
 */
const CONTROL_ITEMS = [
    { key: 'play-large', label: __('Play Large', 'b-slider') },
    { key: 'restart', label: __('Restart', 'b-slider') },
    { key: 'rewind', label: __('Rewind', 'b-slider') },
    { key: 'play', label: __('Play', 'b-slider') },
    { key: 'fast-forward', label: __('Fast Forward', 'b-slider') },
    { key: 'progress', label: __('Progress', 'b-slider') },
    { key: 'current-time', label: __('Current Time', 'b-slider') },
    { key: 'mute', label: __('Mute', 'b-slider') },
    { key: 'volume', label: __('Volume', 'b-slider') },
    { key: 'pip', label: __('PIP', 'b-slider'), pro: true },
    { key: 'airplay', label: __('Airplay', 'b-slider'), pro: true },
    { key: 'settings', label: __('Settings', 'b-slider') },
    { key: 'download', label: __('Download', 'b-slider'), pro: true },
    { key: 'fullscreen', label: __('Fullscreen', 'b-slider') }
];

/** What the gear button opens. */
const SETTINGS_ITEMS = [
    { key: 'quality', label: __('Quality', 'b-slider') },
    { key: 'speed', label: __('Speed', 'b-slider') }
];

/**
 * Plyr's settings, for whichever source is using Plyr.
 *
 * Both sources play through the same component and the same `plyrConfig()`, so both are configured
 * here: the video source's own file, and a feed slide's video in the lightbox. `isFeed` is not about
 * which panel to draw but about which settings YouTube can actually honour — see the two lists above.
 *
 * Everything lands in `videoConf`, the attribute `plyrConfig()` already read. Flat keys, so each
 * control is one `updateObject` call; the nested shape Plyr wants is assembled there, not here.
 */
/**
 * The Premium line that stands where a group of locked controls would have been.
 *
 * One per section rather than one per panel. The panel used to end with a single notice naming
 * every locked control in it — eleven of them in one sentence, a paragraph of running text in a
 * 280px sidebar that said little and took up more room than the controls it described.
 *
 * Beside the group it belongs to, a short list is read as a caption on that group: three or four
 * names the reader can match to the heading directly above. Nothing is hidden that was not hidden
 * before; the same information is simply where it applies.
 */
const ProLine = ({ children }) => (
    <Notice className="mt10" status="premium" isIcon={true}>
        {children}
    </Notice>
);

const PlayerGeneral = ({ attributes, setAttributes, updateObject, premiumProps, isFeed = false }) => {
    const { videoConf, sourceType, socialQuery } = attributes;
    const {
        feedType,
        usePlyr = true,
        ytAutoplay = true,
        ytMute = false,
        ytKeyboard = true,
        ytNoCookie = true,
        igAutoplay = true,
        igMute = true
    } = socialQuery || {};

    const isNativeYouTube = 'social' === sourceType && 'youtube' === feedType && usePlyr === false;
    const isNativeInstagram = 'social' === sourceType && 'instagram' === feedType && usePlyr === false;
    const isNativePlayer = isNativeYouTube || isNativeInstagram;

    const conf = playerConf(videoConf);
    const { controls, settingsMenu } = conf;

    /**
     * Nothing is written back to hold the Premium settings down.
     *
     * The earlier version of this file ran an effect on mount that forced Repeat, Reset On End and
     * the Fullscreen button to their free values. Two things were wrong with it: `videoConf` ships
     * with `fullscreen: true`, so it fired for *every* video slider and marked a post dirty the
     * moment its panel was opened — and it quietly rewrote a block that had been configured with a
     * licence, so opening it here once cost settings that would not come back on renewal.
     *
     * The panel simply does not offer them, the way `VideoGeneral` does not offer the six Premium
     * buttons: the controls are filtered out and a notice names them. What the free *player* honours
     * is `plyrConfig`'s business, and it reads the same `HTML5_ONLY` list this panel does.
     */

    /** One key inside one of the two nested objects — `controls` and `settingsMenu`. */
    const updateChild = (child, key, val) => setAttributes({
        videoConf: { ...videoConf, [child]: { ...(conf[child] || {}), [key]: val } }
    });

    const set = (key, val) => updateObject('videoConf', key, val);

    /** Hidden for a feed exactly where the player would drop it — one list, in `HTML5_ONLY`. */
    const forHere = group => item => !(isFeed && HTML5_ONLY[group].includes(item.key));

    /**
     * Which player a click opens, and the reason it is printed twice.
     *
     * This switch decides which panels exist: on, and the four Plyr panels are drawn; off, and the
     * early return below replaces all four with the single native one. So it has to appear in both
     * branches. Rendered only in the Plyr branch it would take itself off the screen the moment
     * somebody used it — the switch gone along with the panels it hid — and the only way back would be
     * to reset the block. Only YouTube is offered the choice; `youtube_video` has no native panel to
     * switch to.
     *
     * It lived in `SocialFiltering` before, which is a panel about which videos arrive rather than
     * what plays them.
     */
    const playerChoice = ('youtube' === feedType || 'instagram' === feedType) && (
        <TipToggle
            className='mt15'
            label={__('Use Custom Video Player Interface (Plyr)', 'b-slider')}
            checked={usePlyr}
            onChange={val => updateObject('socialQuery', 'usePlyr', val)}
            tip={__('Enable Plyr custom HTML5 player. Disable to use native player.', 'b-slider')}
        />
    );

    if (isNativePlayer) {
        return (
            isNativeYouTube ? (
                <PanelBody className='bPlPanelBody' title={__('YouTube Native Controls', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={true}>
                    {playerChoice}

                    <ToggleControl
                        className='mt15'
                        label={__('Autoplay', 'b-slider')}
                        checked={ytAutoplay}
                        onChange={val => updateObject('socialQuery', 'ytAutoplay', val)}
                    />
                    <ToggleControl
                        className='mt15'
                        label={__('Mute by Default', 'b-slider')}
                        checked={ytMute}
                        onChange={val => updateObject('socialQuery', 'ytMute', val)}
                    />
                    <ProLine>{__('Show Player Controls, Show Fullscreen Button', 'b-slider')}</ProLine>
                    <ToggleControl
                        className='mt15'
                        label={__('Enable Keyboard Shortcuts', 'b-slider')}
                        checked={ytKeyboard}
                        onChange={val => updateObject('socialQuery', 'ytKeyboard', val)}
                    />
                    <ProLine>{__('Always Show Subtitles/Captions', 'b-slider')}</ProLine>
                    <ToggleControl
                        className='mt15'
                        label={__('Privacy-Enhanced Mode', 'b-slider')}
                        checked={ytNoCookie}
                        onChange={val => updateObject('socialQuery', 'ytNoCookie', val)}
                    />
                    <ProLine>{__('Recommend Videos from Other Channels, Lazy Load Video', 'b-slider')}</ProLine>
                </PanelBody>
            ) : (
                <PanelBody className='bPlPanelBody' title={__('Instagram Native Controls', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={true}>
                    {playerChoice}

                    <ToggleControl
                        className='mt15'
                        label={__('Autoplay', 'b-slider')}
                        checked={igAutoplay}
                        onChange={val => updateObject('socialQuery', 'igAutoplay', val)}
                    />
                    <ToggleControl
                        className='mt15'
                        label={__('Mute by Default', 'b-slider')}
                        checked={igMute}
                        onChange={val => updateObject('socialQuery', 'igMute', val)}
                    />
                    <ProLine>{__('Show Player Controls, Loop Video', 'b-slider')}</ProLine>
                </PanelBody>
            )
        );
    }

    return <>
        {/* Player, Control Bar, Player Interface and YouTube were four separate panels, every one of
            them about the same Plyr instance and none of them long enough on its own to earn a whole
            row in the sidebar's accordion. One panel now, with a `FieldGroup` heading standing in for
            each former title — the same split, without a scroll between the pieces of it. */}
        <PanelBody className='bPlPanelBody' title={__('Player', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
            {/* First, because it is the question the rest of the panel depends on: everything below
                configures Plyr, and this is what decides whether Plyr is the player at all. */}
            {playerChoice}

            <FieldGroup title={__('Playback', 'b-slider')} />

            <ProLine>{__('Repeat', 'b-slider')}</ProLine>

            <ToggleControl className='mt15' label={__('Muted', 'b-slider')} checked={conf.muted} onChange={val => set('muted', val)} />

            {/* The volume is what a player starts at, so it says nothing while the slider is muted —
                Plyr is handed 0 either way, and offering a number that cannot take effect only invites
                the bug report that it does not.

                And what it starts at is only this number when the visitor's browser has nothing to say
                instead. Plyr's volume setter reads `storage.get('volume')` before it falls back to
                `config.volume`, so a stored value wins outright — and it is stored sooner than "the
                visitor changed it" suggests: listeners are bound before the setter runs, so building the
                very first player fires `volumechange` and writes the resolved volume under the `plyr`
                key. Which means raising this setting later does nothing for anyone who has already
                played a video here, and `storage.enabled: false` — Remember Settings off — is the only
                state where it governs every visit. Read from the minified build, since that is what
                ships. Hence two help texts rather than one sentence hedging both ways. */}
            {!conf.muted && <TipRange
                className='mt15'
                label={__('Default Volume', 'b-slider')}
                value={conf.volume}
                onChange={val => set('volume', val)}
                min={0}
                max={100}
                step={5}
                tip={__('Where the player starts. Muted overrides it.', 'b-slider')}
            />}


            {/* There was a "Pause Others" toggle here, wired to Plyr's `autopause`. It never did
                anything: every one of that option's six appearances in plyr.min.js is either its own
                default or a call into Vimeo's API — `new Vimeo.Player({autopause})` and
                `embed.setAutopause()` — and there is no Vimeo here, since the video source plays an mp4
                and a feed slide is a YouTube embed. Removing it changes no slider's behaviour.

                What the toggle claimed to do is true anyway wherever a popup is involved, and by our own
                code rather than Plyr's: `playOnly` in `bsb_fancybox_options` allows exactly one player to
                run. The one gap it leaves is a Video slider with Popup off, where every slide gets its own
                inline player and a grid can show several at once — nothing pauses those. Worth fixing, but
                unconditionally rather than as a setting: two videos playing at once is not a preference. */}
            <ProLine>{__('Click To Play, Reset On End, Remember Settings', 'b-slider')}</ProLine>

            <TipToggle className='mt15' label={__('Play Inline', 'b-slider')} checked={conf.playsinline} onChange={val => set('playsinline', val)} tip={__('Off sends iPhones to their own full-screen player as soon as playback starts.', 'b-slider')} />

            <TipRange
                className='mt15'
                label={__('Seek Step (seconds)', 'b-slider')}
                value={conf.seekTime}
                onChange={val => set('seekTime', val)}
                min={1}
                max={60}
                step={1}
                tip={__('How far the rewind and fast-forward buttons jump.', 'b-slider')}
            />

            <SelectControl
                className='mt15'
                label={__('Aspect Ratio', 'b-slider')}
                value={conf.ratio}
                options={RATIO_OPTIONS}
                onChange={val => set('ratio', val)}
            />

            <ProLine>{__('Playback Speed', 'b-slider')}</ProLine>

            <FieldGroup title={__('The control bar', 'b-slider')} />

            {CONTROL_ITEMS.filter(forHere('controls'))
                .filter(({ key }) => !['settings', 'fullscreen'].includes(key))
                .map(({ key, label, pro }) => pro
                ? <BControlPro
                    key={key}
                    className='mt15'
                    label={label}
                    checked={!!controls?.[key]}
                    onChange={val => updateChild('controls', key, val)}
                    Component={ToggleControl}
                    {...premiumProps}
                />
                : <ToggleControl
                    key={key}
                    className='mt15'
                    label={label}
                    checked={!!controls?.[key]}
                    onChange={val => updateChild('controls', key, val)}
                />)}
            {/* These three are filtered out of the list above rather than drawn locked, so without a
                line here they would simply be absent with nothing to say why. */}
            <ProLine>{__('Settings, Fullscreen buttons', 'b-slider')}</ProLine>

            {/* The gear itself is the `settings` control above; this is what it opens. Worth saying so,
                because an empty menu and a hidden gear look the same from the front. */}
            <Label className='mt15 mb5'>{__('Settings Menu', 'b-slider')}</Label>

            <div className='bsb_choice_row'>
                {SETTINGS_ITEMS.filter(forHere('settings'))
                    .filter(({ key }) => key !== 'speed')
                    .map(({ key, label }) => <CheckboxControl
                        key={key}
                        label={label}
                        checked={!!settingsMenu?.[key]}
                        onChange={val => updateChild('settingsMenu', key, val)}
                    />)}
            </div>
            <ProLine>{__('Speed menu option', 'b-slider')}</ProLine>

            <FieldGroup title={__('The interface', 'b-slider')} />

            {/* Plyr's own two colours, and the defaults are Plyr's own values rather than blank — the
                swatch has to show what the player is actually doing before anybody touches it. Both are
                fed to Plyr as the custom properties its stylesheet already reads, so the whole player
                follows: the big play button, the control icons, and the pill behind a hovered control.
                See `playerVars`. */}
            <ColorControl className='mb20' label={__('Icon Background', 'b-slider')} value={conf.playerIconBg} defaultColor={PLAYER_DEFAULTS.playerIconBg} onChange={val => set('playerIconBg', val)} />

            <ColorControl className='mb20' label={__('Icon Color', 'b-slider')} value={conf.playerIconColor} defaultColor={PLAYER_DEFAULTS.playerIconColor} onChange={val => set('playerIconColor', val)} />


            <ToggleControl className='mt15' label={__('Tooltips On Controls', 'b-slider')} checked={conf.tooltipsControls} onChange={val => set('tooltipsControls', val)} />


            <TipToggle className='mt15' label={__('Count Time Down', 'b-slider')} checked={conf.invertTime} onChange={val => set('invertTime', val)} tip={__('Shows what is left rather than what has played.', 'b-slider')} />

            <ProLine>{__('Auto Hide Control, progress tooltips, Keyboard While Focused', 'b-slider')}</ProLine>

            {/* Only for a YouTube feed, because these are parameters in YouTube's own embed URL and the video
                source plays a file from this site. */}
            {isFeed && ('youtube' === feedType || 'youtube_video' === feedType) && <>
                <FieldGroup title={__('YouTube', 'b-slider')} />

                <ProLine>{__('Privacy-Enhanced Mode (GDPR)', 'b-slider')}</ProLine>

                <TipToggle className='mt15' label={__('Recommend Videos from Other Channels', 'b-slider')} checked={conf.ytRel} onChange={val => set('ytRel', val)} tip={__('If enabled, YouTube will suggest videos from other channels. If disabled, recommendations are limited to the same channel.', 'b-slider')} />

                {/* "Annotations" was here, and it is gone for the same reason "YouTube Captions On By
                    Default" below it went: a switch that could not change anything. YouTube stopped
                    showing annotations in January 2019 and removed every one of them from every video —
                    so `iv_load_policy`, the parameter this wrote, has nothing left to load or hide
                    whichever way it is set.

                    The parameter itself is still sent, hidden, in `playerVars` — the same treatment
                    `showinfo` gets there. Passing a dead parameter costs nothing; offering a control for
                    it asks somebody to make a decision that has no outcome. */}

                {/* "YouTube Captions On By Default" was here, and it is gone rather than moved. It wrote
                    the same `cc_load_policy` the Captions panel above writes, from this object, which
                    `plyrConfig` merges over Plyr's — so of two captions settings only this one reached
                    YouTube, and the panel labelled Captions governed nothing. Neither produced a visible
                    difference anyway: measured at 0 and at 1, the subtitles appeared either way, because
                    the parameter only decides for viewers who have never expressed a preference at
                    YouTube. Captions are one setting now, in the panel named after them, and enforced
                    through YouTube's own API. */}
            </>}
        </PanelBody>
    </>
}

export default PlayerGeneral;

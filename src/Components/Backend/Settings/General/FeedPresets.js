import { __ } from '@wordpress/i18n';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { isProActive } from '../../../../utils/functions';
import { presetsFor, presetAttributes } from '../../../../utils/feedPresets';
import ProCard from '../../../Panel/ProCard';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';

/**
 * The looks a feed can be started from, drawn rather than named.
 *
 * The difference between these is entirely visual, which is the same reason `PresetPicker` draws its
 * swatches instead of listing them — but a feed preset sets a layout and a header and a badge row, not
 * a fill, so the sample has to be a small picture of the whole slider rather than a pill.
 *
 * Buttons, not radios. `PresetPicker` uses radios because a field is *in* one of its presets and stays
 * there; this applies a set of values and then the user edits them, so a slider is not "in" a preset
 * afterwards and nothing here can honestly show as selected. Clicking is an action, so it is a button.
 */

/** The account row: a round avatar, two lines of text, a button. */
const HeaderRow = () => <span className="bsb_fp_header">
    <span className="bsb_fp_avatar" />
    <span className="bsb_fp_meta">
        <span className="bsb_fp_line is-name" />
        <span className="bsb_fp_line is-sub" />
    </span>
    <span className="bsb_fp_btn" />
</span>;

/**
 * The miniature, chosen by the preset's `preview`.
 *
 * A component rather than a chain of ternaries inside the card: there are five shapes now across two
 * services, and the `-nobanner` variants differ from their siblings by one element. Read as a table,
 * the shape a preset asks for is one line to check against what applying it actually produces.
 *
 * `banner` is a flag rather than another shape name because it is exactly what Instagram lacks —
 * Graph reports no cover picture, so those presets draw the account row with nothing above it.
 */
const PresetSample = ({ preview }) => {
    const banner = !preview.endsWith('-nobanner');
    const shape = preview.replace('-nobanner', '');

    /* `theater-still` is the same shape with nothing marked as a video — the arrangement RSS and
       JSON get, where the stage is a slider rather than a player. */
    if ('theater' === shape || 'theater-still' === shape) {
        const playable = 'theater' === shape;

        return <>
            <span className="bsb_fp_stage is-tall">
                {playable && <span className="bsb_fp_play" />}
            </span>
            <span className="bsb_fp_rows">
                {[0, 1].map(row => (
                    <span className="bsb_fp_row" key={row}>
                        <span className={`bsb_fp_thumb${playable ? ' is-marked' : ''}`} />
                        <span className="bsb_fp_rowbody">
                            <span className="bsb_fp_line is-title" />
                            <span className="bsb_fp_line is-meta" />
                            <span className="bsb_fp_line is-meta" />
                        </span>
                    </span>
                ))}
            </span>
        </>;
    }

    if ('stage-grid' === shape) {
        return <>
            {banner && <span className="bsb_fp_banner" />}
            <HeaderRow />
            <span className="bsb_fp_stage">
                <span className="bsb_fp_play" />
            </span>
            <span className="bsb_fp_nav">
                <span className="bsb_fp_navbtn" />
                <span className="bsb_fp_navbtn" />
            </span>
            <span className="bsb_fp_grid is-bare">
                {[0, 1, 2, 3, 4, 5].map(cell => (
                    <span className="bsb_fp_thumb is-marked" key={cell} />
                ))}
            </span>
        </>;
    }

    if ('stage-card-grid' === shape) {
        return <>
            <span className="bsb_fp_stage">
                <span className="bsb_fp_play" />
            </span>
            <span className="bsb_fp_grid">
                {[0, 1, 2].map(card => (
                    <span className="bsb_fp_card" key={card}>
                        <span className="bsb_fp_thumb" />
                        <span className="bsb_fp_line is-title" />
                        <span className="bsb_fp_line is-meta" />
                    </span>
                ))}
            </span>
        </>;
    }

    /* A JSON document describes no publisher, so this one is the grid on its own. */
    if ('grid-only' === shape) {
        return <span className="bsb_fp_grid">
            {[0, 1, 2].map(card => (
                <span className="bsb_fp_card" key={card}>
                    <span className="bsb_fp_thumb" />
                    <span className="bsb_fp_line is-title" />
                    <span className="bsb_fp_line is-meta" />
                </span>
            ))}
        </span>;
    }

    /* `header-grid`: the account over a grid of cards with their titles under them.
       `header-square` is the same thing with the cells square and nothing written under them —
       Instagram's profile grid, where the picture is the post. */
    const square = 'header-square' === shape;

    return <>
        {banner && <span className="bsb_fp_banner" />}
        <HeaderRow />
        <span className={`bsb_fp_grid${square ? ' is-square' : ''}`}>
            {[0, 1, 2].map(card => (
                <span className="bsb_fp_card" key={card}>
                    <span className="bsb_fp_thumb" />
                    {!square && <>
                        <span className="bsb_fp_line is-title" />
                        <span className="bsb_fp_line is-meta" />
                    </>}
                </span>
            ))}
        </span>
    </>;
};

const FeedPresets = ({ attributes, setAttributes, premiumProps }) => {
    const { socialQuery = {}, layoutType } = attributes;
    const feedType = socialQuery?.feedType || 'youtube';
    const presets = presetsFor(feedType);

    const isPro = premiumProps?.isPremium ?? isProActive();

    if (!presets.length) {
        return null;
    }

    return <PanelBody
        className='bPlPanelBody bsb_feed_presets_panel'
        title={__('Presets', 'b-slider')}
        initialOpen={true}
        {...(!isPro ? { badge: <PremiumBadge /> } : { badge: __('New', 'b-slider') })}
    >

        {isPro ? (
            <div className="bsb_feed_presets">
                {presets.map(preset => {
                    /**
                     * Ticked while the slider is still recognisably this preset.
                     *
                     * Two conditions, not one. `activePreset` records which card was pressed, and on its
                     * own it outlived the thing it described: press "Theater", then pick Default in
                     * Select Layout, and the slider is a plain default slider with a tick still sitting
                     * on a preset whose layout it no longer has.
                     *
                     * The layout is the right second condition because it is the one setting a preset
                     * cannot survive losing — every other value it writes is a detail the user is meant
                     * to adjust, and a tick that vanished on the first colour change would be noise. So
                     * the tick means "started here, and still that shape", and changing the layout is
                     * what clears it — no bookkeeping in the layout picker, which is where forgetting to
                     * clear it is exactly how this happened.
                     */
                    const isActive = preset.id === socialQuery?.activePreset
                        && (!preset.layoutType || preset.layoutType === (layoutType || 'default'));

                    return <button
                        key={preset.id}
                        type="button"
                        className={`bsb_feed_preset is-${preset.id}${isActive ? ' is-active' : ''}`}
                        onClick={() => setAttributes(presetAttributes(preset, attributes, feedType))}
                        /* Not `aria-pressed`: this is not a toggle — pressing it again re-applies the
                           preset rather than turning it off. `aria-current` says "this is the one in
                           use" without promising a second press would undo it. */
                        aria-current={isActive || undefined}
                    >
                        <span className="bsb_feed_preset_sample" aria-hidden="true">
                            <PresetSample preview={preset.preview} />
                        </span>

                        <span className="bsb_feed_preset_body">
                            <span className="bsb_feed_preset_name">
                                {preset.title}

                                {/* The tick, drawn rather than fetched — one inline SVG beats an icon
                                    import for a shape this simple. `aria-hidden` because `aria-current`
                                    on the button already carries the meaning to a screen reader. */}
                                {isActive && <svg className="bsb_feed_preset_tick" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                                    <path d="M6.2 11.4 3 8.2l1.1-1.1 2.1 2.1 5.6-5.6L13 4.7z" fill="currentColor" />
                                </svg>}
                            </span>
                        </span>
                    </button>;
                })}
            </div>
        ) : (
            <ProCard
                title={__('Feed Presets', 'b-slider')}
                description={__('Choose from ready-made presets to quickly style your feed slider. Each preset sets the layout, header, colors, and badges in one click.', 'b-slider')}
            />
        )}
    </PanelBody>;
};

export default FeedPresets;

import { __ } from '@wordpress/i18n';
import { DISPLAY_PRESETS } from '../../../Common/single-item/AcfFields';

/**
 * The look given to ACF fields, picked from a small sample of each.
 *
 * These are all the same pill with a different fill, so the difference between them is entirely
 * visual — a select naming them would leave the user opening the preview after every guess to find
 * out what "Ribbon" is. Each swatch is drawn by editor.scss over a dark tile, because that is the
 * background a field actually sits on: a pale preset on white would look like nothing at all.
 *
 * Used twice: for the whole set, and inside a field's panel for that field alone. The second takes
 * `withDefault`, which adds the tile for following the set — an empty value rather than a preset of
 * its own, so a field left alone keeps up with the set when the set is changed.
 *
 * Radios rather than buttons, so arrow keys walk the set and the choice is announced.
 */

const PRESET_LABELS = () => ({
    '': __('Default', 'b-slider'),
    chips: __('Chips', 'b-slider'),
    rows: __('Rows', 'b-slider'),
    card: __('Card', 'b-slider'),
    outline: __('Outline', 'b-slider'),
    plain: __('Plain', 'b-slider'),
    ribbon: __('Ribbon', 'b-slider')
});

const PresetPicker = ({
    value, name = 'bsbAcfPreset', presets = DISPLAY_PRESETS, withDefault = false, onChange
}) => {
    const labels = PRESET_LABELS();
    const choices = withDefault ? ['', ...presets] : presets;

    return <div className="bsb_preset_picker" role="radiogroup" aria-label={__('Field style', 'b-slider')}>
        {choices.map(preset => (
            <label
                key={preset || 'default'}
                className={`bsb_preset ${(value || '') === preset ? 'is-active' : ''}`}
            >
                <input
                    type="radio"
                    name={name}
                    value={preset}
                    checked={(value || '') === preset}
                    onChange={() => onChange(preset)}
                />

                {/* Two lines of sample text: `rows` is the one preset whose difference is in how
                    several fields sit together rather than in the fill, and one line cannot show it. */}
                <span className={`bsb_preset_sample bsb_preset_sample--${preset || 'default'}`} aria-hidden="true">
                    <span>{__('Price', 'b-slider')}</span>
                    <span>{__('Stock', 'b-slider')}</span>
                </span>

                <span className="bsb_preset_name">{labels[preset]}</span>
            </label>
        ))}
    </div>;
};

export default PresetPicker;

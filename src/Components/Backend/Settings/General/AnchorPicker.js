import { __ } from '@wordpress/i18n';
import { ANCHORS } from '../../../Common/single-item/AcfFields';

/**
 * The nine places a field can sit on the slide, as a 3×3 grid shaped like the slide itself.
 *
 * A select would name the same nine values, but reading "middle right" and picturing where that is
 * takes a beat; the grid is the answer. Rendered as radios so arrow keys walk it and a screen
 * reader announces the choice, with the visible cell drawn by CSS on the label.
 */

const ANCHOR_LABELS = () => ({
    'top-left': __('Top left', 'b-slider'),
    'top-center': __('Top centre', 'b-slider'),
    'top-right': __('Top right', 'b-slider'),
    'middle-left': __('Middle left', 'b-slider'),
    'middle-center': __('Middle centre', 'b-slider'),
    'middle-right': __('Middle right', 'b-slider'),
    'bottom-left': __('Bottom left', 'b-slider'),
    'bottom-center': __('Bottom centre', 'b-slider'),
    'bottom-right': __('Bottom right', 'b-slider')
});

const AnchorPicker = ({ value, name = 'bsbAcfAnchor', onChange }) => {
    const labels = ANCHOR_LABELS();

    return <div className="bsb_anchor_picker" role="radiogroup" aria-label={__('Position on the slide', 'b-slider')}>
        {ANCHORS.map(anchor => (
            <label
                key={anchor}
                className={`bsb_anchor_cell ${value === anchor ? 'is-active' : ''}`}
                title={labels[anchor]}
            >
                <input
                    type="radio"
                    name={name}
                    value={anchor}
                    checked={value === anchor}
                    onChange={() => onChange(anchor)}
                />
                <span className="screen-reader-text">{labels[anchor]}</span>
            </label>
        ))}
    </div>;
};

export default AnchorPicker;

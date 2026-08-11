import { SelectControl, ToggleControl, RangeControl, TextControl } from '@wordpress/components';
import HelpTip from './HelpTip';

/**
 * The panel's fields, each with its explanation behind a mark instead of printed under it.
 *
 * **Why wrappers rather than sixty hand-written labels.** A `HelpTip` has to go *into* a field's label —
 * that is the only part of a WordPress control a caller can put anything into — and for a toggle it has to
 * sit in a row beside it instead, because a toggle's label is the thing being pressed. Written out at every
 * call site that is two idioms to remember and sixty chances to pick the wrong one. Here it is decided
 * once: pass `tip`, get a mark.
 *
 * Anything without a `tip` renders exactly as the plain control does, so a field can be converted by
 * adding a word and nothing else has to move.
 *
 * `help` is deliberately still passed through. A few fields say something that has to be read *before* the
 * setting is touched — a warning about a token, a note that a value costs a request — and a mark somebody
 * has to hover is the wrong place for that.
 */
const withTip = (label, tip, tipLabel) => (!tip ? label : <>
    {label}
    <HelpTip label={tipLabel}>{tip}</HelpTip>
</>);

/** A select, with the mark in its label. */
export const TipSelect = ({ tip, tipLabel, label, ...props }) => (
    <SelectControl label={withTip(label, tip, tipLabel)} {...props} />
);

/** A text field, the same way. */
export const TipText = ({ tip, tipLabel, label, ...props }) => (
    <TextControl label={withTip(label, tip, tipLabel)} {...props} />
);

/** A slider, the same way. */
export const TipRange = ({ tip, tipLabel, label, ...props }) => (
    <RangeControl label={withTip(label, tip, tipLabel)} {...props} />
);

/**
 * A toggle, with the mark *beside* it rather than inside its label.
 *
 * A toggle's label is part of the switch: a press anywhere on it flips the setting, so a mark inside would
 * be a control inside a control. `.bsbTipRow` puts the two side by side and hands the row the margin the
 * toggle would have carried.
 */
export const TipToggle = ({ tip, tipLabel, className = '', ...props }) => (!tip
    ? <ToggleControl className={className} {...props} />
    : <div className={`bsbTipRow ${className}`}>
        <ToggleControl {...props} />
        <HelpTip label={tipLabel}>{tip}</HelpTip>
    </div>
);

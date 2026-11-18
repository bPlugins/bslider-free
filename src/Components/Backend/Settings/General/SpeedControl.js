import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';
import HelpTip from '../../../Panel/HelpTip';

/** Slide change time in ms; empty keeps the layout's own speed. */
export const SlideSpeed = ({ attributes, setAttributes, initial = 600, className = 'mt20' }) => <RangeControl
    className={className}
    label={<>{__('Transition Speed (ms)', 'b-slider')} <HelpTip label={__('About transition speed', 'b-slider')}>
        {__('How long one slide change takes. Reset goes back to the built-in speed.', 'b-slider')}
    </HelpTip></>}
    value={attributes.slideSpeed}
    onChange={val => setAttributes({ slideSpeed: val })}
    min={100}
    max={3000}
    step={50}
    initialPosition={initial}
    allowReset
    resetFallbackValue={undefined}
/>;

/** Seconds one slide takes to scroll past in a ticker; empty = 9. */
export const TickerSpeed = ({ attributes, setAttributes, className = 'mt10' }) => <RangeControl
    className={className}
    label={<>{__('Ticker Speed (seconds per slide)', 'b-slider')} <HelpTip label={__('About ticker speed', 'b-slider')}>
        {__('How long one slide takes to scroll past. A lower number moves faster.', 'b-slider')}
    </HelpTip></>}
    value={attributes.tickerSpeed}
    onChange={val => setAttributes({ tickerSpeed: val })}
    min={1}
    max={30}
    step={1}
    initialPosition={9}
    allowReset
    resetFallbackValue={undefined}
/>;

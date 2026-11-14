import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import HelpTip from '../../../Panel/HelpTip';
import { isRtlSlider } from '../../../../utils/functions';

/** Shown only where slides move sideways (see isRtlSlider). */
const RtlToggle = ({ attributes, setAttributes, className = 'mt10' }) => {
    if (!isRtlSlider({ ...attributes, isRtl: true })) {
        return null;
    }

    return <ToggleControl
        className={className}
        label={<>{__('Right to Left (RTL)', 'b-slider')} <HelpTip label={__('About right to left', 'b-slider')}>
            {__('For Arabic, Hebrew and other right-to-left sites. The first slide starts on the right, slides move to the left, and the next arrow sits on the left.', 'b-slider')}
        </HelpTip></>}
        checked={Boolean(attributes.isRtl)}
        onChange={val => setAttributes({ isRtl: val })}
    />;
};

export default RtlToggle;

import { __ } from '@wordpress/i18n';
import { PanelBody } from '../../../Panel/AccordionPanel';
import Controls from './Carousel/Controls';
import Notice from '../../Notice';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import RtlToggle from './RtlToggle';

const ThumbnailsGeneral = ({ attributes, setAttributes, updateObject }) => {

    const controlsProps = { attributes, setAttributes, updateObject };

    return <PanelBody className='bPlPanelBody' title={__('Thumbnails', 'b-slider')} initialOpen={false}>
        {/* Not an upsell — thumbnails only move in the front end, which the editor preview cannot show. */}
        <Notice />

        <Controls {...controlsProps} />

        <RtlToggle attributes={attributes} setAttributes={setAttributes} />

        <ProNotice features={PRO_FEATURES.thumbnailsControls} />
    </PanelBody>
}
export default ThumbnailsGeneral;

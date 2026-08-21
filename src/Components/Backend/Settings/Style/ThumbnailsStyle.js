import { __ } from '@wordpress/i18n';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { ColorControl } from '../../../../../../bpl-tools/Components';
import ProNotice from '../../../Panel/ProNotice';
import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';

/**
 * The thumbnail strip's own styling.
 *
 * Only the overlay laid over every thumbnail is free. Position, height and width are Premium, so
 * they are named in the notice rather than drawn — and the whole Active panel is Premium, so it is a
 * `ProPanel` with no controls in it at all.
 *
 * The device switcher and the two per-device fields went with them: a switcher exists to choose which
 * breakpoint a field writes to, so with no field to write there is nothing for it to switch.
 */
const ThumbnailsStyle = ({ attributes, multipleAttrChange }) => {
    const { thumbnails } = attributes;
    const { overly = {} } = thumbnails;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Thumbnails', 'b-slider')} initialOpen={false}>
            <ColorControl className='mb20' label={__('Overlay Color', 'b-slider')} value={overly?.color} defaultColor="" onChange={(val) => { multipleAttrChange('thumbnails', 'overly', 'color', val) }} />
            <small className="bsb_field_hint">{__('Tints every thumbnail. Leave it empty to show the images untouched.', 'b-slider')}</small>

            <ProNotice features={PRO_FEATURES.thumbnailsStyle} />
        </PanelBody>

        <ProPanel title={__('Thumbnails Active', 'b-slider')} proTitle={__('Premium Thumbnails Active', 'b-slider')} features={PRO_FEATURES.thumbnailsActive} />
    </>
}
export default ThumbnailsStyle;

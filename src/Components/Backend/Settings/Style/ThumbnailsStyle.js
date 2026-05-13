import { __ } from '@wordpress/i18n';
import { PanelBody } from "@wordpress/components";
import { ColorControl, Notice } from '../../../../../../bpl-tools/Components';
import { adminUrl } from '../../../../utils/functions';

const ThumbnailsStyle = ({ attributes, multipleAttrChange }) => {
    const { thumbnails } = attributes;
    const { overly = {} } = thumbnails;

    return <>
        <PanelBody className='' title={__('Thumbnails', 'b-slider')} initialOpen={false}>
            <ColorControl className='mb20' label={__('Overlay Color', 'b-slider')} value={overly?.color} defaultColor="" onChange={(val) => { multipleAttrChange('thumbnails', 'overly', 'color', val) }} />

            
        </PanelBody>


    </>
}
export default ThumbnailsStyle;
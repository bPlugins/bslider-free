import { __ } from '@wordpress/i18n';
import { PanelBody } from "@wordpress/components";
import { ColorControl, Notice } from '../../../../../../bpl-tools/Components';
import { adminUrl } from '../../../../utils/functions';
import { PremiumBadge, PremiumPanel } from '../../../../../../bpl-tools/ProControls';

const ThumbnailsStyle = ({ attributes, multipleAttrChange }) => {
    const { thumbnails } = attributes;
    const { overly = {} } = thumbnails;

    return <>
        <PanelBody className='' title={__('Thumbnails', 'b-slider')} initialOpen={false}>
            <ColorControl className='mb20' label={__('Overlay Color', 'b-slider')} value={overly?.color} defaultColor="" onChange={(val) => { multipleAttrChange('thumbnails', 'overly', 'color', val) }} />
            <Notice status='premium' isIcon={true}>{__('Position(Bottom, Top, Right, Left), Height settings are available in the Premium version.', 'b-slider')}</Notice>

        </PanelBody>

        <PanelBody className='bPlPanelBody' title={<> {__('Thumbnails Active', 'b-slider')}<PremiumBadge />
        </>} initialOpen={false}>
            <PremiumPanel title={__('Premium Thumbnails Active', 'b-slider')} description={__('Overly Color, Border  are available in the Premium version.', 'b-slider')} pricingUrl={adminUrl()} demoUrl='https://bplugins.com/products/b-slider/#demos' />
        </PanelBody>
    </>
}
export default ThumbnailsStyle;
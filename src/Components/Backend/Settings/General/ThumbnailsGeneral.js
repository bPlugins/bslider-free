import { __ } from '@wordpress/i18n';
import { PanelBody } from "@wordpress/components";
import Controls from './Carousel/Controls';
import Notice from '../../Notice';

const ThumbnailsGeneral = ({ attributes, updateObject }) => {

    const controlsProps = { attributes, updateObject };

    return <PanelBody className='bPlPanelBody' title={__('Thumbnails', 'b-slider')} initialOpen={false}>
        <Notice />
        <Controls {...controlsProps} />



    </PanelBody>
}
export default ThumbnailsGeneral;
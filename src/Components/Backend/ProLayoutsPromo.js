import { __ } from '@wordpress/i18n';
import { isProActive } from '../../utils/functions';
import { Notice } from '../../../../bpl-tools/Components';

const ProLayoutsPromo = () => {
    if (isProActive()) {
        return null;
    }

    return (
        <Notice className="mt15" status="premium" isIcon={true}>
            {__('Carousel, Grid, Thumbnails, and List layouts are available in the Premium version.', 'b-slider')}
        </Notice>
    );
};

export default ProLayoutsPromo;

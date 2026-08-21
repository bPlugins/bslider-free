/**
 * That a feed slider gets one layout here, and the rest with a licence.
 *
 * Said in two places — `SelectLayout`, where the choice is made, and the end of the General panel —
 * because the picker is a wizard step somebody passes through once and does not come back to.
 *
 * No licence check inside it: this file only exists in the free build, so there is nobody reading it
 * for whom the sentence is untrue.
 */

import { __ } from '@wordpress/i18n';
import { Notice } from '../../../../bpl-tools/Components';

const ProLayoutsPromo = () => (
    <Notice className="mt15" status="premium" isIcon={true}>
        {__('Carousel, Grid, Thumbnails, and List layouts are available in the Premium version.', 'b-slider')}
    </Notice>
);

export default ProLayoutsPromo;

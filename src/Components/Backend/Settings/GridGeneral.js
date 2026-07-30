import { __ } from '@wordpress/i18n';
import { SelectControl, RangeControl } from "@wordpress/components";
import { PanelBody } from '../../Panel/AccordionPanel';
import { paginationTypeOpt } from '../../../utils/options';
import ProNotice from '../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';
import { isPostSource } from '../../../utils/functions';

const GridGeneral = ({ attributes, updateObject }) => {
    const { grid, postsQuery, sourceType } = attributes;
    const { paginationType } = grid;
    const { per_page } = postsQuery;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Pagination', 'b-slider')} initialOpen={false}>

            {/* A queried source sets its own page size in the query panel. */}
            {!isPostSource(sourceType) && <RangeControl label={__('Per Page', 'b-slider')} labelPosition='side' className='mt10' value={per_page} onChange={val => updateObject('postsQuery', 'per_page', val)} min={1} />}

            <SelectControl label={__('Pagination Type', 'b-slider')} className='mt10' options={paginationTypeOpt} value={paginationType} onChange={val => updateObject('grid', 'paginationType', val)} />

            <ProNotice features={PRO_FEATURES.gridPagination} />

        </PanelBody>
    </>
}
export default GridGeneral;
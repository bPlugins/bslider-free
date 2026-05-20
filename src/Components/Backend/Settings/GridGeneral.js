import { __ } from '@wordpress/i18n';
import { PanelBody, SelectControl, RangeControl } from "@wordpress/components";
import { paginationTypeOpt } from '../../../utils/options';
import { Notice } from '../../../../../bpl-tools/Components';

const GridGeneral = ({ attributes, updateObject }) => {
    const { grid, postsQuery, sourceType } = attributes;
    const { paginationType } = grid;
    const { per_page } = postsQuery;

    return <>
        <PanelBody className='' title={__('Pagination', 'b-slider')} initialOpen={false}>

            {(sourceType !== 'posts' && sourceType !== 'woo') && <RangeControl label={__('Per Page', 'b-slider')} labelPosition='side' className='mt10' value={per_page} onChange={val => updateObject('postsQuery', 'per_page', val)} min={1} />}

            <SelectControl label={__('Pagination Type', 'b-slider')} className='mt10' options={paginationTypeOpt} value={paginationType} onChange={val => updateObject('grid', 'paginationType', val)} />

            <Notice status='premium' isIcon={true}>{__('Position(Left, Right, Center) settings are available in the Premium version.', 'b-slider')}</Notice>

        </PanelBody>
    </>
}
export default GridGeneral;
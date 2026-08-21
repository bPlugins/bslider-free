import { __ } from '@wordpress/i18n';
import { SelectControl, RangeControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { TipSelect, TipToggle, TipRange, TipText } from '../../../Panel/TipField';
import { alignBtnOpt, paginationTypeOpt } from '../../../../utils/options';
import { BControlPro } from '../../../../../../bpl-tools/ProControls';

const GridGeneral = ({ attributes, updateObject, multipleAttrChange, premiumProps }) => {
    const { grid, postsQuery, sourceType } = attributes;
    const { paginationType, loadMoreBtn } = grid;
    const { per_page } = postsQuery;
    const { align } = loadMoreBtn;
    const isFeed = 'social' === sourceType;

    return <>
        <PanelBody className='' title={__('Pagination', 'b-slider')} initialOpen={false}>

            {/* Offered to a feed as well now. It was hidden on the grounds that a feed is asked for its
                count under Social Filtering, so a second count here would be a page size over a set that
                never needs paging — but those two counts answer different questions. The first is how
                much to fetch from the service; this is how much of it to put on screen at once. Hiding
                it left every feed grid with a single page and no way to ask for more, which is also why
                neither the pager nor Load More ever appeared. See the note in `Grid`.

                Still hidden for posts and products: those page through the database, and their count is
                part of the query — it lives in the Post Query panel, next to what it queries. */}
            {(sourceType !== 'posts' && sourceType !== 'woo') && <TipRange
                label={__('Per Page', 'b-slider')}
                labelPosition='side'
                className='mt10'
                value={per_page}
                onChange={val => updateObject('postsQuery', 'per_page', val)}
                min={1}
                tip={__('Cards per page. The rest wait behind the pager.', 'b-slider')}
            />}

            <SelectControl label={__('Pagination Type', 'b-slider')} className='mt10' options={paginationTypeOpt} value={paginationType} onChange={val => updateObject('grid', 'paginationType', val)} />

            <BControlPro label={__('Position', 'b-slider')} className='mt10' options={alignBtnOpt} value={align} onChange={val => multipleAttrChange('grid', 'loadMoreBtn', "align", val)} Component={SelectControl} {...premiumProps} />
        </PanelBody>
    </>
}
export default GridGeneral;
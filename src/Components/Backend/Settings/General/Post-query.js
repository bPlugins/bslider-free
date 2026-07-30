import { __, sprintf } from '@wordpress/i18n';
import { RangeControl, SelectControl, __experimentalNumberControl as NumberControl, ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { Label } from '../../../../../../bpl-tools/Components';
import { filterSelected, postTypeTaxonomies } from '../../../../utils/functions';
import SelectTokenField from '../../../Panel/SelectTokenField';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import { postsOrders, postsOrdersBy } from '../../../../utils/options';

/** Everything ACF lives in its own `ACF Integration` panel — see AcfConfigure. */
const PostQuery = ({ updateObject, attributes, getTaxonomy }) => {

    const { postsQuery, sourceType } = attributes;
    const { selectedTags, selectedCategories, per_page, orderby, order, offset, isExcerptFromContent, excerptLength, post_type = 'post' } = postsQuery;

    // Which taxonomies to offer follows the post type being queried, not the source tile — the same
    // pairing the block's own query does, so both read it off `postTypeTaxonomies`.
    const { catTaxSlug, tagTaxSlug } = postTypeTaxonomies(post_type, sourceType);

    const categoriesList = getTaxonomy(catTaxSlug) || [];
    const tagsList = getTaxonomy(tagTaxSlug) || [];

    /** Every label in the panel names what is being queried; `woo` is the only one that is not posts. */
    const itemLabel = 'posts' === sourceType ? __('Post', 'b-slider') : __('Product', 'b-slider');

    return (
        <PanelBody className='bPlPanelBody' title={sprintf(__('%s Query', 'b-slider'), itemLabel)} initialOpen={false}>
            <div className="mb20">
                <Label className='mb5'>{sourceType === 'woo' ? __('Select Product Categories:', 'b-slider') : __('Select Categories:', 'b-slider')}</Label>
                <SelectTokenField
                    value={filterSelected(categoriesList, selectedCategories).map(cat => cat.toString())}
                    onChange={val => updateObject("postsQuery", "selectedCategories", val.map(cat => parseInt(cat)))}
                    options={categoriesList.map(cat => ({ label: cat.name, value: cat.id.toString() }))}
                />
            </div>

            <div className="mb20">
                <Label className="mb5">{sourceType === 'woo' ? __('Select Product Tags:', 'b-slider') : __('Select Tags:', 'b-slider')}</Label>
                <SelectTokenField
                    value={filterSelected(tagsList, selectedTags)?.map(tag => tag.toString())}
                    onChange={val => updateObject("postsQuery", "selectedTags", val.map(tag => parseInt(tag)))}
                    options={tagsList?.map(tag => ({ label: tag.name, value: tag.id.toString() }))}
                />
            </div>

            {/* The label goes through RangeControl rather than a `Label` above it, the way the
                sliders elsewhere in this plugin do it. BaseControl then owns the whole field — label
                on its own line, slider and number box sharing the row under it. */}
            <div className="mb20">
                <RangeControl
                    __nextHasNoMarginBottom
                    label={sprintf(__('%s Per Page:', 'b-slider'), itemLabel)}
                    value={per_page}
                    onChange={val => updateObject("postsQuery", "per_page", val)}
                    min={-1}
                    max={36}
                    step={1}
                />
                <small className="bsb_field_hint">{__('Set -1 to show every post.', 'b-slider')}</small>
            </div>

            <div className="mb20">
                <Label className='mb10'>{sprintf(__('%s Order By:', 'b-slider'), itemLabel)}</Label>
                <SelectControl value={orderby} onChange={val => updateObject("postsQuery", "orderby", val)} options={postsOrdersBy} />
            </div>

            <div className="mb20">
                <Label className='mb10'>{sprintf(__('%s Order:', 'b-slider'), itemLabel)}</Label>
                <SelectControl value={order} onChange={val => updateObject("postsQuery", "order", val)} options={postsOrders} />
            </div>

            <div className="mb20">
                <Label className='mb10'>{sprintf(__('%s Offset:', 'b-slider'), itemLabel)}</Label>
                {/* An emptied field parses to NaN, which would wipe the attribute. */}
                <NumberControl value={offset} onChange={val => updateObject("postsQuery", "offset", parseInt(val, 10) || 0)} min={0} />
                <small className="bsb_field_hint">{__('Skips the first N posts. Ignored when `Per Page` is -1.', 'b-slider')}</small>
            </div>

            <div className="mb20">
                <ToggleControl label={__('Show Excerpt from Content', 'b-slider')} checked={isExcerptFromContent} onChange={val => updateObject("postsQuery", "isExcerptFromContent", val)} />
            </div>

            <div className="mb20">
                <RangeControl
                    __nextHasNoMarginBottom
                    label={__('Content Length:', 'b-slider')}
                    value={excerptLength}
                    onChange={val => updateObject("postsQuery", "excerptLength", val)}
                    min={-1}
                    max={120}
                    step={1}
                />
            </div>

            {/* Pro fills this stretch of the panel with Include, Exclude and Exclude Current. Naming
                them is what the notice is for, rather than drawing three controls that do nothing. */}
            <ProNotice features={PRO_FEATURES.postQuery} />
        </PanelBody>
    );
};

export default PostQuery;

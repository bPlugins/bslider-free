import { __, sprintf } from '@wordpress/i18n';
import { RangeControl, SelectControl, __experimentalNumberControl as NumberControl, TextControl, ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { Label } from '../../../../../../bpl-tools/Components';
import { filterSelected, strToIntArr } from '../../../../utils/functions';
import { postsOrders, postsOrdersBy, safeOrderBy } from '../../../../utils/options';
import SelectTokenField from '../../../Panel/SelectTokenField';
import { BControlPro } from '../../../../../../bpl-tools/ProControls';

/** Sorting on a custom field belongs to the `ACF Query` panel — see AcfQuery. */
const PostQuery = ({ updateObject, attributes, getTaxonomy, premiumProps }) => {

    const { postsQuery, sourceType } = attributes;
    const { selectedTags, selectedCategories, per_page, orderby, order, offset, include, exclude, isExcludeCurrent, isExcerptFromContent, excerptLength, post_type = 'post', orderByField = '' } = postsQuery;

    const targetPostType = post_type || (sourceType === 'woo' ? 'product' : 'post');
    const catTaxSlug = targetPostType === 'product' ? 'product_cat' : 'category';
    const tagTaxSlug = targetPostType === 'product' ? 'product_tag' : 'post_tag';

    const categoriesList = getTaxonomy(catTaxSlug) || [];
    const tagsList = getTaxonomy(tagTaxSlug) || [];

    /**
     * This panel names posts or products depending on the source.
     *
     * The noun used to be interpolated into each label with a template literal, which left the
     * labels invisible to `make-pot` — none of them reached the .pot file, so none could be
     * translated. `sprintf` over a real translatable string fixes that and lets a translator put
     * the noun wherever their language needs it.
     */
    const noun = 'posts' === sourceType ? __('Post', 'b-slider') : __('Product', 'b-slider');

    return (
        <PanelBody className='bPlPanelBody' title={sprintf(
            // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
            __('%s Query', 'b-slider'), noun)} initialOpen={false}>
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
                    label={sprintf(
                        // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                        __('%s Per Page:', 'b-slider'), noun)}
                    value={per_page}
                    onChange={val => updateObject("postsQuery", "per_page", val)}
                    min={-1}
                    max={36}
                    step={1}
                />
                <small className="bsb_field_hint">{__('Set -1 to show every post.', 'b-slider')}</small>
            </div>

            <div className="mb20">
                <Label className='mb10'>{sprintf(
                    // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                    __('%s Order By:', 'b-slider'), noun)}</Label>
                {/**
                  * Disabled rather than hidden while a field ordering is set.
                  *
                  * The two cannot both apply — a query is sorted one way — and the field wins. Left
                  * live, this would sit here reading `Date` on a slider that is not sorted by date,
                  * with the setting that overruled it in another panel and nothing on screen joining
                  * the two. The value it keeps showing is the one it goes back to when the field is
                  * cleared, so it is worth reading even while it is off.
                  */}
                {/* Through `safeOrderBy` so a value this build no longer offers reads as the
                    default here too, rather than leaving the control blank while the slider is
                    in fact sorted by date. */}
                <SelectControl
                    value={safeOrderBy(orderby)}
                    onChange={val => updateObject("postsQuery", "orderby", val)}
                    options={postsOrdersBy}
                    disabled={!!orderByField}
                />
                {!!orderByField && <small className="bsb_field_hint">
                    {__('Not in use — the ACF Query panel is sorting by a field instead.', 'b-slider')}
                </small>}
            </div>

            <div className="mb20">
                <Label className='mb10'>{sprintf(
                    // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                    __('%s Order:', 'b-slider'), noun)}</Label>
                <SelectControl value={order} onChange={val => updateObject("postsQuery", "order", val)} options={postsOrders} />
            </div>

            <div className="mb20">
                <Label className='mb10'>{sprintf(
                    // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                    __('%s Offset:', 'b-slider'), noun)}</Label>
                {/* An emptied field parses to NaN, which would wipe the attribute. */}
                <NumberControl value={offset} onChange={val => updateObject("postsQuery", "offset", parseInt(val, 10) || 0)} min={0} />
                <small className="bsb_field_hint">{__('Skips the first N posts. Ignored when `Per Page` is -1.', 'b-slider')}</small>
            </div>

            <div className="mb20">
                <BControlPro label={sprintf(
                    // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                    __('Include %s:', 'b-slider'), noun)} value={include?.join(',')} onChange={val => updateObject("postsQuery", "include", strToIntArr(val))} Component={TextControl} {...premiumProps} />
                <small className="bsb_field_hint">{__('Comma separated IDs, e.g. 23, 45, 16', 'b-slider')}</small>
            </div>

            <div className="mb20">
                <BControlPro label={sprintf(
                    // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                    __('Exclude %s:', 'b-slider'), noun)} value={exclude?.join(',')} onChange={val => updateObject("postsQuery", "exclude", strToIntArr(val))} Component={TextControl} {...premiumProps} />
                <small className="bsb_field_hint">{__('Comma separated IDs, e.g. 23, 45, 16', 'b-slider')}</small>
            </div>

            <div className="mb20">
                <BControlPro label={sprintf(
                    // translators: %s is the content type this slider pulls, e.g. "Post" or "Product".
                    __('Exclude Current %s', 'b-slider'), noun)} checked={isExcludeCurrent} onChange={val => updateObject("postsQuery", "isExcludeCurrent", val)} Component={ToggleControl} {...premiumProps} />
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
        </PanelBody>
    );
};

export default PostQuery;
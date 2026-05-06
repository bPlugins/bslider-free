import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl, ToggleControl, PanelRow, SelectControl, __experimentalNumberControl as NumberControl } from "@wordpress/components";
import { Label, Notice } from '../../../../../../bpl-tools/Components';
import { filterSelected } from '../../../../utils/functions';
import SelectTokenField from '../../../Panel/SelectTokenField';
import { postsOrders, postsOrdersBy } from '../../../../utils/options';


const PostQuery = ({ updateObject, attributes, getTaxonomy }) => {

    const { postsQuery, sourceType } = attributes;
    const { selectedTags, selectedCategories, per_page, orderby, order, offset, isExcerptFromContent, excerptLength } = postsQuery;
    console.log(postsQuery);



    return <PanelBody className='bPlPanelBody' title={__(`${sourceType === 'posts' ? 'Post' : 'Product'} Query`, 'b-slider')} initialOpen={false}>
        {
            sourceType === 'posts' && <>
                {getTaxonomy('category')?.length ? <>
                    <Label className='mt10 mb0'>{__('Select Categories:', 'b-slider')}</Label>
                    <SelectTokenField
                        value={filterSelected(getTaxonomy('category'), selectedCategories).map(cat => cat.toString())}
                        onChange={val => updateObject("postsQuery", "selectedCategories", val.map(cat => parseInt(cat)))}
                        options={getTaxonomy('category').map(cat => ({ label: cat.name, value: cat.id.toString() }))}
                    /></> : null
                }

                <Label className="mt10 mb0">{__('Select Tags:', 'b-slider')}</Label>
                <SelectTokenField
                    className='mt20'
                    label={__('Select Tags:', 'b-slider')}
                    value={filterSelected(getTaxonomy('post_tag'), selectedTags)?.map(tag => tag.toString())}
                    onChange={val => updateObject("postsQuery", "selectedTags", val.map(tag => parseInt(tag)))}
                    options={getTaxonomy('post_tag')?.map(tag => ({ label: tag.name, value: tag.id.toString() }))} />
            </>
        }

        <Label>{__(`${sourceType === 'posts' ? 'Post' : 'Product'} Per Page:`, 'slider')}</Label>
        <RangeControl value={per_page} onChange={val => updateObject("postsQuery", "per_page", val)} min={-1} max={36} step={1} />
        <small>{__('To show all posts set -1', 'slider')}</small>

        <PanelRow className='mt20'>
            <Label className=''>{__(`${sourceType === 'posts' ? 'Post' : 'Product'} Order By:`, 'slider')}</Label>
            <SelectControl value={orderby} onChange={val => updateObject("postsQuery", "orderby", val)} options={postsOrdersBy} />
        </PanelRow>

        <PanelRow className='mt20'>
            <Label className=''>{__(`${sourceType === 'posts' ? 'Post' : 'Product'} Order:`, 'slider')}</Label>
            <SelectControl value={order} onChange={val => updateObject("postsQuery", "order", val)} options={postsOrders} />
        </PanelRow>

        <NumberControl className='mt20' label={__(`${sourceType === 'posts' ? 'Post' : 'Product'} Offset:`, 'slider')} labelPosition='left' value={offset} onChange={val => updateObject("postsQuery", "offset", parseInt(val))} min={0} />
        <small>{__('`Post Offset` will not work if `Post Per Page` is -1', 'slider')}</small>

        <ToggleControl className='mt15' label={__('Show Excerpt from Content', 'b-slider')} checked={isExcerptFromContent} onChange={val => updateObject("postsQuery", "isExcerptFromContent", val)} />

        {/* <Label className='mt15'>{__('Excerpt Length:', 'b-slider')}</Label> */}
        <Label className='mt15'>{__('Content Length:', 'b-slider')}</Label>
        <RangeControl value={excerptLength} onChange={val => updateObject("postsQuery", "excerptLength", val)} min={-1} max={120} step={1} />
        {/* <small>{__(`Set -1 to show all the ${isExcerptFromContent ? 'content' : 'excerpt'}`, 'b-slider')}</small> */}

        <Notice status='premium' isIcon={true}>{__('Include, Exclude, Current Post settings are available in the Premium version.', 'b-slider')}</Notice>
    </PanelBody >
}
export default PostQuery;
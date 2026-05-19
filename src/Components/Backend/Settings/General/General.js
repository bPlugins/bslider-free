import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { PanelBody, TextControl } from "@wordpress/components";

import { withSelect } from '@wordpress/data';
import { BtnGroup, HelpPanel, Label, Notice } from '../../../../../../bpl-tools/Components';

import MainItem from '../MainItem';
import DefaultGeneral from './DefaultGeneral';
import ThumbnailsGeneral from './ThumbnailsGeneral';
import { selectLayoutOpt, sourceTypeOpt } from '../../../../utils/options';
import PostQuery from './Post-query';
import VideoGeneral from './VideoGeneral';
import GridGeneral from '../GridGeneral';
import { AdvertiseCard } from '../../../../../../bpl-tools/ProControls';
import { adminUrl } from '../../../../utils/functions';

const General = ({ attributes, setAttributes, activeIndex, setActiveIndex, updateObject, multipleAttrChange, getTaxonomy }) => {

    const [device, setDevice] = useState('desktop');
    const [gapDevice, setGapDevice] = useState('desktop');
    const { layoutType, sourceType, button } = attributes;
    const itemsProps = { attributes, setAttributes, arrKey: 'sliders', activeIndex, setActiveIndex };

    const handleSourceSelect = (val) => {
        setAttributes({ sourceType: val });

        if (val === 'posts') {
            updateObject('postsQuery', 'post_type', 'post');
        } else if (val === 'woo') {
            updateObject('postsQuery', 'post_type', 'product');
        }
    };

    const commonProps = { attributes, setAttributes, updateObject };
    const pricingUrl = 'https://bplugins.com/products/b-slider/pricing/';

    return <>
        <HelpPanel slug="b-slider" docsLink="https://bplugins.com/docs/b-slider" />

        <PanelBody className='bPlPanelBody' title={__('Source & Layout', 'b-slider')} initialOpen={true}>
            <Label className="mt10">Source Type</Label>
            <BtnGroup value={sourceType || "image"} onChange={(val) => handleSourceSelect(val)} options={sourceTypeOpt} isIcon={true} size='default' />

            <Label className="mt10">Select Layout</Label>
            <BtnGroup value={layoutType || "default"} onChange={val => setAttributes({ layoutType: val })} options={selectLayoutOpt} isIcon={true} size='default' />
        </PanelBody>

        {(sourceType !== "posts" && sourceType !== "woo") &&
            <PanelBody className='bPlPanelBody' title={__('Slides', 'b-slider')} initialOpen={false}>
                <MainItem itemsProps={itemsProps} />

                <Notice status='premium' isIcon={true}>{__('Button label, Button Url, Open In New Tab settings are available in the Premium version.', 'b-slider')}</Notice>
            </PanelBody>}

        {(sourceType === "posts" || sourceType === "woo") && <PostQuery {...commonProps} getTaxonomy={getTaxonomy} />}
        <DefaultGeneral {...commonProps} gapDevice={gapDevice} setGapDevice={setGapDevice} device={device} setDevice={setDevice} />
        {layoutType === "grid" && <GridGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
        {layoutType === "thumbnails" && <ThumbnailsGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
        {sourceType === "video" && <VideoGeneral {...commonProps} />}

        {(sourceType == "posts" || sourceType == "woo") && <PanelBody className='bPlPanelBody' title={__('Button', 'b-slider')} initialOpen={false}>
            <TextControl label={__('Text', 'b-slider')} value={button?.text} onChange={val => updateObject('button', 'text', val)} />
        </PanelBody>}

        <AdvertiseCard planLink={adminUrl()} />
    </>
}

export default withSelect((select, { attributes }) => {

    const { getPostTypes, getTaxonomies, getEntityRecords } = select('core');
    const { getDeviceType, getCurrentPostType, getCurrentPostId } = select('core/editor');

    const { post_type } = attributes;
    const taxonomies = getTaxonomies({ per_page: -1 });

    return {
        device: getDeviceType()?.toLowerCase(),

        postTypes: getPostTypes({ per_page: -1 })?.filter(p => !['apb', 'attachment', 'nav_menu_item'].includes(p.slug) && !p.slug.startsWith('wp_'))?.map(({ name, slug }) => ({ label: name, value: slug })),

        currentPostType: getCurrentPostType(),

        currentPostId: getCurrentPostId(),

        allTaxonomies: 'post' === post_type ? taxonomies?.filter(tax => tax.types.includes('post')).filter(tax => tax.slug !== 'category' && tax.slug !== 'post_tag') : taxonomies?.filter(tax => tax.types.includes(post_type)),

        getTaxonomy: slug => getEntityRecords('taxonomy', slug, { per_page: -1 }),
    }
})(General);
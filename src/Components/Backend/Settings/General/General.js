import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SelectControl, TextControl, ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { withSelect } from '@wordpress/data';
import { HelpPanel, Label } from '../../../../../../bpl-tools/Components';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';

import MainItem from '../MainItem';
import DefaultGeneral from './DefaultGeneral';
import ThumbnailsGeneral from './ThumbnailsGeneral';
import { selectLayoutOpt, sourceTypeOpt } from '../../../../utils/options';
import PostQuery from './Post-query';
import AcfConfigure from './AcfConfigure';
import VideoGeneral from './VideoGeneral';
import GridGeneral from '../GridGeneral';
import { AdvertiseCard } from '../../../../../../bpl-tools/ProControls';
import { adminUrl, isPostSource as isQueriedSource } from '../../../../utils/functions';

const General = ({ attributes, setAttributes, activeIndex, setActiveIndex, updateObject, multipleAttrChange, getTaxonomy, postTypes, queriedPosts }) => {

    const [device, setDevice] = useState('desktop');
    const [gapDevice, setGapDevice] = useState('desktop');
    const { layoutType, sourceType, button, postsQuery } = attributes;
    const itemsProps = { attributes, setAttributes, arrKey: 'sliders', activeIndex, setActiveIndex };

    const isPostSource = isQueriedSource(sourceType);
    const currentPostType = postsQuery?.post_type || (sourceType === 'woo' ? 'product' : 'post');

    const handleSourceSelect = (val) => {
        setAttributes({ sourceType: val });

        if (val === 'woo') {
            updateObject('postsQuery', 'post_type', 'product');
        } else if (val === 'posts') {
            // A CPT already picked in the dropdown must survive re-clicking the Posts tile;
            // only a missing or product-only slug gets pushed back to the default.
            if (!postsQuery?.post_type || postsQuery.post_type === 'product') {
                updateObject('postsQuery', 'post_type', 'post');
            }
        }
    };

    // The dropdown drives both attributes: `post_type` is the real query target, while
    // `sourceType` only distinguishes WooCommerce rendering from plain post rendering.
    const handlePostTypeSelect = (val) => {
        updateObject('postsQuery', 'post_type', val);
        setAttributes({ sourceType: val === 'product' ? 'woo' : 'posts' });
    };

    const commonProps = { attributes, setAttributes, updateObject };

    return <>
        <HelpPanel slug="b-slider" docsLink="https://bplugins.com/docs/b-slider" />

        <PanelBody className='bPlPanelBody bsb_panel_source_layout' title={__('Source & Layout', 'b-slider')} initialOpen={true}>
            <Label className="mt10 mb5">{__('Source Type', 'b-slider')}</Label>
            <div className="bsb_panel_grid_selector">
                {sourceTypeOpt.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`bsb_panel_tile_btn ${(sourceType || 'image') === opt.value ? 'is-active' : ''}`}
                        onClick={() => handleSourceSelect(opt.value)}
                    >
                        <span className="bsb_tile_icon">{opt.icon}</span>
                        <span className="bsb_tile_label">{opt.label}</span>
                    </button>
                ))}
            </div>

            {isPostSource && postTypes?.length > 0 && (
                <div className="bsb_post_type_select">
                    <Label className="mt15 mb5">{__('Post Type', 'b-slider')}</Label>
                    <SelectControl value={currentPostType} onChange={handlePostTypeSelect} options={postTypes} />
                </div>
            )}

            <Label className="mt15 mb5">{__('Select Layout', 'b-slider')}</Label>
            <div className="bsb_panel_grid_selector">
                {selectLayoutOpt.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`bsb_panel_tile_btn ${(layoutType || 'default') === opt.value ? 'is-active' : ''}`}
                        onClick={() => setAttributes({ layoutType: opt.value })}
                    >
                        <span className="bsb_tile_icon">{opt.icon}</span>
                        <span className="bsb_tile_label">{opt.label}</span>
                    </button>
                ))}
            </div>
        </PanelBody>

        {!isPostSource &&
            <PanelBody className='bPlPanelBody' title={__('Slides', 'b-slider')} initialOpen={false}>
                <MainItem itemsProps={itemsProps} />

                <ProNotice features={PRO_FEATURES.slides} />
            </PanelBody>}

        {isPostSource && <PostQuery {...commonProps} getTaxonomy={getTaxonomy} />}

        {/* Renders nothing unless this post type actually has ACF fields, so a site without ACF
            never sees the panel. Sits after the query, since the fields it offers depend on the
            post type chosen there. */}
        {isPostSource && <AcfConfigure {...commonProps} queriedPosts={queriedPosts} />}
        <DefaultGeneral {...commonProps} gapDevice={gapDevice} setGapDevice={setGapDevice} device={device} setDevice={setDevice} />
        {layoutType === "grid" && <GridGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
        {layoutType === "thumbnails" && <ThumbnailsGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
        {sourceType === "video" && <VideoGeneral {...commonProps} />}

        {isPostSource && <PanelBody className='bPlPanelBody' title={__('Button', 'b-slider')} initialOpen={false}>
            {/* Older blocks have no `isVisible` key, so only an explicit `false` hides the button. */}
            <ToggleControl label={__('Show Button', 'b-slider')} checked={button?.isVisible !== false} onChange={val => updateObject('button', 'isVisible', val)} />

            {button?.isVisible !== false && <TextControl label={__('Text', 'b-slider')} value={button?.text} onChange={val => updateObject('button', 'text', val)} />}
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

        // `bsb` is the plugin's own slider post type — querying sliders inside a slider is not a
        // content source anyone means to pick.
        postTypes: getPostTypes({ per_page: -1 })?.filter(p => !['apb', 'attachment', 'nav_menu_item', 'bsb'].includes(p.slug) && !p.slug.startsWith('wp_'))?.map(({ name, slug }) => ({ label: name, value: slug })),

        currentPostType: getCurrentPostType(),

        currentPostId: getCurrentPostId(),

        allTaxonomies: 'post' === post_type ? taxonomies?.filter(tax => tax.types.includes('post')).filter(tax => tax.slug !== 'category' && tax.slug !== 'post_tag') : taxonomies?.filter(tax => tax.types.includes(post_type)),

        getTaxonomy: slug => getEntityRecords('taxonomy', slug, { per_page: -1 }),
    }
})(General);
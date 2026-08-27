import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SelectControl, TextControl, ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import HelpTip from '../../../Panel/HelpTip';

import { withSelect } from '@wordpress/data';
import { HelpPanel, Label } from '../../../../../../bpl-tools/Components';


import MainItem from '../MainItem';
import ProPostTypesPromo from '../../ProPostTypesPromo';
import ProSocialPromo from '../../ProSocialPromo';
import ProListLayoutPromo from '../../ProListLayoutPromo';
import { isPostTypeLocked } from '../../../../utils/functions';
import DefaultGeneral from './DefaultGeneral';
import GridGeneral from '../GridGeneral';
import ThumbnailsGeneral from './ThumbnailsGeneral';
import { selectLayoutOpt, sourceTypeOpt } from '../../../../utils/options';
import PostQuery from './Post-query';
import AcfConfigure from './AcfConfigure';
import PostBadges from './PostBadges';
import VideoGeneral from './VideoGeneral';
import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';

const General = ({ attributes, setAttributes, activeIndex, setActiveIndex, updateObject, multipleAttrChange, getTaxonomy, premiumProps, postTypes, queriedPosts, hasSlideBlocks }) => {

    const [device, setDevice] = useState('desktop');
    const [gapDevice, setGapDevice] = useState('desktop');
    const { layoutType, sourceType, title, desc, caption, image, button, postsQuery } = attributes;
    const itemsProps = { attributes, setAttributes, arrKey: 'sliders', activeIndex, setActiveIndex, premiumProps };

    /**
     * The gap every control in the Slide Content panel carries.
     *
     * `.bPlPanelBody` zeroes the margin WordPress's controls ship with, on the understanding that
     * each field brings its own — see the note beside that rule in editor.scss. Without it the
     * toggles and selects in that panel sit flush against each other with nothing between them.
     */
    const gap = 'mt15';

    const isPostSource = sourceType === 'posts' || sourceType === 'woo';
    /**
     * Which sources draw a caption over a picture at all.
     *
     * Everything but `video`, which renders a player rather than a slide — no title, no description,
     * no button — so the caption settings would be controls for something that is not there.
     */
    const hasCaption = isPostSource || sourceType === 'image';
    const currentPostType = postsQuery?.post_type || (sourceType === 'woo' ? 'product' : 'post');

    const handleSourceSelect = (val) => {
        if (sourceTypeOpt.find(opt => opt.value === val)?.isPro) {
            return;
        }

        // Every non-`blocks` sourceType saves `null` (src/index.js) — switching away from
        // `blocks` after real slide content exists would silently discard it on the next save,
        // with no recovery beyond the editor's own undo history.
        if (sourceType === 'blocks' && val !== 'blocks' && hasSlideBlocks) {
            const confirmed = window.confirm(__('Switching away from Gutenberg Blocks will permanently delete all the slide content you\'ve built here. Continue?', 'b-slider'));
            if (!confirmed) {
                return;
            }
        }

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
        if (postTypes?.find(pt => pt.value === val)?.locked) {
            return;
        }

        updateObject('postsQuery', 'post_type', val);
        setAttributes({ sourceType: val === 'product' ? 'woo' : 'posts' });
    };

    // Custom post types are hidden from the dropdown in the free version; the promo component
    // below tells the user they exist and how to unlock them.
    const lockedPostTypes = postTypes?.filter(pt => pt.locked) || [];
    const postTypeOptions = postTypes
        ?.filter(pt => !pt.locked)
        ?.map(({ label, value }) => ({ value, label }));

    // If the saved post type is locked (e.g. Pro licence lapsed), the dropdown has no
    // matching option. Fall back to 'post' so the control renders correctly.
    const isCurrentLocked = lockedPostTypes.some(pt => pt.value === currentPostType);
    const dropdownValue = isCurrentLocked ? 'post' : currentPostType;

    const commonProps = {
        attributes,
        setAttributes,
        premiumProps,
        updateObject
    }

    return <>
        <HelpPanel slug="b-slider" docsLink="https://bplugins.com/docs/b-slider" />

        <PanelBody className='bPlPanelBody bsb_panel_source_layout' title={__('Source & Layout', 'b-slider')} initialOpen={true}>
            <Label className="mt10 mb5">{__('Source Type', 'b-slider')}</Label>
            <div className="bsb_panel_grid_selector">
                {sourceTypeOpt.map((opt) => {
                    const handleTileClick = () => {
                        if (opt.isPro) {
                            return;
                        }
                        handleSourceSelect(opt.value);
                    };

                    return (
                        <button
                            key={opt.value}
                            type="button"
                            className={`bsb_panel_tile_btn ${(sourceType || 'image') === opt.value ? 'is-active' : ''} ${opt.isPro ? 'is-locked-tile' : ''}`}
                            onClick={handleTileClick}
                        >
                            <span className="bsb_tile_icon">{opt.icon}</span>
                            <span className="bsb_tile_label">{opt.label}</span>
                        </button>
                    );
                })}
            </div>

            <ProSocialPromo variant="compact" />

            {isPostSource && postTypes?.length > 0 && (
                <>
                    <div className="bsb_post_type_select">
                        <Label className="mt15 mb5">{__('Post Type', 'b-slider')}</Label>
                        <SelectControl value={dropdownValue} onChange={handlePostTypeSelect} options={postTypeOptions} />
                    </div>
                    <ProPostTypesPromo lockedTypes={lockedPostTypes} variant="compact" />
                </>
            )}

            <Label className="mt15 mb5">{__('Select Layout', 'b-slider')}</Label>
            <div className="bsb_panel_grid_selector">
                {/* A `blocks`-sourced slider's content is one opaque HTML blob on the front end
                    (see render.php's `_blocksHtml` bridge) — only the Bootstrap-Carousel-based
                    Default layout can animate between blocks like that; Carousel/Grid/Thumbnails
                    are Swiper-based and need each slide as a discrete, JS-enumerable item. */}
                {(sourceType === 'blocks' ? selectLayoutOpt.filter(opt => opt.value === 'default') : selectLayoutOpt).map((opt) => (
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

            <ProListLayoutPromo variant="compact" />
        </PanelBody>

        {(sourceType !== "posts" && sourceType !== "woo" && sourceType !== "blocks") &&
            <PanelBody className='bPlPanelBody' title={__('Slides', 'b-slider')} initialOpen={false}>
                <MainItem itemsProps={itemsProps} />
            </PanelBody>}

        {isPostSource && <PostQuery {...commonProps} getTaxonomy={getTaxonomy} />}

        {/* What a slide shows, for every source that draws its slides from somewhere else — a post
            query or a WooCommerce query. One panel rather than three scattered toggles, because
            "show the title but not the caption" is a single decision about how a slide looks.

            Every check is `!== false` on purpose: a slider saved before these keys existed has no
            `isVisible` in it at all, and the missing key has to keep meaning "shown". */}
        {hasCaption && <PanelBody
            className='bPlPanelBody'
            title={__('Slide Content', 'b-slider')}
            /* The picture is a link on every layout now, and the panel is where that is switched — worth
               pointing at until it stops being news. */
            badge={__('New', 'b-slider')}
            initialOpen={false}
        >
            <ToggleControl
                className={gap}
                label={__('Show Title', 'b-slider')}
                checked={title?.isVisible !== false}
                onChange={val => updateObject('title', 'isVisible', val)}
            />

            <ToggleControl
                className={gap}
                label={__('Show Description', 'b-slider')}
                checked={desc?.isVisible !== false}
                onChange={val => updateObject('desc', 'isVisible', val)}
            />

            {/* An image slider's buttons are typed per slide, under Slides — there is no one button
                here to show or hide, so the switch and its label belong to a query source only. */}
            {isPostSource && <>
                <ToggleControl className={gap} label={__('Show Button', 'b-slider')} checked={button?.isVisible !== false} onChange={val => updateObject('button', 'isVisible', val)} />

                {button?.isVisible !== false &&
                    <TextControl className={gap} label={__('Text', 'b-slider')} value={button?.text} onChange={val => updateObject('button', 'text', val)} />}
            </>}

            {/**
              * The picture is the link on a post or product slider, and there is nothing to decide.
              *
              * It used to be a choice — "Clicking the picture: Nothing / Opens the same link as the
              * button" — and the choice was never a real one. A slide whose button is hidden has nothing
              * a click can reach: the caption laid over it is `pointer-events: none` so the arrows
              * underneath stay usable, and only the anchors inside it take clicks back. So "Nothing" was
              * a setting whose only outcome was a picture that looks clickable and is not.
              *
              * Now every layout links the picture wherever the button points, and the one thing left to
              * say about it is where that opens.
              */}
            {isPostSource && <div className={`bsbTipRow ${gap}`}>
                <ToggleControl
                    label={__('Open in a new tab', 'b-slider')}
                    checked={'_blank' === image?.linkTarget}
                    onChange={val => updateObject('image', 'linkTarget', val ? '_blank' : '')}
                />

                {/* One line, and only what switching it on does. It names both links because the switch
                    governs both — see the `target` on the button anchors in `PostItem` and `WooItem`. */}
                <HelpTip label={__('About the slide links', 'b-slider')}>
                    {__('Picture and button open in a new tab.', 'b-slider')}
                </HelpTip>
            </div>}

            {/**
              * One switch: the content over the picture, or the picture until the cursor arrives.
              *
              * Kept in the same panel because "show the title" and "show it only on hover" are the same
              * conversation. A saved `hidden` still hides the caption, because `Style` still knows that
              * value — it is not offered here, but a slider set that way is not changed underneath.
              */}
            <div className={`bsbTipRow ${gap}`}>
                <ToggleControl
                    label={__('Show content on hover', 'b-slider')}
                    checked={'hover' === (caption?.display || 'always')}
                    onChange={val => updateObject('caption', 'display', val ? 'hover' : 'always')}
                />

                {/* The visitor's side of the switch, in one line. */}
                <HelpTip label={__('About the slide content', 'b-slider')}>
                    {__('Content shows when you hover the picture.', 'b-slider')}
                </HelpTip>
            </div>

            {'hover' === caption?.display && (
                <div className="bsb-hover-fields-settings" style={{ paddingLeft: '15px', borderLeft: '2px solid #e2e8f0', marginTop: '10px' }}>
                    <Label className="mb10 mt10">{__('Enable hover for:', 'b-slider')}</Label>

                    {title?.isVisible !== false && (
                        <ToggleControl
                            className={gap}
                            label={__('Title', 'b-slider')}
                            checked={caption?.hoverTitle !== false}
                            onChange={val => updateObject('caption', 'hoverTitle', val)}
                        />
                    )}

                    {desc?.isVisible !== false && (
                        <ToggleControl
                            className={gap}
                            label={__('Description', 'b-slider')}
                            checked={caption?.hoverDesc !== false}
                            onChange={val => updateObject('caption', 'hoverDesc', val)}
                        />
                    )}

                    {isPostSource && button?.isVisible !== false && (
                        <ToggleControl
                            className={gap}
                            label={__('Button', 'b-slider')}
                            checked={caption?.hoverBtn !== false}
                            onChange={val => updateObject('caption', 'hoverBtn', val)}
                        />
                    )}

                </div>
            )}

            <SelectControl
                className={gap}
                /* The three option labels already say what each one does, so the tip is left with the one
                   question they cannot answer: where the colour itself is chosen. */
                label={<>
                    {__('Content background', 'b-slider')}
                    <HelpTip label={__('About the content background', 'b-slider')}>
                        {__('Pick the colour on the Style tab.', 'b-slider')}
                    </HelpTip>
                </>}
                value={caption?.background || 'solid'}
                options={[
                    { label: __('Tint the whole picture', 'b-slider'), value: 'solid' },
                    { label: __('Fade behind the text', 'b-slider'), value: 'gradient' },
                    { label: __('None', 'b-slider'), value: 'none' }
                ]}
                onChange={val => updateObject('caption', 'background', val)}
            />

            {/* Sits beside the caption's reveal because the two are almost always chosen together:
                a caption that appears on hover over a picture that does nothing looks half-built. */}
            <SelectControl
                className={gap}
                label={__('Picture on hover', 'b-slider')}
                value={image?.hover || 'none'}
                options={[
                    { label: __('Nothing', 'b-slider'), value: 'none' },
                    { label: __('Zoom in', 'b-slider'), value: 'zoomIn' },
                    { label: __('Zoom out', 'b-slider'), value: 'zoomOut' },
                    { label: __('Grey until pointed at', 'b-slider'), value: 'grayscale' }
                ]}
                onChange={val => updateObject('image', 'hover', val)}
            />
        </PanelBody>}

        {/* Renders nothing unless this post type actually has ACF fields, so a site without ACF
            never sees the panel. Sits after the query, since the fields it offers depend on the
            post type chosen there — and after the caption, because `AcfFields` draws onto a layer
            over the slide and a field landing where the caption already is is a thing you can only
            judge once you know what is under it. */}
        {isPostSource && <AcfConfigure {...commonProps} queriedPosts={queriedPosts} />}
        {isPostSource && <ProPanel title={__('ACF Query', 'b-slider')} proTitle={__('Premium ACF Query', 'b-slider')} features={PRO_FEATURES.acfQuery} />}

        {/* The date and the author, drawn over the slide as badges. Both are on an arranged post
            already — see `badgesFrom` in AcfFields, which renders them onto the same layer the ACF
            fields use, which is why this follows that panel. */}
        {isPostSource && <PostBadges {...commonProps} />}

        <DefaultGeneral {...commonProps} gapDevice={gapDevice} setGapDevice={setGapDevice} device={device} setDevice={setDevice} />
        {layoutType === "grid" && <GridGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
        {layoutType === "thumbnails" && <ThumbnailsGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
        {sourceType === "video" && <VideoGeneral {...commonProps} />}
    </>
}

export default withSelect((select, { attributes, clientId }) => {

    const { getPostTypes, getTaxonomies, getEntityRecords } = select('core');
    const { getDeviceType, getCurrentPostType, getCurrentPostId } = select('core/editor');

    const { post_type } = attributes;
    const taxonomies = getTaxonomies({ per_page: -1 });

    return {
        device: getDeviceType()?.toLowerCase(),

        // Gates the data-loss confirm in `handleSourceSelect` — only worth asking about if the
        // slide actually has content built into it.
        hasSlideBlocks: (select('core/block-editor').getBlock(clientId)?.innerBlocks?.length || 0) > 0,

        postTypes: getPostTypes({ per_page: -1 })?.filter(p => !['apb', 'attachment', 'nav_menu_item', 'bsb'].includes(p.slug) && !p.slug.startsWith('wp_'))?.map(({ name, slug }) => ({ label: name, value: slug, locked: isPostTypeLocked(slug) })),

        currentPostType: getCurrentPostType(),

        currentPostId: getCurrentPostId(),

        allTaxonomies: 'post' === post_type ? taxonomies?.filter(tax => tax.types.includes('post')).filter(tax => tax.slug !== 'category' && tax.slug !== 'post_tag') : taxonomies?.filter(tax => tax.types.includes(post_type)),

        getTaxonomy: slug => getEntityRecords('taxonomy', slug, { per_page: -1 }),
    }
})(General);
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SelectControl, TextControl, ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import HelpTip from '../../../Panel/HelpTip';

import { withSelect } from '@wordpress/data';
import { HelpPanel, Label } from '../../../../../../bpl-tools/Components';


import MainItem from '../MainItem';
import ProPostTypesPromo from '../../ProPostTypesPromo';
import ProLayoutsPromo from '../../ProLayoutsPromo';
import { isPostTypeLocked, isProActive } from '../../../../utils/functions';
import DefaultGeneral from './DefaultGeneral';
import GridGeneral from './GridGeneral';
import ListGeneral from './ListGeneral';
import ThumbnailsGeneral from './ThumbnailsGeneral';
import { layoutsFor, sourceTypeOpt } from '../../../../utils/options';
import PostQuery from './Post-query';
import AcfQuery from './AcfQuery';
import AcfConfigure from './AcfConfigure';
import VideoGeneral from './VideoGeneral';
import PlayerGeneral from './PlayerGeneral';
import SocialGeneral from './SocialGeneral';
import SocialBadges from './SocialBadges';
import SocialFiltering from './SocialFiltering';
import SocialDateTime from './SocialDateTime';
import SocialSlides from './SocialSlides';
import SocialStore from './SocialStore';
import SocialHeaderSettings from './SocialHeaderSettings';

import { hasFeedProfile } from '../../../../utils/feedProfile';
import { feedItem } from '../../Source/source-json-item';

/**
 * What to write for the height when the layout changes: nothing, or a repair.
 *
 * A height the user chose is theirs and survives the switch — see the note at the call site. An
 * empty one is the state that collapsed the slider, so it is replaced with the block's own default;
 * a `sliderHeight` holding only empty strings is cleared to `{}` so it stops shadowing `height`.
 *
 * Returns a patch to spread, so the untouched case adds no keys to the payload at all.
 */
const cleanHeight = (height, sliderHeight = {}) => {
    const set = value => !!(value && String(value).trim());
    const perDevice = Object.fromEntries(Object.entries(sliderHeight || {}).filter(([, v]) => set(v)));
    const patch = {};

    // `sliderHeight` wins over `height` in `Style`, so an entry that is present but blank is worse
    // than no entry: it beats a perfectly good `height` and resolves to nothing.
    if (Object.keys(perDevice).length !== Object.keys(sliderHeight || {}).length) {
        patch.sliderHeight = perDevice;
    }

    if (!set(height) && !Object.keys(perDevice).length) {
        patch.height = '450px';
    }

    return patch;
};

const General = ({ attributes, setAttributes, activeIndex, setActiveIndex, updateObject, multipleAttrChange, getTaxonomy, premiumProps, postTypes, queriedPosts, socialFeed }) => {
    const isPro = isProActive();

    const [device, setDevice] = useState('desktop');
    const [gapDevice, setGapDevice] = useState('desktop');
    const { layoutType, sourceType, title, desc, caption, image, button, postsQuery, socialQuery, grid, height, sliderHeight, thumbnails } = attributes;
    const itemsProps = { attributes, setAttributes, arrKey: 'sliders', activeIndex, setActiveIndex, premiumProps };

    /**
     * The gap every control in the Slide Content panel carries.
     *
     * `.bPlPanelBody` zeroes the margin WordPress's controls ship with, on the understanding that
     * each field brings its own — see the note beside that rule in editor.scss. Without it the
     * toggles and selects in that panel sit flush against each other with nothing between them.
     * Named once so the whole panel keeps one beat, the way `SocialSlides` and `SocialGeneral` do.
     */
    const gap = 'mt15';

    const isPostSource = sourceType === 'posts' || sourceType === 'woo';
    // A feed renders through the post components, so it wants what a post source wants — a caption,
    // a button, an excerpt length — without the post query that fills any of it.
    const isFeedSource = sourceType === 'social';
    /**
     * Which sources draw a caption over a picture at all.
     *
     * Everything but `video`, which renders a player rather than a slide — no title, no description,
     * no button — so the caption settings would be controls for something that is not there.
     */
    const hasCaption = isPostSource || isFeedSource || sourceType === 'image';
    const hasAddress = !isFeedSource || !!(socialQuery?.channelId || socialQuery?.source || (socialQuery?.ytQueryType === 'search' && socialQuery?.ytSearchTerm) || '').trim();
    const currentPostType = postsQuery?.post_type || (sourceType === 'woo' ? 'product' : 'post');

    const handleSourceSelect = (val) => {
        const resets = {
            socialQuery: {
                ...(socialQuery || {}),
                activePreset: ''
            }
        };

        if (val !== 'social') {
            resets.cardLayout = false;
            resets.cardBgColor = '';
            resets.cardPadding = { top: '16px', right: '16px', bottom: '16px', left: '16px' };
            resets.cardRadius = { top: '8px', right: '8px', bottom: '8px', left: '8px' };
            resets.SliderOverly = '#59595952';
            resets.caption = { display: 'always', background: 'solid' };
            resets.playIconColor = '';
            resets.playIconBg = '';
            resets.playIconHoverBg = '';
        }

        if (val === 'woo') {
            updateObject('postsQuery', 'post_type', 'product');
            setAttributes({ ...resets, sourceType: 'woo' });
        } else if (val === 'posts') {
            // A CPT already picked in the dropdown must survive re-clicking the Posts tile;
            // only a missing or product-only slug gets pushed back to the default.
            if (!postsQuery?.post_type || postsQuery.post_type === 'product') {
                updateObject('postsQuery', 'post_type', 'post');
            }
            setAttributes({ ...resets, sourceType: 'posts' });
        } else {
            setAttributes({ ...resets, sourceType: val });
        }
    };

    // The dropdown drives both attributes: `post_type` is the real query target, while
    // `sourceType` only distinguishes WooCommerce rendering from plain post rendering.
    const handlePostTypeSelect = (val) => {
        if (postTypes?.find(pt => pt.value === val)?.locked) {
            return;
        }

        const resets = {
            socialQuery: {
                ...(socialQuery || {}),
                activePreset: ''
            },
            cardLayout: false,
            cardBgColor: '',
            cardPadding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
            cardRadius: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
            SliderOverly: '#59595952',
            caption: { display: 'always', background: 'solid' },
            playIconColor: '',
            playIconBg: '',
            playIconHoverBg: ''
        };

        updateObject('postsQuery', 'post_type', val);
        setAttributes({ ...resets, sourceType: val === 'product' ? 'woo' : 'posts' });
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
    const currentFeedType = socialQuery?.feedType || 'youtube';

    const handleFeedTypeSelect = (val) => {
        setAttributes({
            layoutType: val ? 'default' : '',
            socialQuery: {
                ...(socialQuery || {}),
                feedType: val,
                channelId: '',
                source: '',
                // Only YouTube has a cover picture behind it — see `canHaveBanner` in
                // `SocialHeaderSettings`. Left on, the switch would be set for a feed that can draw
                // nothing, and the old channel's banner would stand over the new service's posts.
                headerBanner: '',
                showHeaderBanner: false,
                // See the same line in `SelectSource.handleFeedSelect` — a shared preset's tick would
                // otherwise survive the switch and claim settings this feed never received.
                activePreset: ''
            }
        });
    };

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
                    <SelectControl value={dropdownValue} onChange={handlePostTypeSelect} options={postTypeOptions} />
                </div>
            )}

            {isFeedSource && (
                <div className="bsb_feed_type_select">
                    <Label className="mt15 mb5">{__('Feed Type', 'b-slider')}</Label>
                    <SelectControl
                        value={currentFeedType}
                        onChange={handleFeedTypeSelect}
                        options={[
                            { value: '', label: __('— Select Feed Type —', 'b-slider') },
                            ...feedItem.filter(item => item.available).map(({ feedType: value, title: label }) => ({ value, label }))
                        ]}
                    />
                </div>
            )}

            {/*
               * Not tied to the post source: an image slider is exactly where someone has yet to
              * learn their custom post types could be sliding too. The component itself decides
              * whether there is anything to say — it names the locked types when the site has
              * any, and stays quiet only on a Pro licence.
              */}
            {'posts' === sourceType && <ProPostTypesPromo lockedTypes={lockedPostTypes} variant="compact" />}

            <Label className="mt15 mb5">{__('Select Layout', 'b-slider')}</Label>
            <div className="bsb_panel_grid_selector">
                {layoutsFor(sourceType, socialQuery?.feedType)
                    .filter(opt => {
                        if ('social' === sourceType) {
                            return isPro || opt.value === 'default';
                        }
                        return true;
                    })
                    .map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        className={`bsb_panel_tile_btn ${(layoutType || 'default') === opt.value ? 'is-active' : ''}`}
                        onClick={() => {
                            const newLayout = opt.value;
                            const isSingleVideo = sourceType === 'video';

                            setAttributes({
                                layoutType: newLayout,
                                cardLayout: false,
                                cardBgColor: '',
                                cardPadding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
                                cardRadius: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
                                caption: { display: 'always', background: 'solid' },
                                SliderOverly: '#59595952',
                                likesCommentsColor: '',
                                playIconColor: '',
                                playIconBg: '',
                                playIconHoverBg: '',
                                title: { tag: title?.tag || 'h4', isVisible: true },
                                desc: { isVisible: true },
                                button: { isVisible: true, text: button?.text || '' },
                                titleTypo: {
                                    fontSize: {
                                        desktop: 20,
                                        tablet: 20,
                                        mobile: 15
                                    },
                                    fontWeight: 700,
                                    lineHeight: "135%"
                                },
                                titleColor: '#fff',
                                descTypo: {
                                    fontSize: {
                                        desktop: 18,
                                        tablet: 20,
                                        mobile: 15
                                    },
                                    fontWeight: 400,
                                    lineHeight: "135%"
                                },
                                descColor: '#fff',
                                gridItemRatio: '16/9',
                                /**
                                 * Repaired, not reset — the one value on this list that is left as
                                 * the user set it.
                                 *
                                 * Everything else here goes back to a default because a new layout
                                 * wants its own typography and spacing. A height is different: it is
                                 * chosen once for how the slider should sit on the page, and taking
                                 * an 800px slider back to 450 for switching layouts would be work
                                 * thrown away with no way to know it had happened.
                                 *
                                 * What is not kept is an *empty* height, which is not a choice but
                                 * the state that caused this: `''` reaches `Style` as `height: ;`,
                                 * the browser drops the declaration, and the default and carousel
                                 * layouts — whose slides are absolutely positioned — collapse and
                                 * draw every slide over the last. Only that case is written over.
                                 */
                                ...(cleanHeight(height, sliderHeight)),
                                columnGap: '24px',
                                rowGap: '32px',
                                columns: (newLayout === 'default')
                                    ? { desktop: 1, tablet: 1, mobile: 1 }
                                    : { desktop: 3, tablet: 2, mobile: 1 },
                                socialQuery: {
                                    ...(socialQuery || {}),
                                    activePreset: '',
                                    playVideo: newLayout === 'list' ? 'stage' : 'popup',
                                    showLikesComments: false,
                                    hoverActionsPosition: 'top-right'
                                },
                                grid: {
                                    ...(grid || {}),
                                    paginationType: newLayout === 'grid' ? 'pagination' : 'none'
                                },
                                postsQuery: {
                                    ...(postsQuery || {}),
                                    per_page: 12
                                },
                                arrow: {
                                    visibility: newLayout !== 'grid',
                                    size: 48,
                                    color: '#fff',
                                    bg: 'rgba(17, 17, 17, 0.55)'
                                },
                                arrowWidth: '50px',
                                arrowHeight: '50px',
                                deviceArrowWidth: { desktop: '50px', tablet: '40px', mobile: '30px' },
                                deviceArrowHeight: { desktop: '50px', tablet: '40px', mobile: '30px' },
                                arrowRadius: { top: '50%', right: '50%', bottom: '50%', left: '50%' },
                                thumbnails: {
                                    overly: { color: "" },
                                    height: { desktop: "120px", tablet: "", mobile: "" },
                                    position: { desktop: "bottom" },
                                    width: { desktop: "30%", tablet: "20%", mobile: "15%" },
                                    active: { color: "#00000000", border: { color: "#000", style: "solid", width: "0px" } },
                                    mode: "slider",
                                    showStage: true,
                                    showDuration: false,
                                    showPlay: false,
                                    navPosition: "overlay",
                                    cardStyle: "bare",
                                    showCardTitle: false,
                                    showCardMeta: false,
                                    showCardExcerpt: false
                                },
                                carousel: {
                                    carouselStyle: "standard",
                                    isAutoPlay: !isSingleVideo,
                                    autoPlayDelay: 2000,
                                    mousewheel: false,
                                    effect: "none",
                                    grabCursor: false,
                                    loop: true,
                                    reverseDirection: false,
                                    caroDirection: "horizontal",
                                    navigation: true,
                                    pagination: true,
                                    itemsPerSlide: 1,
                                    groupColumns: 1
                                }
                            });
                        }}
                    >
                        <span className="bsb_tile_icon">{opt.icon}</span>
                        <span className="bsb_tile_label">{opt.label}</span>
                    </button>
                ))}
            </div>
            {!isPro && 'social' === sourceType && <ProLayoutsPromo variant="compact" />}
        </PanelBody>

        {/* Above the source panels rather than among them, because it answers a question asked before
            any of them: what should this look like to begin with. Everything it sets is a control in a
            panel below, so a preset is a way of not opening six of them — not a mode that overrides
            them. Nothing is shown until a feed type is chosen; `presetsFor` decides which apply. */}

        {/* ── 1. Where the slides come from ──────────────────────────────────────────────────
         *
         * The panels below are in the order each one becomes answerable, not in the order they were
         * written. Every panel here needs the one above it settled first: there is nothing to filter
         * until there is an address, nothing to import until the filtering has decided what the set
         * is, and nothing to style until there is a set at all.
         *
         * That was the thing to fix. A feed slider showed sixteen panels of equal weight, and the
         * sequence ran badges → slides → import → profile → player → query — none of which is the
         * order anybody builds a slider in. Somebody arriving at panel four was being asked what to
         * print on top of a slide whose contents panel five had not offered yet. */}

        {/* "New" was on this panel unconditionally, which is not true of it: an image slider's Slides
            panel is the original one, unrelated to anything reorganised this round — only the feed
            source's own Slides panel (`SocialSlides`) picked up new controls. `isFeedSource` is always
            false in this branch, so the badge is written to say so rather than left to accidentally
            claim otherwise if this panel is ever reached a second way. */}
        {(!isPostSource && !isFeedSource) &&
            <PanelBody className='bPlPanelBody' title={__('Slides', 'b-slider')} badge={isFeedSource ? __('New', 'b-slider') : undefined} initialOpen={false}>
                <MainItem itemsProps={itemsProps} />
            </PanelBody>}

        {isFeedSource && <SocialGeneral {...commonProps} socialFeed={socialFeed} />}

        {isPostSource && <PostQuery {...commonProps} getTaxonomy={getTaxonomy} />}

        {/* `hasAddress` for the same reason Slides, Store and Profile & Follow carry it: there is
            nothing to narrow until the panel above has been given somewhere to read. It was the one
            source panel without the check, so a slider with an empty Channel field opened on "How many
            videos", a keyword filter and a date format — every one of them a setting for a feed that
            does not exist yet, and the panel that would have created it sitting unfinished above. */}
        {isFeedSource && hasAddress && currentFeedType !== 'youtube_video' && <SocialFiltering {...commonProps} />}

        {/* Last of the source panels, and it has to be: it copies onto this site whatever the two
            panels above have settled on. Importing before the set is chosen imports the wrong set.

            An RSS feed is offered this now. It was the one feed type held back, and nothing under the
            panel agreed with holding it back: `FeedStore`, `FeedMedia` and `FeedSync` never ask what
            kind of feed they are keeping — they key off `feedType` and take whatever shape the reader
            gives them — and `RssFeed` gives the same shape `JsonFeed` does, down to the
            `thumbnail['url']` and `['fallback']` that `FeedMedia::picturesOf()` reads. The panel itself
            was written for it too: five of its strings choose RSS wording for a branch that could not
            be reached. So a feed type identical to JSON in every way that matters here was the only one
            refused, which is an inconsistency rather than a policy.

            It changes nothing on its own — `storeLocal` is off until somebody turns it on, and an RSS
            slider that is never touched goes on reading its feed live exactly as before.

            Only `youtube_video` is left out, and for a reason that does not apply to a feed: a single
            embedded clip is not a set, so there is nothing to keep a copy of. */}
        {isFeedSource && hasAddress && currentFeedType !== 'youtube_video' && <SocialStore {...commonProps} socialFeed={socialFeed} />}

        {/* ── 2. What a slide shows ───────────────────────────────────────────────────────────
         *
         * In the order the slide is built up, from the bottom layer to the top: the picture and what
         * a click on it does, then the caption over the picture, then the fields and badges over
         * that, then the header standing above the whole set, then the player a slide opens into. */}

        {isFeedSource && hasAddress && <SocialSlides {...commonProps} />}



        {sourceType === "video" && <VideoGeneral {...commonProps} />}

        {/* What a slide shows, for every source that draws its slides from somewhere else — a post
            query or a WooCommerce query. One panel rather than three scattered toggles, because "show
            the title but not the caption" is a single decision about how a slide looks.

            Not a feed source any more — every one of these controls applies to a feed slide exactly as
            much as a post's, and they used to be answered twice: once here, once again under Slides,
            in two different panels a scroll apart. They are all inside `SocialSlides` now, beside the
            rest of what a feed slide shows, so a feed source never reaches this panel at all.

            Every check is `!== false` on purpose: a slider saved before these keys existed has no
            `isVisible` in it at all, and the missing key has to keep meaning "shown". */}
        {hasCaption && !isFeedSource && <PanelBody
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

            <ToggleControl className={gap} label={__('Show Button', 'b-slider')} checked={button?.isVisible !== false} onChange={val => updateObject('button', 'isVisible', val)} />

            {/* One label for every slide, which only makes sense where the slides come from a query.
                An image slider's buttons are typed per slide, under Slides — and a feed slide's own
                copy of this field is in `SocialSlides` now, this panel no longer being one it reaches. */}
            {isPostSource && button?.isVisible !== false &&
                <TextControl className={gap} label={__('Text', 'b-slider')} value={button?.text} onChange={val => updateObject('button', 'text', val)} />}

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
              * say about it is where that opens. A feed slide is not offered any of this: there the click
              * is already spoken for — the popup, the corner player, or the service's own page — and that
              * is settled under Slides.
              */}
            {isPostSource && <div className={`bsbTipRow ${gap}`}>
                <ToggleControl
                    /* Short, because the mark beside it carries the detail. "the picture link" was the
                       label doing the tip's job — and next to "Show Button" and "Text" it read as the
                       long one out of three. */
                    label={__('Open in a new tab', 'b-slider')}
                    checked={'_blank' === image?.linkTarget}
                    onChange={val => updateObject('image', 'linkTarget', val ? '_blank' : '')}
                />

                {/* One line, and only what switching it on does. It names both links because the switch
                    now governs both — see the `target` on the button anchors in `PostItem` and `WooItem`.
                    A tip that claimed more than the code did would be the worst of the three. */}
                <HelpTip label={__('About the slide links', 'b-slider')}>
                    {__('Picture and button open in a new tab.', 'b-slider')}
                </HelpTip>
            </div>}

            {/* When the caption is shown, rather than what it contains. Kept in the same panel
                because "show the title" and "show it only on hover" are the same conversation. */}
            {/**
              * One switch: the content over the picture, or the picture until the cursor arrives.
              *
              * It was a three-way select — Always / On hover / Never — picture only. Two of those three
              * were the same decision seen from either side, and the third was a slider with a caption
              * nobody could ever read. A switch says the whole thing: off is what a slide does by default,
              * on is the picture on its own until it is pointed at.
              *
              * A saved "Never" still hides the caption, because `Style` still knows that value — it is no
              * longer offered, but a slider set that way before is not quietly changed underneath.
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

            {hasCaption && 'hover' === caption?.display && (
                <div className="bsb-selective-hover-options mt10 ml15">
                    {/* Only the three pieces of the caption itself. A badge is not part of the caption —
                        it is drawn on the overlay `AcfFields` owns, and its own "Show on hover only"
                        switch lives beside the rest of its settings under Post Badges. */}
                    <Label className="mb10">{__('Enable hover for:', 'b-slider')}</Label>

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

                    {/* Only while there is a button to hide. A feed slider's own copy of this switch is
                        in `SocialSlides` now, alongside its own Show Button. */}
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
                /**
                 * The three option labels already say what each one does, so the tip is left with the one
                 * question they cannot answer: where the colour itself is chosen.
                 *
                 * What went: two paragraphs, one of them explaining that a caption placed in the middle of
                 * a slide has no edge for a gradient to fade from, so it stays a full tint. True, and the
                 * wrong place for it — somebody who centres their caption sees that for themselves in the
                 * canvas, and everybody else was reading it for nothing.
                 */
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

        {/* The fields and the badges, together and after the caption, because that is where they are
            drawn: `AcfFields` renders both onto one layer over the slide, and a badge and a field
            landing in the same corner is a thing you can only judge once you know what is under
            them. It also puts them the right way round for a post slider — the panel that offers ACF
            fields needs the post type, and the query above chose it.

            `AcfConfigure` renders nothing unless the post type actually has ACF fields, so a site
            without ACF never sees it. */}
        {isPostSource && <AcfConfigure {...commonProps} queriedPosts={queriedPosts} />}

        {/* Under `ACF Integration` rather than up beside `Post Query`, so the two ACF panels are
            found together: whoever is already picking fields up there is the one who then wants to
            sort on one. It overrules the ordering in `Post Query` from down here, which is why that
            control says so on its face rather than just going quiet — see `orderByField`. */}
        {isPostSource && <AcfQuery {...commonProps} queriedPosts={queriedPosts} />}

        {/* A post or product slider gets the same badges a feed does: the date and the author are
            on an arranged post already, whatever post type it came from.

            A YouTube channel used to be excluded here, on the grounds that its slides carried their
            own metadata and this would be a second way to show the same thing. There was no such
            first way: `views` and `duration` are read off the API and carried on the item, but
            nothing renders them — see the note on them in `YouTubeFeed::makeItem()`. So the panel
            was not a duplicate, it was the only one, and a channel feed had no way to show a date or
            an author at all. The renderer never agreed with the exclusion either: `AcfFields` asks
            only whether the source is a feed, and a channel's items carry both `date` and
            `author.name` on each of the two paths that build them. A single video — `youtube_video`
            — was getting the panel throughout, which is the same slide with less metadata on it. */}
        {(isPostSource || isFeedSource) && <SocialBadges {...commonProps} />}

        {isFeedSource && hasAddress && currentFeedType !== 'youtube_video' && <SocialDateTime {...commonProps} />}

        {/* Only where something stands behind the feed to introduce or to point at — see
            `PROFILE_FEED_TYPES`. A single video is a clip somebody embedded rather than a channel,
            and a JSON document describes no publisher, so neither has a profile to offer and the
            panel would be four fields nothing could fill and a button linking nowhere.

            `socialFeed` for the account behind the feed, which the panel shows as the placeholder in
            every field it can be overridden from — see `liveAccount` there. */}
        {isFeedSource && hasAddress && hasFeedProfile(currentFeedType) && <SocialHeaderSettings {...commonProps} socialFeed={socialFeed} />}

        {/* The player a feed slide opens in, offered only when there is one: with `playVideo` set to
            `link` the slide sends the visitor to YouTube and no player of ours is ever built. The
            default reads from the destructure as well as from `block.json`, because a slider saved
            before that setting existed has a `socialQuery` with no `playVideo` in it.

            Last of the slide panels because it is the furthest from the slide — everything above is
            drawn on the page, and this is what takes over the screen once one of them is clicked. */}
        {/* Instagram is in this list too, and was not.
            Plyr plays a Reel's MP4 exactly as it plays a YouTube embed — `openMiniPlayer` and the
            Thumbnails stage both hand it `videoUrl` when there is no `videoId` — so an Instagram
            slider had a player on it and no panel to govern it: no Show Duration, no controls, no
            speed. `HTML5_ONLY` already keeps the two families from being offered each other's
            controls, so there was nothing else standing in the way. */}
        {isFeedSource && ['youtube', 'youtube_video', 'instagram'].includes(currentFeedType) && 'link' !== (attributes.socialQuery?.playVideo || 'popup') &&
            <PlayerGeneral {...commonProps} isFeed />}

        {/* ── 3. How the slider itself behaves ────────────────────────────────────────────────
         *
         * Height, gaps, arrows, indicators, autoplay — none of which depends on where the slides came
         * from or what is printed on them, and all of which is worth leaving until there is something
         * on screen to judge it against. So it goes at the bottom for every source type.
         *
         * The layout-specific pair follow the general one and only appear for the layout they belong
         * to, which is chosen right at the top in Source & Layout. */}
        <DefaultGeneral {...commonProps} gapDevice={gapDevice} setGapDevice={setGapDevice} device={device} setDevice={setDevice} />
        {((layoutType === "grid") || (layoutType === "thumbnails" && thumbnails?.mode === "grid")) && <GridGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}

        {/* The layout can only be chosen for a YouTube channel, and this panel follows it there. The
            source check is repeated rather than trusted: a slider saved as a list and later pointed
            somewhere else renders as `default` — see `chosen` in Layout — and settings for a layout that
            is not being drawn are settings that do nothing. */}
        {'list' === layoutType && 'social' === sourceType && 'youtube' === socialQuery?.feedType && (
            <ListGeneral {...commonProps} />
        )}
        {layoutType === "thumbnails" && <ThumbnailsGeneral {...commonProps} multipleAttrChange={multipleAttrChange} />}
    </>
}

export default withSelect((select, { attributes }) => {

    const { getPostTypes, getTaxonomies, getEntityRecords } = select('core');
    const { getDeviceType, getCurrentPostType, getCurrentPostId } = select('core/editor');

    const { post_type } = attributes;
    const taxonomies = getTaxonomies({ per_page: -1 });

    return {
        device: getDeviceType()?.toLowerCase(),

        postTypes: getPostTypes({ per_page: -1 })?.filter(p => !['apb', 'attachment', 'nav_menu_item', 'bsb'].includes(p.slug) && !p.slug.startsWith('wp_'))?.map(({ name, slug }) => ({ label: name, value: slug, locked: isPostTypeLocked(slug) })),

        currentPostType: getCurrentPostType(),

        currentPostId: getCurrentPostId(),

        allTaxonomies: 'post' === post_type ? taxonomies?.filter(tax => tax.types.includes('post')).filter(tax => tax.slug !== 'category' && tax.slug !== 'post_tag') : taxonomies?.filter(tax => tax.types.includes(post_type)),

        getTaxonomy: slug => getEntityRecords('taxonomy', slug, { per_page: -1 }),
    }
})(General);
import { __ } from '@wordpress/i18n';
import { ToggleControl, TextControl, SelectControl, Button } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { PanelBody } from '../../../Panel/AccordionPanel';
import FieldGroup from '../../../Panel/FieldGroup';
import HelpTip from '../../../Panel/HelpTip';
import { Label } from '../../../../../../bpl-tools/Components';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import { isProActive } from '../../../../utils/functions';
import { TipSelect, TipToggle, TipRange, TipText } from '../../../Panel/TipField';

/**
 * What a click on a slide does, in the words of the thing it will do.
 *
 * Three answers now rather than two, so this moved out of the field: a nested conditional across two
 * settings and two families of feed is a thing to read once, here, rather than every time the panel is
 * touched.
 */
const playClickHelp = (type, value) => {
    const isVideoish = 'youtube' === type || 'youtube_video' === type;

    if ('stage' === value) {
        return __('The video loads into the player above the thumbnails and plays there. Nothing opens over the page, and the visitor stays where they are. Nothing is loaded from YouTube until somebody presses play.', 'b-slider');
    }

    if ('link' === value) {
        return isVideoish
            ? __('The whole picture is the link, and it takes the visitor to YouTube.', 'b-slider')
            : __('The whole picture is the link, and it takes the visitor to the original post.', 'b-slider');
    }

    if ('mini' === value) {
        return __('The video docks in a corner and plays there with sound, so the visitor can scroll on and keep watching. It can be expanded over the page or closed, and clicking another slide swaps the video without interrupting the player.', 'b-slider');
    }

    return isVideoish
        ? __('The video opens over the page and plays there. Nothing is loaded from YouTube until somebody clicks.', 'b-slider')
        : __('The picture opens over the page with the content beside it, and a link to the original. Arrows move between slides.', 'b-slider');
};

const SocialSlides = ({ attributes, updateObject, premiumProps }) => {
    const { socialQuery = {}, postsQuery = {}, title, desc, caption, image, button, layoutType } = attributes;

    const { feedType = 'youtube', playVideo = 'popup', linkTarget = '', defaultImageUrl = '', imageFit = 'blur', titleLength = -1, instagramEmbedFallback = false, hoverPreview = false, miniPosition = 'bottom-right', ytThumbQuality = 'maxresdefault', showLikesComments = false, activePreset = '', showSourceIcon = true, showPlayIcon = true } = socialQuery;
    const { excerptLength = 25 } = postsQuery;

    const isVideoish = feedType === 'youtube' || feedType === 'youtube_video';
    const isPostish = !isVideoish;
    const canPreview = isVideoish || 'instagram' === feedType;

    /**
     * Whether this slider has a player above the slides for a click to fill.
     *
     * The layout has to provide the stage, and the feed has to have something to put on it: YouTube
     * names a video by id, Instagram hands over the file. `youtube_video` is left out — a single
     * embedded clip is not a set, so there are no thumbnails under it to choose from.
     */
    const hasStage = 'thumbnails' === layoutType
        && ('youtube' === feedType || 'instagram' === feedType);

    /**
     * On unless it has been turned off, and not simply `!!socialQuery.hoverActions`.
     *
     * A slider saved before this setting existed has no key for it — WordPress fills an object
     * attribute's default in only when the whole object is missing — and those sliders have been showing
     * the buttons since the feature landed. Reading the absence as `false` would take them away from
     * every one of them. `PostItem` asks the same question the same way.
     */
    const showHoverActions = false !== socialQuery?.hoverActions;

    const isPro = premiumProps?.isPremium ?? isProActive();

    const gap = 'mt15';

    return (
        <PanelBody
            className='bPlPanelBody bsb_social_slides_panel'
            title={__('Slides', 'b-slider')}
            badge={__('New', 'b-slider')}
            initialOpen={false}
        >
            <FieldGroup title={__('The picture', 'b-slider')} first />

            {/* A slide is a fixed box — Slider Height against whatever width the layout gives it — and a
                feed picture almost never matches that shape: a YouTube frame is 16:9, an Instagram post
                is 1:1 or 4:5. Something has to give, and this is where it is chosen.

                `contain` is what the slider did before this setting existed, and the bars it leaves are
                what the setting is for. */}
            <TipSelect
                className={gap}
                label={__('Image Fit', 'b-slider')}
                value={imageFit}
                options={[
                    { label: __('Blurred backdrop', 'b-slider'), value: 'blur' },
                    { label: __('Fill the slide (crops)', 'b-slider'), value: 'cover' },
                    { label: __('Fit inside (adds bars)', 'b-slider'), value: 'contain' }
                ]}
                onChange={val => updateObject('socialQuery', 'imageFit', val)}
                tip={__('How the picture fills the slide.', 'b-slider')}
            />

            {/* Moved from Feed Settings' Connection step, where it sat under the API key and cache
                time — settings about reaching the service, not about the picture it hands back. This
                is the same decision Image Fit above it is: what the slide's picture looks like. */}
            {feedType === 'youtube' && isProActive() && (
                <TipSelect
                    className={gap}
                    label={__('YouTube Thumbnail Quality', 'b-slider')}
                    value={ytThumbQuality}
                    options={[
                        { label: __('Maximum Resolution (HD)', 'b-slider'), value: 'maxresdefault' },
                        { label: __('Standard Definition (SD)', 'b-slider'), value: 'sddefault' },
                        { label: __('High Quality (HQ)', 'b-slider'), value: 'hqdefault' },
                        { label: __('Medium Quality (MQ)', 'b-slider'), value: 'mqdefault' },
                        { label: __('Default Quality (Low)', 'b-slider'), value: 'default' }
                    ]}
                    onChange={val => updateObject('socialQuery', 'ytThumbQuality', val)}
                    tip={__('Choose the quality of video thumbnails to display in the slider.', 'b-slider')}
                />
            )}

            {/* Moved from the old Slide Content panel, which this feed slider no longer reaches — see
                the note in `General`. Beside Image Fit because the two are the same conversation: what
                the slide's picture looks like, at rest and under the cursor. */}
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

            <ToggleControl
                className={gap}
                label={__('Show Source Icon', 'b-slider')}
                checked={!!showSourceIcon}
                onChange={val => updateObject('socialQuery', 'showSourceIcon', val)}
            />

            <ToggleControl
                className={gap}
                label={__('Show Play Icon', 'b-slider')}
                checked={!!showPlayIcon}
                onChange={val => updateObject('socialQuery', 'showPlayIcon', val)}
            />

            {/* Up here with Image Fit, and no longer at the bottom of the panel: it is the picture a
                slide shows when the feed brought none, so it is part of the same decision. Still
                `isPostish` — a YouTube video always has a thumbnail, so there is no gap to fill. */}
            {isPostish && (
                <div className={gap} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <MediaUpload
                        onSelect={media => updateObject('socialQuery', 'defaultImageUrl', media.url)}
                        allowedTypes={['image']}
                        value={defaultImageUrl}
                        render={({ open }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <TipText
                                    label={__('Default Placeholder Image', 'b-slider')}
                                    value={defaultImageUrl}
                                    onChange={val => updateObject('socialQuery', 'defaultImageUrl', val)}
                                    placeholder='https://example.com/placeholder.jpg'
                                    tip={__('Shown when a feed post arrives without a picture of its own.', 'b-slider')}
                                />
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <Button variant="secondary" onClick={open} size="small">
                                        {__('Choose Image', 'b-slider')}
                                    </Button>
                                    {!!defaultImageUrl && (
                                        <Button variant="link" isDestructive onClick={() => updateObject('socialQuery', 'defaultImageUrl', '')} size="small">
                                            {__('Remove', 'b-slider')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    />
                </div>
            )}

            <FieldGroup title={__('The text', 'b-slider')} />

            {/* Whether, then how much — the two used to be a scroll apart, in different panels,
                answering what reads as one question about the title. Moved from the old Slide Content
                panel; see the note in `General`. */}
            <ToggleControl
                className={gap}
                label={__('Show Title', 'b-slider')}
                checked={title?.isVisible !== false}
                onChange={val => updateObject('title', 'isVisible', val)}
            />

            <TipRange
                className={gap}
                label={__('Title Length', 'b-slider')}
                value={titleLength}
                onChange={val => updateObject('socialQuery', 'titleLength', val)}
                min={-1}
                max={100}
                step={1}
                tip={__('Words of the title to show. -1 shows all.', 'b-slider')}
            />

            <ToggleControl
                className={gap}
                label={__('Show Description', 'b-slider')}
                checked={desc?.isVisible !== false}
                onChange={val => updateObject('desc', 'isVisible', val)}
            />

            <TipRange
                className={gap}
                label={isPostish ? __('Excerpt Length', 'b-slider') : __('Description Length', 'b-slider')}
                value={excerptLength}
                onChange={val => updateObject('postsQuery', 'excerptLength', val)}
                min={-1}
                max={120}
                step={1}
                tip={isPostish
                    ? __('Words of the item description to show. -1 shows all of it.', 'b-slider')
                    : __('Words of the video description to show. -1 shows all of it.', 'b-slider')}
            />

            <ToggleControl className={gap} label={__('Show Button', 'b-slider')} checked={button?.isVisible !== false} onChange={val => updateObject('button', 'isVisible', val)} />

            {button?.isVisible !== false &&
                <TextControl className={gap} label={__('Text', 'b-slider')} value={button?.text} onChange={val => updateObject('button', 'text', val)} />}

            {/* Moved from the old Slide Content panel; see the note in `General`. Its own group rather
                than folded into "The text" above: this is the caption's own container — when it
                appears at all and what sits behind it — not the words inside it, and rather than
                folded into "Hovering a slide" below: that one is about a slide's interactive
                behaviour, a preview and a set of quick actions, and this is about what the caption
                looks like at rest. */}
            <FieldGroup title={__('Slide Content & Hover', 'b-slider')} />

            <div className={`bsbTipRow ${gap}`}>
                <ToggleControl
                    label={__('Show content on hover', 'b-slider')}
                    checked={'hover' === (caption?.display || 'always')}
                    onChange={val => updateObject('caption', 'display', val ? 'hover' : 'always')}
                />

                <HelpTip label={__('About the slide content', 'b-slider')}>
                    {__('Content shows when you hover the picture.', 'b-slider')}
                </HelpTip>
            </div>

            {'hover' === caption?.display && (
                <div className="bsb-selective-hover-options mt10 ml15">
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

                    {button?.isVisible !== false && (
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

            <FieldGroup title={__('Clicking a slide', 'b-slider')} />

            {isPro ? (
                <>
                    {/* Offered for every feed type now. It was YouTube-only, which matched what the popup
                        could actually do at the time — it held a video player and nothing else. */}
                    {/* "What it does", not "Clicking a slide" — that is the group heading directly above it
                        now, and a field repeating its own heading word for word reads as a rendering fault. */}
                    <TipSelect
                        className={gap}
                        label={__('What it does', 'b-slider')}
                        value={playVideo}
                        options={[
                            /* Only the Thumbnails layout has a stage to play on — every other layout is a
                               row of slides with nothing above them, so the option would name a place that
                               is not there. Listed first where it exists, since it is the least disruptive
                               of the four: nothing opens over the page and nothing navigates away. */
                            ...(hasStage ? [{ label: __('Plays in the main player above', 'b-slider'), value: 'stage' }] : []),
                            isVideoish
                                ? { label: __('Plays the video in a popup', 'b-slider'), value: 'popup' }
                                : { label: __('Opens the post in a popup', 'b-slider'), value: 'popup' },
                            /* Only where a click has a video to put in the dock. An RSS or JSON item carries
                               neither a video id nor a file, so the dock would open on nothing — see `isMini`
                               in PostItem, which falls those slides back to the popup. */
                            ...(canPreview ? [{ label: __('Plays in a mini player at the corner', 'b-slider'), value: 'mini' }] : []),
                            isVideoish
                                ? { label: __('Opens the video on YouTube', 'b-slider'), value: 'link' }
                                : { label: __('Opens the original in a new tab', 'b-slider'), value: 'link' }
                        ]}
                        onChange={val => updateObject('socialQuery', 'playVideo', val)}
                        tip={playClickHelp(feedType, playVideo)}
                    />

                    {/* Only worth asking once the dock is what a click does. Four corners and no size control:
                        the dock sizes itself against the viewport, and on a phone it spans the bottom whatever
                        is chosen here — see `.bsbMiniPlayer` in style.scss. */}
                    {'mini' === playVideo && canPreview && (
                        <TipSelect
                            className={gap}
                            label={__('Mini Player Position', 'b-slider')}
                            value={miniPosition}
                            options={[
                                { label: __('Bottom right', 'b-slider'), value: 'bottom-right' },
                                { label: __('Bottom left', 'b-slider'), value: 'bottom-left' },
                                { label: __('Top right', 'b-slider'), value: 'top-right' },
                                { label: __('Top left', 'b-slider'), value: 'top-left' }
                            ]}
                            onChange={val => updateObject('socialQuery', 'miniPosition', val)}
                            tip={__('Which corner the player docks in.', 'b-slider')}
                        />
                    )}

                    {/* Instagram only, and only where there is a popup to put it in. Instagram declines to
                        give a video file for some Reels — the ones with licensed audio, measured against a
                        real account — and this decides what the popup does about it: show the still, or
                        stand Instagram's own player in its place. Off by default, because the stand-in loads
                        Instagram's scripts into the page and that is exactly what a slider with Store Locally
                        switched on is trying to avoid. */}
                    {/* The popup and nothing else. The stand-in is a player for a video Instagram withheld the
                        file for, and the mini player is built from that same file — there is nothing for the
                        dock to fall back to, so offering the toggle there would be offering a setting that
                        cannot apply. */}
                    {'instagram' === feedType && 'popup' === playVideo && (
                        <TipToggle
                            className={gap}
                            label={__('Use Instagram\u2019s player for withheld videos', 'b-slider')}
                            checked={!!instagramEmbedFallback}
                            onChange={val => updateObject('socialQuery', 'instagramEmbedFallback', val)}
                            tip={__('Reels with no video file play in Instagram\u2019s own player.', 'b-slider')}
                        />
                    )}

                    {/* Belongs with the click and nowhere else — it decides where the link a click follows
                        opens. It was at the foot of the panel, three fields below the setting that decides
                        whether there is a link at all. */}
                    {/* A YouTube feed sees this too once a click is what leaves the page. It was hidden there
                        because the only link on such a slide was the caption's button; with the picture itself
                        sending the visitor to YouTube, "does it open beside my page or instead of it" is a
                        question that feed now has as well — and one setting answers both links, so the two ways
                        off a slide cannot open differently. */}
                    {(isPostish || 'link' === playVideo) && (
                        <ToggleControl
                            className={gap}
                            label={__('Open links in a new tab', 'b-slider')}
                            checked={linkTarget === '_blank'}
                            onChange={val => updateObject('socialQuery', 'linkTarget', val ? '_blank' : '')}
                        />
                    )}
                </>
            ) : (
                <ProNotice className='mt15' features={PRO_FEATURES.feedSlideLink} />
            )}

            {/* Only the feed types that have something to play. A YouTube item carries a video id and
                Instagram carries the file itself; an RSS or JSON item carries neither, so the toggle
                would be an offer nothing could accept — see `hoverPreviewOf`. */}
            {/* The group is here for every feed type, because the quick actions below are: an RSS item
                has no video to preview and still has an original to open. Only the preview toggle
                inside it is asked conditionally. */}
            <FieldGroup title={__('Hovering a slide', 'b-slider')} />

            {isPro ? (
                <>
                    {canPreview && (
                        <TipToggle
                            className={gap}
                            label={__('Play a muted preview on hover', 'b-slider')}
                            checked={!!hoverPreview}
                            onChange={val => updateObject('socialQuery', 'hoverPreview', val)}
                            tip={__('Resting on a slide plays its video, muted.', 'b-slider')}
                        />
                    )}

                    <TipToggle
                        className={gap}
                        label={__('Show quick action buttons on hover', 'b-slider')}
                        checked={showHoverActions}
                        onChange={val => updateObject('socialQuery', 'hoverActions', val)}
                        tip={__('Small buttons appear in the corner of a slide.', 'b-slider')}
                    />

                    {showHoverActions && (
                        <TipSelect
                            className={gap}
                            label={__('Quick action buttons position', 'b-slider')}
                            value={socialQuery?.hoverActionsPosition || 'top-right'}
                            options={[
                                { label: __('Top Right', 'b-slider'), value: 'top-right' },
                                { label: __('Top Left', 'b-slider'), value: 'top-left' },
                                { label: __('Bottom Right', 'b-slider'), value: 'bottom-right' },
                                { label: __('Bottom Left', 'b-slider'), value: 'bottom-left' }
                            ]}
                            onChange={val => updateObject('socialQuery', 'hoverActionsPosition', val)}
                        />
                    )}
                </>
            ) : (
                <ProNotice className='mt15' features={PRO_FEATURES.feedHover} />
            )}

            {['feed-hover-overlay-grid', 'feed-card-grid-solid'].includes(activePreset) && (
                <ToggleControl
                    className='mt15'
                    label={__('Show Likes & Comments', 'b-slider')}
                    checked={!!showLikesComments}
                    onChange={val => updateObject('socialQuery', 'showLikesComments', val)}
                />
            )}

            {!isProActive() && feedType === 'youtube' && (
                <ProNotice className='mt15' features={PRO_FEATURES.feedThumbQuality} />
            )}

        </PanelBody>
    );
};

export default SocialSlides;

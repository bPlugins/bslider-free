import { __ } from '@wordpress/i18n';
import { ToggleControl, TextControl, SelectControl, Button } from '@wordpress/components';
import { MediaUpload } from '@wordpress/block-editor';
import { PanelBody } from '../../../Panel/AccordionPanel';
import FieldGroup from '../../../Panel/FieldGroup';
import HelpTip from '../../../Panel/HelpTip';
import { Label, Notice } from '../../../../../../bpl-tools/Components';
import { TipSelect, TipRange, TipText } from '../../../Panel/TipField';

const SocialSlides = ({ attributes, updateObject }) => {
    const { socialQuery = {}, postsQuery = {}, title, desc, caption, image, button } = attributes;

    const { feedType = 'youtube', defaultImageUrl = '', imageFit = 'blur', titleLength = -1, showLikesComments = false, activePreset = '', showSourceIcon = true, showPlayIcon = true } = socialQuery;
    const { excerptLength = 25 } = postsQuery;

    const isVideoish = feedType === 'youtube' || feedType === 'youtube_video';
    const isPostish = !isVideoish;

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

            <Notice className="mt15" status="premium" isIcon={true}>
                {__('Click behavior (What it does), Mini Player Position, and link target options are available in the Premium version.', 'b-slider')}
            </Notice>

            {/* Only the feed types that have something to play. A YouTube item carries a video id and
                Instagram carries the file itself; an RSS or JSON item carries neither, so the toggle
                would be an offer nothing could accept — see `hoverPreviewOf`. */}
            {/* The group is here for every feed type, because the quick actions below are: an RSS item
                has no video to preview and still has an original to open. Only the preview toggle
                inside it is asked conditionally. */}
            <FieldGroup title={__('Hovering a slide', 'b-slider')} />

            <Notice className="mt15" status="premium" isIcon={true}>
                {__('Hover preview, quick action buttons, and position options are available in the Premium version.', 'b-slider')}
            </Notice>

            {['feed-hover-overlay-grid', 'feed-card-grid-solid'].includes(activePreset) && (
                <ToggleControl
                    className='mt15'
                    label={__('Show Likes & Comments', 'b-slider')}
                    checked={!!showLikesComments}
                    onChange={val => updateObject('socialQuery', 'showLikesComments', val)}
                />
            )}

            {feedType === 'youtube' && (
                <Notice className="mt15" status="premium" isIcon={true}>
                    {__('YouTube Thumbnail Quality is available in the Premium version.', 'b-slider')}
                </Notice>
            )}

        </PanelBody>
    );
};

export default SocialSlides;

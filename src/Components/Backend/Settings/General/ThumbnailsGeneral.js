import { __ } from '@wordpress/i18n';
import { SelectControl, ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import Controls from './Carousel/Controls';
import { caroDirectionOpt } from '../../../../utils/options';
import Notice from '../../Notice';
import { BControlPro } from '../../../../../../bpl-tools/ProControls';

const ThumbnailsGeneral = ({ attributes, updateObject, premiumProps }) => {
    const { carousel, arrow, thumbnails, sourceType, socialQuery } = attributes
    const { caroDirection } = carousel;
    const {
        mode = 'slider',
        showStage = true,
        showDuration = false,
        showPlay = false,
        navPosition = 'overlay',
        cardStyle = 'bare',
        showCardTitle = false,
        showCardMeta = false,
        showCardExcerpt = false
    } = thumbnails || {};

    const isGrid = 'grid' === mode;

    /**
     * Whether the thumbnails have a title, a date or a description behind them.
     *
     * A feed item carries all four fields the card can print; an image slider's slides carry a
     * picture and nothing else — see `ThumbnailsGrid`. A post source would qualify too, but its
     * thumbnails come from the query rather than a feed, so this stays with the source that has
     * been tested against it.
     */
    const canShowCardText = 'social' === sourceType;

    /**
     * Whether the items under the stage have a length to print.
     *
     * Only a YouTube feed carries `duration`, and only on the API path — see the note beside it in
     * `YouTubeFeed::makeItem()`. An image slider's thumbnails have none, so the control is hidden
     * rather than offered as a toggle that does nothing.
     */
    const canShowDuration = 'social' === sourceType && 'youtube' === socialQuery?.feedType;

    const controlsProps = {
        attributes,
        updateObject,
        premiumProps
    }
    return <PanelBody className='bPlPanelBody' title={__('Thumbnails', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
        <Notice />

        {/* First, because it changes what the rest of the panel means: a direction belongs to a row
            that scrolls, and the arrows move from over the picture to under it. */}
        <SelectControl
            className='mt10'
            label={__('Thumbnail Layout', 'b-slider')}
            value={mode}
            options={[
                { value: 'slider', label: __('Slider — one scrolling row', 'b-slider') },
                { value: 'grid', label: __('Grid — wrapping rows', 'b-slider') }
            ]}
            onChange={val => updateObject('thumbnails', 'mode', val)}
            help={isGrid
                ? __('Thumbnails wrap into rows using the Columns setting. Click one to play it above.', 'b-slider')
                : __('Thumbnails scroll in a single row beside the slider.', 'b-slider')}
        />

        {/* Straight after the mode, because it is the other half of the same question — what this
            layout is made of. Grid mode only: the scrolling row is paired to the stage by Swiper's
            `Thumbs`, so without one it has nothing to drive and no way to show what is chosen. */}
        {isGrid && <ToggleControl
            className='mt15'
            label={__('Show Main Preview', 'b-slider')}
            checked={false !== showStage}
            onChange={val => updateObject('thumbnails', 'showStage', val)}
            help={false === showStage
                ? __('Hidden — the thumbnails are the whole slider, and each one links to its own page.', 'b-slider')
                : __('The large picture or player above the thumbnails.', 'b-slider')}
        />}

        <Controls {...controlsProps} />

        {/* A row can run down the side; a wrapping grid cannot, so the control goes with the mode
            that has something to do with it. */}
        {!isGrid && <BControlPro className='mt10' label={__('Direction', 'b-slider')} value={caroDirection} options={caroDirectionOpt} onChange={val => updateObject("carousel", "caroDirection", val)} Component={SelectControl} {...premiumProps} />}

        {/* Only where the items carry words to print. An image slider's thumbnails have a picture and
            nothing else, so the whole group is hidden rather than offered as toggles that do nothing. */}
        {isGrid && canShowCardText && <>
            <SelectControl
                className='mt20'
                label={__('Thumbnail Card', 'b-slider')}
                value={cardStyle}
                options={[
                    { value: 'bare', label: __('Picture only', 'b-slider') },
                    { value: 'stacked', label: __('Text under the picture', 'b-slider') },
                    { value: 'beside', label: __('Text beside the picture', 'b-slider') }
                ]}
                onChange={val => updateObject('thumbnails', 'cardStyle', val)}
                help={'beside' === cardStyle
                    ? __('Wide rows — two columns suits this better than three.', 'b-slider')
                    : undefined}
            />

            {'bare' !== cardStyle && <>
                <ToggleControl
                    className='mt10'
                    label={__('Show Title', 'b-slider')}
                    checked={!!showCardTitle}
                    onChange={val => updateObject('thumbnails', 'showCardTitle', val)}
                />

                <ToggleControl
                    className='mt10'
                    label={__('Show Views & Date', 'b-slider')}
                    checked={!!showCardMeta}
                    onChange={val => updateObject('thumbnails', 'showCardMeta', val)}
                    help={__('View counts need a YouTube API key.', 'b-slider')}
                />

                <ToggleControl
                    className='mt10'
                    label={__('Show Description', 'b-slider')}
                    checked={!!showCardExcerpt}
                    onChange={val => updateObject('thumbnails', 'showCardExcerpt', val)}
                />
            </>}
        </>}

        {canShowDuration && <ToggleControl
            className='mt20'
            label={__('Show Video Length', 'b-slider')}
            checked={!!showDuration}
            onChange={val => updateObject('thumbnails', 'showDuration', val)}
            help={__('Prints each video’s length in the corner of its thumbnail. Needs a YouTube API key.', 'b-slider')}
        />}

        <ToggleControl
            className='mt10'
            label={__('Show Play Icon', 'b-slider')}
            checked={!!showPlay}
            onChange={val => updateObject('thumbnails', 'showPlay', val)}
            help={__('Marks each thumbnail as a video rather than a picture.', 'b-slider')}
        />

        {/* The arrows move the stage, so they go with it. */}
        {false !== showStage && <BControlPro className='mt20' label={__('Show Arrow/Navigation', 'b-slider')} checked={arrow.visibility} onChange={(value) => { updateObject('arrow', 'visibility', value) }} Component={ToggleControl} {...premiumProps} />}

        {false !== showStage && !!arrow?.visibility && <SelectControl
            className='mt10'
            label={__('Navigation Position', 'b-slider')}
            value={navPosition}
            options={[
                { value: 'overlay', label: __('Over the slide', 'b-slider') },
                { value: 'below', label: __('Below, as Prev / Next', 'b-slider') }
            ]}
            onChange={val => updateObject('thumbnails', 'navPosition', val)}
        />}
    </PanelBody>
}
export default ThumbnailsGeneral;
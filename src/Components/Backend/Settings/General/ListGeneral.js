import { __ } from '@wordpress/i18n';
import { PanelBody } from '../../../Panel/AccordionPanel';
import FieldGroup from '../../../Panel/FieldGroup';
import { TipSelect, TipToggle, TipRange } from '../../../Panel/TipField';

/**
 * Everything the List layout does, in the order a visitor meets it.
 *
 * The stage first, then the list under it, then what the list does by itself. Only ever rendered for a
 * YouTube channel feed — `General` asks that question, and the layout cannot be chosen anywhere else.
 *
 * Colours live in the Style tab with the rest of the slider's looks, in `ListStyle`.
 */
const ListGeneral = ({ attributes, updateObject }) => {
    const { listLayout = {} } = attributes;

    const {
        listPosition = 'below',
        stageRatio = '16/9',
        stickyStage = false,
        showStageMeta = true,
        rows = 4,
        thumbWidth = 168,
        thumbRatio = '16/9',
        rowGap = 8,
        rowPadding = 8,
        rowRadius = 10,
        titleLines = 2,
        showFilter = true,
        showDuration = true,
        showViews = true,
        showDate = true,
        autoplayNext = true,
        loopList = false,
        rememberProgress = true,
        hoverPreviewRows = true
    } = listLayout;

    const gap = 'mb15';
    const set = (key, value) => updateObject('listLayout', key, value);

    return (
        <PanelBody
            className='bPlPanelBody bsb_list_layout_panel'
            title={__('List Layout', 'b-slider')}
            badge={__('New', 'b-slider')}
            initialOpen={false}
        >
            <FieldGroup
                title={__('The stage', 'b-slider')}
                hint={__('The video playing above the list. Nothing is loaded from YouTube until a visitor presses play.', 'b-slider')}
                first
            />

            <TipSelect
                className={gap}
                label={__('Where the list sits', 'b-slider')}
                value={listPosition}
                options={[
                    { label: __('Below the video', 'b-slider'), value: 'below' },
                    { label: __('Beside the video (on desktop)', 'b-slider'), value: 'beside' }
                ]}
                onChange={val => set('listPosition', val)}
                tip={__('Beside the video on wide screens, below it on narrow ones.', 'b-slider')}
            />

            <TipSelect
                className={gap}
                label={__('Video shape', 'b-slider')}
                value={stageRatio}
                options={[
                    { label: __('16:9 — widescreen', 'b-slider'), value: '16/9' },
                    { label: __('4:3 — older uploads', 'b-slider'), value: '4/3' },
                    { label: __('1:1 — square', 'b-slider'), value: '1/1' },
                    { label: __('9:16 — vertical, for a Shorts channel', 'b-slider'), value: '9/16' }
                ]}
                onChange={val => set('stageRatio', val)}
                tip={__('The frame the video plays in. 16:9 suits most channels.', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Keep the video in view while the list scrolls', 'b-slider')}
                checked={!!stickyStage}
                onChange={val => set('stickyStage', val)}
                tip={__('The video sticks to the top of the screen.', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Show the title and facts under the video', 'b-slider')}
                checked={!!showStageMeta}
                onChange={val => set('showStageMeta', val)}
                tip={__('Title, views, date and a link to YouTube.', 'b-slider')}
            />

            <FieldGroup
                title={__('The list', 'b-slider')}
                hint={__('How many videos are in view, and how big each row is.', 'b-slider')}
            />

            <TipRange
                className={gap}
                label={__('Rows in view', 'b-slider')}
                value={rows}
                onChange={val => set('rows', val)}
                min={2}
                max={12}
                step={1}
                tip={__('How tall the list is. The rest scrolls.', 'b-slider')}
            />

            <TipRange
                className={gap}
                label={__('Thumbnail width (px)', 'b-slider')}
                value={thumbWidth}
                onChange={val => set('thumbWidth', val)}
                min={80}
                max={320}
                step={4}
                tip={__('How wide each row’s picture is. The title takes the rest of the row.', 'b-slider')}
            />

            <TipSelect
                className={gap}
                label={__('Thumbnail shape', 'b-slider')}
                value={thumbRatio}
                options={[
                    { label: __('16:9 — widescreen', 'b-slider'), value: '16/9' },
                    { label: __('4:3 — older uploads', 'b-slider'), value: '4/3' },
                    { label: __('1:1 — square', 'b-slider'), value: '1/1' },
                    { label: __('9:16 — vertical, for a Shorts channel', 'b-slider'), value: '9/16' }
                ]}
                onChange={val => set('thumbRatio', val)}
                tip={__('Usually the same shape as the video above it.', 'b-slider')}
            />

            <TipRange
                className={gap}
                label={__('Space between rows (px)', 'b-slider')}
                value={rowGap}
                onChange={val => set('rowGap', val)}
                min={0}
                max={32}
                step={1}
                tip={__('At 0 the rows meet, so the list reads as one block rather than separate cards.', 'b-slider')}
            />

            <TipRange
                className={gap}
                label={__('Space inside a row (px)', 'b-slider')}
                value={rowPadding}
                onChange={val => set('rowPadding', val)}
                min={0}
                max={24}
                step={1}
                tip={__('The room around each row’s picture and title.', 'b-slider')}
            />

            <TipRange
                className={gap}
                label={__('Rounded row corners (px)', 'b-slider')}
                value={rowRadius}
                onChange={val => set('rowRadius', val)}
                min={0}
                max={24}
                step={1}
                tip={__('0 leaves the corners square.', 'b-slider')}
            />

            <TipRange
                className={gap}
                label={__('Title lines per row', 'b-slider')}
                value={titleLines}
                onChange={val => set('titleLines', val)}
                min={1}
                max={4}
                step={1}
                tip={__('Longer titles are cut off, so rows stay level.', 'b-slider')}
            />

            <FieldGroup
                title={__('What each row says', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Duration on the thumbnail', 'b-slider')}
                checked={!!showDuration}
                onChange={val => set('showDuration', val)}
                tip={__('The video’s length, in the corner of its picture.', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('View count', 'b-slider')}
                checked={!!showViews}
                onChange={val => set('showViews', val)}
                tip={__('Only shown where YouTube reported one.', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Publish date', 'b-slider')}
                checked={!!showDate}
                onChange={val => set('showDate', val)}
                tip={__('When the video went up, as YouTube reports it.', 'b-slider')}
            />

            <FieldGroup
                title={__('What the list does', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Play the next video when one ends', 'b-slider')}
                checked={!!autoplayNext}
                onChange={val => set('autoplayNext', val)}
                tip={__('The list plays through in order.', 'b-slider')}
            />

            {!!autoplayNext && (
                <TipToggle
                    className={gap}
                    label={__('Start again after the last one', 'b-slider')}
                    checked={!!loopList}
                    onChange={val => set('loopList', val)}
                    tip={__('The list plays round instead of stopping at the end.', 'b-slider')}
                />
            )}

            <TipToggle
                className={gap}
                label={__('Remember what has been watched', 'b-slider')}
                checked={!!rememberProgress}
                onChange={val => set('rememberProgress', val)}
                tip={__('Watched rows are marked and half-watched ones resume.', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Search box above the list', 'b-slider')}
                checked={!!showFilter}
                onChange={val => set('showFilter', val)}
                tip={__('Filters the videos already on the page.', 'b-slider')}
            />

            <TipToggle
                className={gap}
                label={__('Preview a row on hover', 'b-slider')}
                checked={!!hoverPreviewRows}
                onChange={val => set('hoverPreviewRows', val)}
                tip={__('Resting on a row plays it muted, in its thumbnail.', 'b-slider')}
            />
        </PanelBody>
    );
};

export default ListGeneral;

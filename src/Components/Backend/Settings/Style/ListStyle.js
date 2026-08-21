import { __ } from '@wordpress/i18n';
import { ColorPalette, BaseControl } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import HelpTip from '../../../Panel/HelpTip';

/**
 * The List layout's colours.
 *
 * Six of them, each answering one question a channel list asks of a theme: what a row looks like at rest,
 * under the cursor, and while it is playing; what its title and its facts are set in; and the two marks
 * that say something about the video rather than about the row — the bar down the playing one, and the
 * "watched" note.
 *
 * `ColorPalette` rather than the shared `ColorsControl`: these are single colours, not the
 * text-and-background pairs that control is built around, and pairing them would invent settings nobody
 * asked for. Everything written here is read by `Style` as a custom property, so a change is one CSS
 * variable and no re-render of the list.
 */
const swatch = (label, help, value, onChange) => <BaseControl
    __nextHasNoMarginBottom
    /* The mark rather than a line of text under the swatches, so the Style tab reads like the General
       tab — see `HelpTip`. A swatch with nothing to explain simply has no mark. */
    label={help ? <>{label}<HelpTip>{help}</HelpTip></> : label}
>
    <ColorPalette value={value} onChange={colour => onChange(colour || '')} enableAlpha clearable />
</BaseControl>;

const ListStyle = ({ attributes, updateObject }) => {
    const { listLayout = {} } = attributes;

    const {
        rowBg = '',
        rowHoverBg = 'rgba(0,0,0,0.05)',
        rowActiveBg = 'rgba(24,108,245,0.10)',
        rowTitleColor = '#111827',
        rowMetaColor = '#6b7280',
        activeBarColor = '#ff0000',
        watchedColor = '#16a34a'
    } = listLayout;

    const set = key => value => updateObject('listLayout', key, value);

    return (
        <PanelBody className='bPlPanelBody' title={__('List Layout Colors', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
            {swatch(
                __('Row', 'b-slider'),
                __('Left empty the rows sit on whatever the page is, which is usually what a theme wants.', 'b-slider'),
                rowBg,
                set('rowBg')
            )}

            {swatch(
                __('Row under the cursor', 'b-slider'),
                __('What a row looks like while it is being pointed at, so a visitor can see which one a click would take.', 'b-slider'),
                rowHoverBg,
                set('rowHoverBg')
            )}

            {swatch(
                __('Row that is playing', 'b-slider'),
                __('The one row the list is about. It also carries the bar below.', 'b-slider'),
                rowActiveBg,
                set('rowActiveBg')
            )}

            {swatch(
                __('Row title', 'b-slider'),
                __('The video’s name — the line a visitor reads first, so it wants the strongest contrast here.', 'b-slider'),
                rowTitleColor,
                set('rowTitleColor')
            )}

            {swatch(
                __('Views and date', 'b-slider'),
                __('The quieter line under each title.', 'b-slider'),
                rowMetaColor,
                set('rowMetaColor')
            )}

            {swatch(
                __('Playing marker', 'b-slider'),
                __('The bar down the side of the playing row, and the progress bar on a video left part-way.', 'b-slider'),
                activeBarColor,
                set('activeBarColor')
            )}

            {swatch(
                __('Watched mark', 'b-slider'),
                __('Shown only where “Remember what has been watched” is on.', 'b-slider'),
                watchedColor,
                set('watchedColor')
            )}
        </PanelBody>
    );
};

export default ListStyle;

import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { ColorControl } from '../../../../../../bpl-tools/Components/ColorControl/ColorControl';
import HelpTip from '../../../Panel/HelpTip';
import { postContentLayout } from '../../../../utils/functions';

/** Dark text for a light panel; switching back restores white only where these were set. */
const DARK = { title: '#1e1e1e', desc: '#4b5563', btn: '#1e1e1e' };
const isWhite = color => ['#fff', '#ffffff', 'white'].includes(String(color || '').trim().toLowerCase());

/** Post Types, Default and Carousel: text over the picture, under it, or beside it. */
const ContentLayout = ({ attributes, setAttributes, className = 'mt15' }) => {
    const { sourceType, layoutType, titleColor, descColor, btnColors = {}, cardBgColor } = attributes;

    if ('posts' !== sourceType || !['default', 'carousel'].includes(layoutType)) {
        return null;
    }

    const current = postContentLayout(attributes);

    const onChange = val => {
        const toPanel = 'overlay' !== val;
        const fromPanel = 'overlay' !== current;
        const next = { contentLayout: val };

        if (toPanel && !fromPanel) {
            isWhite(titleColor) && (next.titleColor = DARK.title);
            isWhite(descColor) && (next.descColor = DARK.desc);
            isWhite(btnColors.color) && (next.btnColors = { ...btnColors, color: DARK.btn });
        }

        if (!toPanel && fromPanel) {
            DARK.title === titleColor && (next.titleColor = '#fff');
            DARK.desc === descColor && (next.descColor = '#fff');
            DARK.btn === btnColors.color && (next.btnColors = { ...btnColors, color: '#fff' });
        }

        setAttributes(next);
    };

    return <>
        <SelectControl
            className={className}
            label={<>{__('Content Layout', 'b-slider')} <HelpTip label={__('About content layout', 'b-slider')}>
                {__('Where the title, text and button sit. Beside the picture turns into below on phones.', 'b-slider')}
            </HelpTip></>}
            value={current}
            options={[
                { label: __('Over the picture', 'b-slider'), value: 'overlay' },
                { label: __('Below the picture', 'b-slider'), value: 'below' },
                { label: __('Beside the picture', 'b-slider'), value: 'beside' },
            ]}
            onChange={onChange}
        />

        {'overlay' !== current && <ColorControl className='mt10' label={__('Content Background', 'b-slider')} value={cardBgColor} defaultColor='#ffffff' onChange={val => setAttributes({ cardBgColor: val })} />}
    </>;
};

export default ContentLayout;

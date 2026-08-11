import { __ } from '@wordpress/i18n';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { ColorsControl, Typography } from '../../../../../../bpl-tools/Components';

/**
 * How every badge on the slider looks — one set of values, not one per badge.
 *
 * The per-badge panel already answers what a badge *is*: which corner it sits in, its icon, whether its
 * label shows. This answers what they all look like, which is a different question and a shorter one —
 * nobody wants to set a font size four times because they picked four badges.
 *
 * Only offered where badges have been chosen, and it reaches only badges: an ACF field wears the same
 * markup and has its own settings, so the CSS names `.bsb-acf-item--badge` — see `badgeCSS` in `Style`.
 */
const BadgeStyle = ({ attributes, setAttributes }) => {
    const { badgeStyle = {} } = attributes;

    const set = (key, value) => setAttributes({ badgeStyle: { ...badgeStyle, [key]: value } });

    return (
        <PanelBody
            className='bPlPanelBody'
            title={__('Badges', 'b-slider')}
            /* Only appears once badges are chosen, so it is easy to miss that styling them is possible
               at all — worth pointing at until it stops being news. */
            badge={__('New', 'b-slider')}
            initialOpen={false}
        >
            <Typography
                label={__('Typography', 'b-slider')}
                value={badgeStyle?.typo}
                onChange={val => set('typo', val)}
                defaults={{ fontSize: 12 }}
            />

            {/* Text and background as one control, because on a chip they are one decision: a colour that
                cannot be read on its background is the only way to get this wrong. */}
            <ColorsControl
                className='mt20'
                label={__('Colors', 'b-slider')}
                value={badgeStyle?.colors}
                onChange={val => set('colors', val)}
                defaults={{ color: '#ffffff', bg: 'rgba(0,0,0,0.65)' }}
            />
        </PanelBody>
    );
};

export default BadgeStyle;

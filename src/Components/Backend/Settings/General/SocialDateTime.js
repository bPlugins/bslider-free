import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { TipSelect, TipText, TipToggle, TipCombobox } from '../../../Panel/TipField';
import { isProActive } from '../../../../utils/functions';
import ProCard from '../../../Panel/ProCard';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';

/**
 * How a feed's own date is written wherever a slider shows one.
 *
 * It used to sit inside `SocialFiltering`, which is otherwise about which videos or posts reach the
 * slider at all — order, keywords, age, how many. None of these five settings narrow that list; they
 * decide how the date on an already-chosen item is written. They stayed there anyway, so a slider
 * with the "date" badge switched off and the RSS/JSON options never touched still carried Timezone
 * Offset and Translate Date fields for a badge nobody had turned on.
 *
 * It also cannot move inside Social Badges' own "Publish Date" section, tempting as that looks: these
 * five reach further than the badge does. `getLocalizedDate()` is read by the on-slide badge, by the
 * popup a click opens (`PostItem`'s `bsbFeedPostDate`), and by the List layout's row and stage
 * (`ListRow`, `List`) — none of which requires the badge to be selected. Gating the fields behind
 * "date badge chosen" would have taken them away from anyone shaping only the popup's or the list's
 * date, which is a real use and one the badge toggle knows nothing about.
 *
 * So a panel of its own: not tied to a badge, not filtering anything, shown for every feed type that
 * can carry a date except `youtube_video` — a single clip has no feed of its own to format the date
 * of, the same reason `SocialFiltering` skips it too.
 */
const SocialDateTime = ({ attributes, updateObject, premiumProps }) => {
    const { socialQuery } = attributes || {};
    const isPro = premiumProps?.isPremium ?? isProActive();
    const {
        feedType = 'youtube',
        rssTimezoneOffset = '',
        rssTranslateDate = '',
        metaDateFormat = '',
        rssLocalTimezone = false,
    } = socialQuery || {};

    const dateFormatOptions = [
        { label: __('August 14, 2026 (F j, Y)', 'b-slider'), value: 'F j, Y' },
        { label: __('August 14, 2026 10:42 am (F j, Y g:i a)', 'b-slider'), value: 'F j, Y g:i a' },
        { label: __('2026-08-14 (Y-m-d)', 'b-slider'), value: 'Y-m-d' },
        { label: __('08/14/2026 (m/d/Y)', 'b-slider'), value: 'm/d/Y' },
        { label: __('14/08/2026 (d/m/Y)', 'b-slider'), value: 'd/m/Y' },
        { label: __('10:42 am (g:i a)', 'b-slider'), value: 'g:i a' },
        { label: __('Custom Format', 'b-slider'), value: 'custom' },
    ];

    const timezoneOptions = [
        { label: __('WordPress Site Default', 'b-slider'), value: 'site' },
        { label: __('UTC -12:00', 'b-slider'), value: '-12' },
        { label: __('UTC -11:00', 'b-slider'), value: '-11' },
        { label: __('UTC -10:00 (Hawaii)', 'b-slider'), value: '-10' },
        { label: __('UTC -09:00 (Alaska)', 'b-slider'), value: '-9' },
        { label: __('UTC -08:00 (Pacific Time - US & Canada)', 'b-slider'), value: '-8' },
        { label: __('UTC -07:00 (Mountain Time - US & Canada)', 'b-slider'), value: '-7' },
        { label: __('UTC -06:00 (Central Time - US & Canada)', 'b-slider'), value: '-6' },
        { label: __('UTC -05:00 (Eastern Time - US & Canada)', 'b-slider'), value: '-5' },
        { label: __('UTC -04:00 (Atlantic Time - Canada)', 'b-slider'), value: '-4' },
        { label: __('UTC -03:30 (Newfoundland - Canada)', 'b-slider'), value: '-3.5' },
        { label: __('UTC -03:00 (Brazil/Argentina)', 'b-slider'), value: '-3' },
        { label: __('UTC -02:00', 'b-slider'), value: '-2' },
        { label: __('UTC -01:00', 'b-slider'), value: '-1' },
        { label: __('UTC +00:00 (GMT - United Kingdom)', 'b-slider'), value: '0' },
        { label: __('UTC +01:00 (Central European Time - Germany & Europe)', 'b-slider'), value: '1' },
        { label: __('UTC +02:00 (Eastern European Time - Europe & Egypt)', 'b-slider'), value: '2' },
        { label: __('UTC +03:00 (Moscow / Turkey / East Africa)', 'b-slider'), value: '3' },
        { label: __('UTC +03:30 (Iran)', 'b-slider'), value: '3.5' },
        { label: __('UTC +04:00 (Gulf / UAE)', 'b-slider'), value: '4' },
        { label: __('UTC +04:30 (Afghanistan)', 'b-slider'), value: '4.5' },
        { label: __('UTC +05:00 (Pakistan / Maldives)', 'b-slider'), value: '5' },
        { label: __('UTC +05:30 (India Standard Time)', 'b-slider'), value: '5.5' },
        { label: __('UTC +05:45 (Nepal)', 'b-slider'), value: '5.75' },
        { label: __('UTC +06:00', 'b-slider'), value: '6' },
        { label: __('UTC +06:30 (Myanmar)', 'b-slider'), value: '6.5' },
        { label: __('UTC +07:00 (Thailand / Vietnam / Jakarta)', 'b-slider'), value: '7' },
        { label: __('UTC +08:00 (Singapore / China / Hong Kong / West Australia)', 'b-slider'), value: '8' },
        { label: __('UTC +09:00 (Japan / Korea)', 'b-slider'), value: '9' },
        { label: __('UTC +09:30 (Adelaide - Australia)', 'b-slider'), value: '9.5' },
        { label: __('UTC +10:00 (Sydney / Melbourne - Australia)', 'b-slider'), value: '10' },
        { label: __('UTC +11:00 (Solomon Islands)', 'b-slider'), value: '11' },
        { label: __('UTC +12:00 (New Zealand / Fiji)', 'b-slider'), value: '12' },
        { label: __('UTC +13:00 (Tonga)', 'b-slider'), value: '13' },
        { label: __('UTC +14:00 (Line Islands)', 'b-slider'), value: '14' },
        { label: __('Custom Timezone Offset', 'b-slider'), value: 'custom' },
    ];

    // Local state to keep track of custom selection modes so the dropdowns stay on "custom"
    const [isCustomDate, setIsCustomDate] = useState(
        () => !!(metaDateFormat && !dateFormatOptions.some(opt => opt.value === metaDateFormat))
    );
    const [isCustomTimezone, setIsCustomTimezone] = useState(
        () => !!(rssTimezoneOffset && !timezoneOptions.some(opt => opt.value === rssTimezoneOffset))
    );

    const selectValue = isCustomDate ? 'custom' : (metaDateFormat || 'M j, Y');
    const timezoneSelectValue = isCustomTimezone ? 'custom' : (rssTimezoneOffset || 'site');

    const gap = 'mt15';

    return (
        <PanelBody
            className='bPlPanelBody bsb_social_datetime_panel'
            title={__('Date & Time', 'b-slider')}
            initialOpen={false}
            {...(!isPro ? { badge: <PremiumBadge /> } : { badge: __('New', 'b-slider') })}
        >
            {isPro ? (
                <>
                    {(feedType === 'rss' || feedType === 'json') && (
                        <>
                            <TipToggle
                                className={gap}
                                label={__('Auto Timezone Conversion', 'b-slider')}
                                checked={rssLocalTimezone}
                                onChange={val => updateObject('socialQuery', 'rssLocalTimezone', val)}
                                tip={__('Automatically convert and show the date/time in the visitor\'s local timezone using their browser.', 'b-slider')}
                            />
                            {!rssLocalTimezone && (
                                <>
                                    <TipCombobox
                                        className={gap}
                                        label={__('Timezone Offset', 'b-slider')}
                                        value={timezoneSelectValue}
                                        options={timezoneOptions}
                                        onChange={val => {
                                            if (val === 'custom') {
                                                setIsCustomTimezone(true);
                                            } else {
                                                setIsCustomTimezone(false);
                                                updateObject('socialQuery', 'rssTimezoneOffset', val || 'site');
                                            }
                                        }}
                                        tip={__('Select timezone offset relative to GMT/UTC time. Select WordPress Site Default to match your site settings.', 'b-slider')}
                                    />
                                    {timezoneSelectValue === 'custom' && (
                                        <TipText
                                            className={gap}
                                            label={__('Custom Timezone Offset (Hours)', 'b-slider')}
                                            placeholder={__('e.g. +6 or -5', 'b-slider')}
                                            value={rssTimezoneOffset}
                                            onChange={val => updateObject('socialQuery', 'rssTimezoneOffset', val)}
                                            tip={__('Enter custom timezone offset in hours (e.g. +5.5 or -3.5).', 'b-slider')}
                                        />
                                    )}
                                </>
                            )}
                            <TipText
                                className={gap}
                                label={__('Translate Date & Time', 'b-slider')}
                                placeholder={__('e.g. Monday->Monday||Tuesday->Kedd', 'b-slider')}
                                value={rssTranslateDate}
                                onChange={val => updateObject('socialQuery', 'rssTranslateDate', val)}
                                tip={__('Replace day/month names from the feed. Format: Original->Replacement, separated by ||.', 'b-slider')}
                            />
                        </>
                    )}

                    <TipSelect
                        className={gap}
                        label={__('Date Format', 'b-slider')}
                        value={selectValue}
                        options={dateFormatOptions}
                        onChange={val => {
                            if (val === 'custom') {
                                setIsCustomDate(true);
                            } else {
                                setIsCustomDate(false);
                                updateObject('socialQuery', 'metaDateFormat', val);
                            }
                        }}
                        tip={__('Select how publication dates are displayed on your slides.', 'b-slider')}
                    />

                    {selectValue === 'custom' && (
                        <TipText
                            className={gap}
                            label={__('Custom Date Format', 'b-slider')}
                            value={metaDateFormat}
                            onChange={val => updateObject('socialQuery', 'metaDateFormat', val)}
                            tip={__('Enter custom PHP date format symbols (e.g. j F Y).', 'b-slider')}
                        />
                    )}
                </>
            ) : (
                <ProCard
                    title={__('Date & Time Format', 'b-slider')}
                    description={__('Customize dates to match your site. Set timezone conversion, date translations, and choose custom layouts for displaying dates on slides.', 'b-slider')}
                />
            )}
        </PanelBody>
    );
};

export default SocialDateTime;

import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { Notice } from '@wordpress/components';
import { VideoHelpLink, videoLabels } from '../../../utils/videos';

/* Saved per user in WordPress preferences, so it shows once on every browser. */
const SCOPE = 'bsb/slider';
const KEY = 'templateLibraryNoticeSeen';
const SHOWN_AT = 'templateLibraryNoticeShownAt';
const LIFETIME = 3 * 24 * 60 * 60 * 1000;

const libraryButton = () => document.querySelector('.bPlTemplatesButton');

const TemplateLibraryNotice = () => {
    const { seen, shownAt } = useSelect(select => ({
        seen: select('core/preferences')?.get(SCOPE, KEY),
        shownAt: select('core/preferences')?.get(SCOPE, SHOWN_AT),
    }), []);
    const { set } = useDispatch('core/preferences');
    const [hasLibrary, setHasLibrary] = useState(Boolean(libraryButton()));

    useEffect(() => {
        if (hasLibrary || seen) return undefined;

        // The toolbar button may mount after the sidebar.
        const timer = setInterval(() => libraryButton() && setHasLibrary(true), 500);

        return () => clearInterval(timer);
    }, [hasLibrary, seen]);

    const expired = shownAt && Date.now() - shownAt > LIFETIME;

    // The 3 days start the first time the notice is shown.
    useEffect(() => {
        if (!seen && hasLibrary && !shownAt) set(SCOPE, SHOWN_AT, Date.now());
    }, [seen, hasLibrary, shownAt]);

    if (seen || expired || !hasLibrary) return null;

    const dismiss = () => set(SCOPE, KEY, true);

    return <Notice
        className='bsbTemplateLibraryNotice'
        status='info'
        onRemove={dismiss}
        actions={[{
            label: __('Browse Templates', 'b-slider'),
            variant: 'primary',
            onClick: () => { dismiss(); libraryButton()?.click(); },
        }]}
    >
        <strong>{__('New: Template Library', 'b-slider')}</strong>
        <p>{__('Start a slider from 50+ ready-made designs, then change what you like.', 'b-slider')}</p>
        <VideoHelpLink video='templateLibrary' label={videoLabels.templateLibrary()} />
    </Notice>;
};

export default TemplateLibraryNotice;

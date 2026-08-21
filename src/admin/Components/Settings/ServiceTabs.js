import { __ } from '@wordpress/i18n';

/**
 * Which service a screen is showing, chosen on the screen itself.
 *
 * This replaces four nav entries with one row. The sidebar used to carry a heading and a link for
 * every service — ten items under five headings — which described how the plugin is built rather
 * than anything somebody came here to do. Nobody thinks "I need the Instagram Accounts screen and
 * then the Instagram Storage screen"; they think "I want my Instagram feed on a page".
 *
 * The counts are the reason this is a switch and not a dropdown. Seen together they answer "where
 * is my stuff" before anything is clicked, and a service holding nothing says so quietly instead of
 * taking a line in the sidebar for the life of the site.
 */
const ServiceTabs = ({ services, active, onChange, counts = null }) => <div className='bsbServiceTabs' role='tablist'>
    {services.map(service => {
        const count = counts?.[service.slug];

        return <button
            key={service.slug}
            type='button'
            role='tab'
            aria-selected={service.slug === active}
            className={`bsbServiceTab ${service.slug === active ? 'is-active' : ''}`}
            onClick={() => onChange(service.slug)}
        >
            {service.label}
            {/* Only when there is something to count. A `0` beside every empty service is four
                zeros telling somebody they have done nothing, which is not what a count is for. */}
            {!!count && <span className='bsbServiceTabCount'>{count}</span>}
        </button>;
    })}
</div>;

/** The services a source can come from, in the order somebody is likely to reach for them. */
export const SOURCES = [
    { slug: 'youtube', label: __('YouTube', 'b-slider') },
    { slug: 'instagram', label: __('Instagram', 'b-slider') },
    { slug: 'rss', label: __('RSS', 'b-slider') },
    { slug: 'json', label: __('JSON', 'b-slider') },
];

/**
 * `STORABLE` was `SOURCES` without RSS, on the grounds that RSS reads its feed live and stores
 * nothing. That was true only because the block never offered it the choice — the storage side has
 * never had a feed type it refused. With the panel offered to RSS as well, every source here can keep
 * a copy, and a list that excludes none of them is `SOURCES`.
 *
 * Both had to move together: storing RSS items while this screen filtered them out would have put
 * them somewhere with no tab to find them under and no way to clear them.
 */

export default ServiceTabs;

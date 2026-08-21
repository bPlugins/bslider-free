import { useState } from '@wordpress/element';
import Channels from './Channels';
import Integrations from './Integrations';
import ServiceTabs, { SOURCES } from './ServiceTabs';
import useFeedChannels from '../../../hooks/useFeedChannels';

/**
 * Everything this site is connected to, on one screen.
 *
 * Four sidebar entries became one, with the service picked here. The counts come from the library
 * that is loaded anyway, so the row costs nothing and answers "where is my stuff" on sight.
 *
 * The YouTube API key comes with the YouTube sources rather than sitting in a screen of its own
 * called Integrations. It is not an integration in any sense a person would recognise — it is the
 * thing that decides how many videos a YouTube channel can give you, and it belongs beside them.
 */
const Sources = () => {
    const library = useFeedChannels();
    const channels = library.channels || [];

    /**
     * Which service opens first.
     *
     * Whichever the site actually uses, not whichever comes first in the list — a site with three
     * Instagram accounts and no YouTube channel should not open on an empty YouTube screen. Falls
     * back to the first service for a site with nothing connected at all, where every screen is
     * equally empty and the order is the only thing left to go on.
     */
    const counts = channels.reduce((all, channel) => {
        const key = 'youtube_video' === channel.feedType ? 'youtube' : channel.feedType;

        all[key] = (all[key] || 0) + 1;

        return all;
    }, {});

    const [active, setActive] = useState(() =>
        SOURCES.find(service => counts[service.slug])?.slug || SOURCES[0].slug);

    return <div className='bsbSourcesScreen'>
        <ServiceTabs services={SOURCES} active={active} onChange={setActive} counts={counts} />

        <Channels type={active} />

        {'youtube' === active && <div className='bsbSourcesExtra'>
            <Integrations />
        </div>}
    </div>;
};

export default Sources;

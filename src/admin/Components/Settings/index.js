import { __, sprintf, _n } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

import Sources from './Sources';
import useFeedChannels from '../../../hooks/useFeedChannels';

/**
 * The settings screen.
 *
 * One tab here, where the Premium build has three: "At a glance" and "Stored on this site" both
 * report on a feed kept locally, and keeping one is Premium — so a screen for it would have nothing
 * to show. The tab strip is kept rather than collapsed to a bare panel, so the two builds look like
 * the same screen and adding the others back is one entry in this list.
 */
const tabs = [
    {
        slug: 'sources',
        label: __('Sources', 'b-slider'),
        title: __('Connected sources', 'b-slider'),
        component: Sources
    }
];

const Settings = (props) => {
    const [active, setActive] = useState(tabs[0].slug);

    const current = tabs.find(tab => tab.slug === active) || tabs[0];
    const Panel = current.component;

    /**
     * How many saved connections have stopped working.
     *
     * Only Instagram has any: it is the one source here whose address is a credential, and the one
     * that a person can break from the other end. The count sits on the tab that leads to the fix,
     * so somebody who opens this screen for any reason still finds out, and somebody who never
     * opens it is not being nagged about a thing the plugin renews for them anyway.
     */
    const library = useFeedChannels();
    const broken = library.channels.filter(
        channel => 'expired' === channel.tokenState || 'failing' === channel.tokenState
    ).length;

    return <div className='bsbSettings'>
        <nav className='bsbSettingsNav' aria-label={__('Settings sections', 'b-slider')}>
            {tabs.map(tab => <button
                key={tab.slug}
                type='button'
                className={`bsbSettingsTab ${tab.slug === active ? 'is-active' : ''}`}
                aria-current={tab.slug === active ? 'page' : undefined}
                onClick={() => setActive(tab.slug)}
            >
                {tab.label}
                {/* A connection nobody but the site's owner can mend. It rides on Sources, which is
                    where the mending is done. */}
                {'sources' === tab.slug && broken > 0 && <span
                    className='bsbTabCount'
                    title={sprintf(
                        /* translators: %d: how many accounts have stopped working */
                        _n('%d account needs reconnecting', '%d accounts need reconnecting', broken, 'b-slider'),
                        broken
                    )}
                >{broken}</span>}
            </button>)}
        </nav>

        <section className='bsbSettingsPanel'>
            <h2 className='bsbSettingsTitle'>{current.title}</h2>
            <Panel onGo={setActive} {...props} />
        </section>
    </div>;
};

export default Settings;

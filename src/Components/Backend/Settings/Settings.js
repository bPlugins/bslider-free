
import { useState } from '@wordpress/element';
import { InspectorControls } from '@wordpress/block-editor';
import { TabPanel } from "@wordpress/components";
import ProModal from './ProModal';
import General from './General/General';
import Style from './Style/Style';
import { AccordionGroup } from '../../Panel/AccordionPanel';
import { tabs } from '../../../utils/options';

const Settings = (props) => {
    const { attributes } = props;
    const isPremium = Boolean(bsbpipecheck ?? false);
    const { setAttributes, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, allCategories, multipleAttrChange, updateObject, queriedPosts, socialFeed, panelRequest } = props;

    const [proModalOpen, setProModalOpen] = useState(false);

    const premiumProps = { isPremium, setIsProModalOpen: setProModalOpen };
    // general props
    const generalProps = { attributes, setAttributes, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, updateObject, allCategories, multipleAttrChange, premiumProps, queriedPosts, socialFeed };
    // style props
    const styleProps = { attributes, setAttributes, setProModalOpen, updateObject, multipleAttrChange, premiumProps };

    const isFeedSource = attributes.sourceType === 'social';
    const hasAddress = !isFeedSource || !!(attributes.socialQuery?.channelId || attributes.socialQuery?.source || (attributes.socialQuery?.ytQueryType === 'search' && attributes.socialQuery?.ytSearchTerm) || '').trim();
    const activeTabs = hasAddress ? tabs : tabs.filter(t => t.name === 'General');

    return <> <InspectorControls style={{ marginBottom: "40px" }}>
        {/* Remounted when something asks for a panel by name — `TabPanel` takes only an initial tab,
            so a fresh mount is what moves it. The request carries a nonce, so asking twice works. */}
        <TabPanel
            key={panelRequest?.nonce || 'tabs'}
            initialTabName={panelRequest ? 'General' : undefined}
            className="bPlTabPanel bsb-tab-panel"
            activeClass="activeTab"
            tabs={activeTabs}
        >
            {/* One open panel per tab. Keyed on the tab so each starts fresh: the panels of the tab
                being left are unmounted, and the group would otherwise still be holding one of them. */}
            {(tab) => <AccordionGroup key={tab.name} open={panelRequest}>
                {'General' == tab.name && <>
                    <General {...generalProps} />
                </>}

                {'style' == tab.name && <>
                    <Style {...styleProps} />
                </>}
            </AccordionGroup>}
        </TabPanel>
    </InspectorControls>
        <ProModal setProModalOpen={setProModalOpen} proModalOpen={proModalOpen} />
    </>
}
export default Settings;
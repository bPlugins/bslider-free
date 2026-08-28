
import { InspectorControls } from '@wordpress/block-editor';
import { TabPanel } from "@wordpress/components";
import General from './General/General';
import Style from './Style/Style';
import { AccordionGroup } from '../../Panel/AccordionPanel';
import { tabs } from '../../../utils/options';


const Settings = (props) => {

    const { clientId, attributes, setAttributes, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, allCategories, multipleAttrChange, updateObject, queriedPosts } = props;

    // general props
    const generalProps = { clientId, attributes, setAttributes, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, updateObject, allCategories, multipleAttrChange, queriedPosts };
    // style props 
    const styleProps = { attributes, setAttributes, updateObject, multipleAttrChange };

    return <InspectorControls style={{ marginBottom: "40px" }}>
        <TabPanel className="bPlTabPanel bsb-tab-panel" activeClass="activeTab" tabs={tabs}>
            {/* One open panel per tab. Keyed on the tab so each starts fresh: the panels of the tab
                being left are unmounted, and the group would otherwise still be holding one of them. */}
            {(tab) => <AccordionGroup key={tab.name}>
                {'General' == tab.name && <General {...generalProps} />}

                {'style' == tab.name && <Style {...styleProps} />}
            </AccordionGroup>}
        </TabPanel>
    </InspectorControls>
}
export default Settings;
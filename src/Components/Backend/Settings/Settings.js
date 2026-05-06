
import { InspectorControls } from '@wordpress/block-editor';
import { TabPanel } from "@wordpress/components";
import General from './General/General';
import Style from './Style/Style';
import { tabs } from '../../../utils/options';


const Settings = (props) => {

    const { attributes, setAttributes, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, allCategories, multipleAttrChange, updateObject } = props;

    // general props 
    const generalProps = { attributes, setAttributes, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, updateObject, allCategories, multipleAttrChange };
    // style props 
    const styleProps = { attributes, setAttributes, updateObject, multipleAttrChange };

    return <InspectorControls style={{ marginBottom: "40px" }}>
        <TabPanel className="bPlTabPanel bsb-tab-panel" activeClass="activeTab" tabs={tabs}>
            {(tab) => <>
                {'General' == tab.name && <General {...generalProps} />}

                {'style' == tab.name && <Style {...styleProps} />}
            </>}
        </TabPanel>
    </InspectorControls>
}
export default Settings;
import DefaultStyle from './DefaultStyle';
import GridStyle from './GridStyle';
import ThumbnailsStyle from './ThumbnailsStyle';

const Style = ({ attributes, setAttributes, updateObject, multipleAttrChange }) => {
    const { layoutType } = attributes;

    const defaultStyleProps = { attributes, setAttributes, updateObject, multipleAttrChange };

    return <div className='bsbGeneralMainArea'>
        <DefaultStyle {...defaultStyleProps} />
        {layoutType === "grid" && <GridStyle {...defaultStyleProps} />}
        {layoutType === "thumbnails" && <ThumbnailsStyle {...defaultStyleProps} />}
    </div>
}
export default Style;
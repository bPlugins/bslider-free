import DefaultStyle from './DefaultStyle';
import GridStyle from './GridStyle';
import ThumbnailsStyle from './ThumbnailsStyle';
import BadgeStyle from './BadgeStyle';

const Style = ({ attributes, setAttributes, updateObject, multipleAttrChange }) => {
    const { layoutType } = attributes;

    const defaultStyleProps = { attributes, setAttributes, updateObject, multipleAttrChange };

    return <div className='bsbGeneralMainArea'>
        <DefaultStyle {...defaultStyleProps} />
        {layoutType === "grid" && <GridStyle {...defaultStyleProps} />}
        {layoutType === "thumbnails" && <ThumbnailsStyle {...defaultStyleProps} />}

        {/* Only once badges have been chosen under Post Badges — colours and type for a layer that is
            not being drawn are settings for nothing. */}
        {!!attributes?.postsQuery?.selectedBadges?.length && <BadgeStyle {...defaultStyleProps} />}
    </div>
}
export default Style;
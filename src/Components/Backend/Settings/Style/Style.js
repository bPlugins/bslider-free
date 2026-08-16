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

        {/* Once there is something on the overlay to style — a badge chosen under Post Badges, or an
            ACF field picked under ACF Integration. Colours and type for a layer that is not being
            drawn are settings for nothing, but either of the two draws it. */}
        {(!!attributes?.postsQuery?.selectedBadges?.length
            || !!attributes?.postsQuery?.selectedAcfFields?.length) && <BadgeStyle {...defaultStyleProps} />}
    </div>
}
export default Style;
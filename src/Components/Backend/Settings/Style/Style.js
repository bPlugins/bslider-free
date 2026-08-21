import DefaultStyle from './DefaultStyle';
import GridStyle from './GridStyle';
import ThumbnailsStyle from './ThumbnailsStyle';
import ListStyle from './ListStyle';
import BadgeStyle from './BadgeStyle';
import ProfileHeaderStyle from './ProfileHeaderStyle';
import FeedPresets from '../General/FeedPresets';

const Style = ({ attributes, setAttributes, updateObject, multipleAttrChange, premiumProps }) => {
    const { layoutType, sourceType, socialQuery, thumbnails } = attributes;

    const defaultStyleProps = { attributes, setAttributes, updateObject, multipleAttrChange, premiumProps };

    return <div className='bsbGeneralMainArea'>
        {sourceType === 'social' && <FeedPresets attributes={attributes} setAttributes={setAttributes} premiumProps={premiumProps} />}
        <DefaultStyle {...defaultStyleProps} />
        {((layoutType === "grid") || (layoutType === "thumbnails" && thumbnails?.mode === "grid")) && <GridStyle {...defaultStyleProps} {...premiumProps} />}
        {layoutType === "thumbnails" && thumbnails?.mode !== "grid" && <ThumbnailsStyle {...defaultStyleProps} {...premiumProps} />}

        {/* Same condition as the General panel it belongs with. */}
        {'list' === layoutType && 'social' === sourceType && 'youtube' === socialQuery?.feedType && (
            <ListStyle {...defaultStyleProps} />
        )}

        {/* Once there is something on the overlay to style — a badge chosen under Social Badges or
            Post Badges, or an ACF field picked under ACF Integration. Colours and type for a layer
            that is not being drawn are settings for nothing, but any of the three draws it, and it
            is the same panel and the same look whichever did. */}
        {!!(attributes?.socialQuery?.selectedBadges?.length
            || attributes?.postsQuery?.selectedBadges?.length
            || attributes?.postsQuery?.selectedAcfFields?.length) && (
            <BadgeStyle {...defaultStyleProps} />
        )}

        {/* Only when there is a header to dress. It is switched on in General → Profile Header, and
            offering its colours to a slider that shows no header is offering settings for nothing. */}
        {'social' === sourceType && (!!socialQuery?.showHeader || !!socialQuery?.showFollowButton) && <ProfileHeaderStyle {...defaultStyleProps} />}
    </div>
}
export default Style;
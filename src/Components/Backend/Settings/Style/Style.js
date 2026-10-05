import { __ } from '@wordpress/i18n';
import DefaultStyle from './DefaultStyle';
import GridStyle from './GridStyle';
import ThumbnailsStyle from './ThumbnailsStyle';
import BadgeStyle from './BadgeStyle';
import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import { TUTORIAL_VIDEOS } from '../../../../utils/videos';

const Style = ({ attributes, setAttributes, updateObject, multipleAttrChange }) => {
    const { layoutType, sourceType } = attributes;

    const defaultStyleProps = { attributes, setAttributes, updateObject, multipleAttrChange };

    return <div className='bsbGeneralMainArea'>
        {/* First, where Pro has the real panel; not for `blocks`, styled by child blocks. */}
        {'blocks' !== sourceType && <ProPanel title={__('Style with AI', 'b-slider')} proTitle={__('Style with AI', 'b-slider')} features={PRO_FEATURES.styleWithAi} demoUrl={TUTORIAL_VIDEOS.styleWithAi} />}
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
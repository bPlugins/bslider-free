import { __ } from '@wordpress/i18n';
import { produce } from 'immer';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { ColorControl, ColorsControl, Typography } from '../../../../../../bpl-tools/Components';
import { isProActive, adminUrl } from '../../../../utils/functions';
import PremiumPanel from '../../../../../../bpl-tools/ProControls/PremiumPanel';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';

/**
 * How the profile header above a feed looks.
 *
 * Its own panel rather than three more fields in the Title and Description ones: the header is not
 * a slide, and its name and bio are set once for the whole slider while a slide's are drawn per
 * item. Sharing the controls would mean a change meant for the captions silently redressing the
 * header too.
 *
 * The name's colour defaults to empty on purpose — with nothing set it inherits the page, which is
 * right far more often than any colour this could pick. The bio and the button carry real defaults
 * because they are the two that need to stand apart from the text around them.
 */
const ProfileHeaderStyle = ({ attributes, setAttributes, premiumProps }) => {
    const { socialQuery = {}, headerNameTypo, headerNameColor, headerBioTypo, headerBioColor, headerFollowersTypo, headerFollowersColor, headerBtnTypo, headerBtnColors } = attributes;
    const { showHeader = false, showFollowButton = false } = socialQuery;

    const isPro = premiumProps?.isPremium ?? isProActive();

    return <>
        {showHeader && (
            <PanelBody className='bPlPanelBody' title={__('Profile Header', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
                <Typography
                    className='mt20 mb10'
                    label={__('Name Typography:', 'b-slider')}
                    value={headerNameTypo}
                    onChange={val => setAttributes({ headerNameTypo: val })}
                    defaults={{ fontSize: 16 }}
                    produce={produce}
                />

                <ColorControl
                    className='mb20'
                    label={__('Name Color', 'b-slider')}
                    value={headerNameColor}
                    onChange={val => setAttributes({ headerNameColor: val })}
                />

                <Typography
                    className='mt20 mb10'
                    label={__('Bio Typography:', 'b-slider')}
                    value={headerBioTypo}
                    onChange={val => setAttributes({ headerBioTypo: val })}
                    defaults={{ fontSize: 13 }}
                    produce={produce}
                />

                <ColorControl
                    className='mb20'
                    label={__('Bio Color', 'b-slider')}
                    value={headerBioColor}
                    defaultColor='#666666'
                    onChange={val => setAttributes({ headerBioColor: val })}
                />

                {/* The line of counts under the name — "199K Subscribers · 1.1K Videos · 4.6M Views". Named
                    for the whole line rather than for followers alone, which is what it used to hold and
                    what the label still said after the other two numbers were added. */}
                <Typography
                    className='mt20 mb10'
                    label={__('Stats Typography:', 'b-slider')}
                    value={headerFollowersTypo}
                    onChange={val => setAttributes({ headerFollowersTypo: val })}
                    defaults={{ fontSize: 13 }}
                    produce={produce}
                />

                <ColorControl
                    className='mb20'
                    label={__('Stats Color', 'b-slider')}
                    value={headerFollowersColor}
                    defaultColor='#666666'
                    onChange={val => setAttributes({ headerFollowersColor: val })}
                />
            </PanelBody>
        )}

        {(showHeader || showFollowButton) && (
            <PanelBody className='bPlPanelBody' title={__('Follow Button', 'b-slider')} initialOpen={false} {...(!isPro ? { badge: <PremiumBadge /> } : { badge: __('New', 'b-slider') })}>
                {isPro ? (
                    <>
                        <Typography
                            className='mt20 mb10'
                            label={__('Typography:', 'b-slider')}
                            value={headerBtnTypo}
                            onChange={val => setAttributes({ headerBtnTypo: val })}
                            defaults={{ fontSize: 13 }}
                            produce={produce}
                        />

                        <ColorsControl
                            className='mb20'
                            label={__('Colors', 'b-slider')}
                            value={headerBtnColors}
                            onChange={val => setAttributes({ headerBtnColors: val })}
                            defaults={{ color: '#ffffff', bg: '#0095f6' }}
                        />
                    </>
                ) : (
                    <PremiumPanel
                        title={__('Follow Button Style', 'b-slider')}
                        description={__('Customize the follow button alignment, typography, and colors to match your brand.', 'b-slider')}
                        pricingUrl={adminUrl()}
                        buttonLabel={__('Get Pro', 'b-slider')}
                    />
                )}
            </PanelBody>
        )}
    </>;
};

export default ProfileHeaderStyle;

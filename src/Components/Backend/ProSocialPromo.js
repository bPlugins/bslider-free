import { __ } from '@wordpress/i18n';
import { adminUrl, isProActive } from '../../utils/functions';
import { crown, lock, youtubeIcon, instagramIcon, rssIcon, syncIcon } from '../../utils/icons';

const ProSocialPromo = ({ variant = 'full' }) => {
    if (isProActive()) {
        return null;
    }

    const upgradeBtn = (
        <a className="bsb_pro_promo_btn" href={adminUrl()} target="_blank" rel="noreferrer">
            {crown(14, 14)}
            <span>{__('Unlock with Pro', 'b-slider')}</span>
        </a>
    );

    if ('compact' === variant) {
        return (
            <div className="bsb_pro_promo is_compact">
                <div className="bsb_pro_promo_icon">{lock(16, 16)}</div>

                <div className="bsb_pro_promo_body">
                    <p className="bsb_pro_promo_text">
                        {__('Social & external feeds are Pro only.', 'b-slider')}
                    </p>
                </div>

                {upgradeBtn}
            </div>
        );
    }

    return (
        <div className="bsb_pro_promo">
            <div className="bsb_pro_promo_icon">{lock(20, 20)}</div>

            <div className="bsb_pro_promo_body">
                <span className="bsb_pro_promo_badge">{__('Pro Feature', 'b-slider')}</span>

                <h4 className="bsb_pro_promo_title">{__('Display social & external feeds', 'b-slider')}</h4>

                <p className="bsb_pro_promo_text">
                    {__('Upgrade to Pro to fetch, cache and display slides straight from YouTube, Instagram, RSS, or custom JSON feeds, auto-synced on your schedule.', 'b-slider')}
                </p>

                <ul className="bsb_pro_promo_perks is-social-perks">
                    <li>{youtubeIcon(14, 14)} <span>{__('YouTube Feeds', 'b-slider')}</span></li>
                    <li>{instagramIcon(14, 14)} <span>{__('Instagram Feeds', 'b-slider')}</span></li>
                    <li>{rssIcon(14, 14)} <span>{__('RSS & JSON Feeds', 'b-slider')}</span></li>
                    <li>{syncIcon(14, 14)} <span>{__('Auto-sync Feeds', 'b-slider')}</span></li>
                </ul>
            </div>

            {upgradeBtn}
        </div>
    );
};

export default ProSocialPromo;

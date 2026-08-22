import { __ } from '@wordpress/i18n';
import { adminUrl, isProActive } from '../../utils/functions';
import { crown, lock } from '../../utils/icons';

const ProListLayoutPromo = ({ variant = 'full' }) => {
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
            <div className="bsb_pro_promo is_compact" style={{ marginTop: '8px' }}>
                <div className="bsb_pro_promo_icon">{lock(16, 16)}</div>

                <div className="bsb_pro_promo_body">
                    <p className="bsb_pro_promo_text">
                        {__('List Layout (YouTube only) & premium presets are Pro only.', 'b-slider')}
                    </p>
                </div>

                {upgradeBtn}
            </div>
        );
    }

    return (
        <div className="bsb_pro_promo" style={{ marginTop: '30px' }}>
            <div className="bsb_pro_promo_icon">{lock(20, 20)}</div>
            <div className="bsb_pro_promo_body">
                <span className="bsb_pro_promo_badge">{__('Pro Feature', 'b-slider')}</span>
                <h4 className="bsb_pro_promo_title">{__('Slide YouTube feeds with List Layout', 'b-slider')}</h4>
                <p className="bsb_pro_promo_text">
                    {__('Upgrade to Pro to unlock the List Layout for YouTube feeds (active video player above, playlist below) and premium pre-designed style presets.', 'b-slider')}
                </p>
            </div>
            {upgradeBtn}
        </div>
    );
};

export default ProListLayoutPromo;

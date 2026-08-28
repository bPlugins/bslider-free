import { __ } from '@wordpress/i18n';
import { adminUrl, isProActive } from '../../utils/functions';
import { crown, lock } from '../../utils/icons';

/**
 * What the layout tiles cannot say for themselves.
 *
 * Two different sentences, because the layout being held back is not the same one in both places.
 * For a YouTube feed it is List; for a `blocks` slider it is Carousel. Neither tile is drawn on a
 * free licence — a tile that cannot be chosen is a dead control — so this notice is the only
 * thing that tells a free user the layout exists at all.
 */
const ProListLayoutPromo = ({ variant = 'full', sourceType }) => {
    if (isProActive()) {
        return null;
    }

    const isBlocks = 'blocks' === sourceType;

    const compactText = isBlocks
        ? __('Carousel Layout is in Pro — show several slides side by side.', 'b-slider')
        : __('List Layout (YouTube only) & premium presets are Pro only.', 'b-slider');

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
                    <p className="bsb_pro_promo_text">{compactText}</p>
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
                <h4 className="bsb_pro_promo_title">{isBlocks
                    ? __('Carousel Layout', 'b-slider')
                    : __('Slide YouTube feeds with List Layout', 'b-slider')}</h4>
                <p className="bsb_pro_promo_text">{isBlocks
                    ? __('Show two or three slides side by side instead of one at a time.', 'b-slider')
                    : __('Upgrade to Pro to unlock the List Layout for YouTube feeds (active video player above, playlist below) and premium pre-designed style presets.', 'b-slider')}</p>
            </div>
            {upgradeBtn}
        </div>
    );
};

export default ProListLayoutPromo;

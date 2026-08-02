import { __, sprintf, _n } from '@wordpress/i18n';
import { adminUrl, isProActive } from '../../utils/functions';
import { crown, lock } from '../../utils/icons';

/**
 * The upsell that stands in for the custom post types a free licence cannot query.
 *
 * Rendered wherever a post type is picked — the source wizard and the Source & Layout panel —
 * so the reason a card or a dropdown row is greyed out is always right next to it.
 *
 * It shows on every free site, not only the ones that already have a custom post type: a site
 * with none yet is exactly the site that has not been told what Pro would give it. When there
 * are locked types the copy names them, otherwise it makes the same pitch in general terms.
 * A Pro licence is the only thing that takes it away.
 *
 * `variant='compact'` is the sidebar form: same message, one line, no feature list.
 */

/** "Portfolio, Testimonial and 2 more" — names the user recognises, not a count on its own. */
const namesOf = (lockedTypes) => {
    const names = lockedTypes.map(pt => pt.label).filter(Boolean);

    if (names.length <= 2) {
        return names.join(__(' and ', 'slider'));
    }

    return sprintf(
        /* translators: 1: two post type names, 2: how many further post types are locked */
        __('%1$s, and %2$d more', 'slider'),
        names.slice(0, 2).join(', '),
        names.length - 2
    );
};

const ProPostTypesPromo = ({ lockedTypes = [], variant = 'full' }) => {
    if (isProActive()) {
        return null;
    }

    const count = lockedTypes.length;

    /* A site with no custom post type yet still gets the pitch, just without names to drop. */
    const hasLocked = count > 0;

    const upgradeBtn = (
        <a className="bsb_pro_promo_btn" href={adminUrl()} target="_blank" rel="noreferrer">
            {crown(14, 14)}
            <span>{__('Unlock with Pro', 'slider')}</span>
        </a>
    );

    if ('compact' === variant) {
        return (
            <div className="bsb_pro_promo is_compact">
                <div className="bsb_pro_promo_icon">{lock(16, 16)}</div>

                <div className="bsb_pro_promo_body">
                    <p className="bsb_pro_promo_text">
                        {hasLocked
                            ? sprintf(
                                /* translators: %d: how many custom post types are Pro only */
                                _n('%d custom post type is Pro only.', '%d custom post types are Pro only.', count, 'slider'),
                                count
                            )
                            : __('Custom post types are Pro only.', 'slider')}
                    </p>
                </div>

                {upgradeBtn}
            </div>
        );
    }

    /* Editor variant — lives inside the block content area, below the posts preview. */
    if ('editor' === variant) {
        return (
            <div className="bsb_pro_promo is_editor">
                <div className="bsb_pro_promo_editor_glow" />

                <div className="bsb_pro_promo_editor_inner">
                    <div className="bsb_pro_promo_editor_left">
                        <div className="bsb_pro_promo_editor_icon_ring">
                            {lock(22, 22)}
                        </div>

                        <div className="bsb_pro_promo_editor_copy">
                            <span className="bsb_pro_promo_badge">{__('Pro Feature', 'slider')}</span>

                            <h4 className="bsb_pro_promo_title">
                                {hasLocked
                                    ? sprintf(
                                        /* translators: %d: number of locked custom post types */
                                        _n(
                                            '%d Custom Post Type Available in Pro',
                                            '%d Custom Post Types Available in Pro',
                                            count,
                                            'slider'
                                        ),
                                        count
                                    )
                                    : __('Custom Post Types Available in Pro', 'slider')}
                            </h4>

                            <p className="bsb_pro_promo_text">
                                {hasLocked
                                    ? sprintf(
                                        /* translators: %s: names of the locked post types */
                                        __('Unlock %s and every custom post type you create — with advanced filtering, ACF field support, and more.', 'slider'),
                                        namesOf(lockedTypes)
                                    )
                                    : __('Unlock every custom post type you create — with advanced filtering, ACF field support, and more.', 'slider')}
                            </p>

                            <ul className="bsb_pro_promo_perks">
                                <li>{__('All custom post types', 'slider')}</li>
                                <li>{__('ACF field mapping', 'slider')}</li>
                                <li>{__('Advanced query filters', 'slider')}</li>
                            </ul>
                        </div>
                    </div>

                    <a className="bsb_pro_promo_btn bsb_pro_promo_editor_btn" href={adminUrl()} target="_blank" rel="noreferrer">
                        {crown(16, 16)}
                        <span>{__('Upgrade to Pro', 'slider')}</span>
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bsb_pro_promo">
            <div className="bsb_pro_promo_icon">{lock(20, 20)}</div>

            <div className="bsb_pro_promo_body">
                <span className="bsb_pro_promo_badge">{__('Pro Feature', 'slider')}</span>

                <h4 className="bsb_pro_promo_title">{__('Slide your custom post types', 'slider')}</h4>

                <p className="bsb_pro_promo_text">
                    {hasLocked
                        ? sprintf(
                            /* translators: %s: names of the locked post types, e.g. "Portfolio, Testimonial, and 2 more" */
                            __('Standard post types (Posts, Pages, Products) are free. Pro unlocks custom post types like %s.', 'slider'),
                            namesOf(lockedTypes)
                        )
                        : __('Standard post types (Posts, Pages, Products) are free. Pro unlocks every custom post type you register.', 'slider')}
                </p>

                <ul className="bsb_pro_promo_perks">
                    <li>{__('All custom post types', 'slider')}</li>
                    <li>{__('ACF field mapping', 'slider')}</li>
                    <li>{__('Include & exclude posts', 'slider')}</li>
                </ul>
            </div>

            {upgradeBtn}
        </div>
    );
};

export default ProPostTypesPromo;

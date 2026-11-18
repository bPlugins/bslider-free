import { useState, useEffect } from 'react';
import iconSvg from './icon.svg';
import './BFCMBanner.scss';

/**
 * BFCM 2026 Banner Component for bSlider
 * Follows Design #5: Dual-Tone Asymmetric Ribbon with Feature Badges.
 * Expires after December 5, 2026.
 */
const BFCMBanner = ({ bfcm, isPremium }) => {
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('bsb_bfcm_2026_dismissed')) {
            setIsDismissed(true);
        }
    }, []);

    // Expire after 5th December 2026
    const isExpired = new Date() > new Date('2026-12-05T23:59:59');

    // Do not show if expired, dismissed, or already premium
    if (isExpired || isDismissed || isPremium || (bfcm && bfcm.show === false)) {
        return null;
    }

    const pricingUrl = bfcm?.pricingUrl || 'https://bplugins.com/products/b-slider/pricing/?utm_source=plugin_dashboard&utm_medium=bfcm_banner&utm_campaign=bfcm2026';

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('bsb_bfcm_2026_dismissed', '1');

        if (bfcm?.ajaxUrl && bfcm?.nonce && window.jQuery) {
            window.jQuery.post(bfcm.ajaxUrl, {
                action: 'bsb_dismiss_bfcm_notice',
                nonce: bfcm.nonce
            });
        }
    };

    return (
        <div className='bsbBfcmBanner'>
            {/* Left Dual-Tone Ribbon */}
            <div className='bsbBfcmRibbon'>
                <div className='bsbBfcmRibbonIconWrap'>
                    <img src={iconSvg} alt='bSlider' className='bsbBfcmRibbonIcon' />
                </div>
                <span className='bsbBfcmRibbonTitle'>B SLIDER</span>
            </div>

            {/* Main Content Area */}
            <div className='bsbBfcmContent'>
                <div className='bsbBfcmHeaderRow'>
                    <h3 className='bsbBfcmTitle'>{"bSlider's Biggest Black Friday Sale is Live – Up to 45% OFF!"}</h3>
                </div>

                <p className='bsbBfcmDesc'>
                    The biggest deal of the year just arrived early! This is your once-a-year opportunity to upgrade to bSlider Pro at an exclusive price. Unlock 100+ templates, AI-powered slider builder, layer animations, and everything you need to take your sliders to the next level!
                </p>

                <div className='bsbBfcmFeaturesRow'>
                    <span className='bsbBfcmFeatureItem'>
                        <span className='bsbBfcmCheckmark'>✓</span> 100+ Ready-Made Templates
                    </span>
                    <span className='bsbBfcmFeatureItem'>
                        <span className='bsbBfcmCheckmark'>✓</span> AI-Powered Slider Builder
                    </span>
                    <span className='bsbBfcmFeatureItem'>
                        <span className='bsbBfcmCheckmark'>✓</span> Lottie & Layer Animations
                    </span>
                    <span className='bsbBfcmFeatureItem'>
                        <span className='bsbBfcmCheckmark'>✓</span> WooCommerce & ACF Sliders
                    </span>
                </div>
            </div>

            {/* Right Action CTA */}
            <div className='bsbBfcmAction'>
                <button
                    type='button'
                    className='bsbBfcmCloseBtn'
                    onClick={handleDismiss}
                    aria-label='Dismiss banner'
                    title='Dismiss'
                >
                    &times;
                </button>
                <a
                    href={pricingUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='bsbBfcmCtaBtn'
                >
                    Unlock PRO Features &rarr;
                </a>
            </div>
        </div>
    );
};

export default BFCMBanner;


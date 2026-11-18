<?php
/**
 * BFCM 2026 Banner & Admin Notice for bSlider
 *
 * Handles the Black Friday / Cyber Monday 2026 promotion banner and notice.
 * Expiry: December 5, 2026.
 *
 * @package B_Slider
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'BSB_BFCM_Notice' ) ) {
    class BSB_BFCM_Notice {

        private static $instance = null;

        /**
         * End date for BFCM 2026 promotion (December 5, 2026 23:59:59 UTC).
         */
        const EXPIRY_TIMESTAMP = 1796515199;

        public static function get_instance() {
            if ( null === self::$instance ) {
                self::$instance = new self();
            }
            return self::$instance;
        }

        public function __construct() {
            add_action( 'all_admin_notices', [ $this, 'render_all_sliders_banner' ] );
            add_action( 'wp_ajax_bsb_dismiss_bfcm_notice', [ $this, 'ajax_dismiss' ] );
        }

        /**
         * Check if promotion is currently active and not dismissed.
         */
        public function is_active() {
            if ( time() > self::EXPIRY_TIMESTAMP ) {
                return false;
            }

            if ( get_user_meta( get_current_user_id(), 'bsb_bfcm_2026_dismissed', true ) ) {
                return false;
            }

            if ( function_exists( 'b_slider_fs' ) && b_slider_fs() && b_slider_fs()->can_use_premium_code() ) {
                return false;
            }

            return true;
        }

        /**
         * AJAX handler to persist dismissal for the user.
         */
        public function ajax_dismiss() {
            check_ajax_referer( 'bsb_bfcm_dismiss_nonce', 'nonce' );

            if ( ! current_user_can( 'read' ) ) {
                wp_send_json_error( [ 'message' => 'Unauthorized' ] );
            }

            update_user_meta( get_current_user_id(), 'bsb_bfcm_2026_dismissed', 1 );
            wp_send_json_success();
        }

        /**
         * Render the BFCM banner on the All Sliders list page (edit.php?post_type=bsb).
         */
        public function render_all_sliders_banner() {
            global $pagenow;

            if ( 'edit.php' !== $pagenow || ! isset( $_GET['post_type'] ) || 'bsb' !== $_GET['post_type'] || isset( $_GET['page'] ) ) {
                return;
            }

            $screen = get_current_screen();
            if ( $screen && 'edit-bsb' !== $screen->id ) {
                return;
            }

            if ( ! $this->is_active() ) {
                return;
            }

            $nonce       = wp_create_nonce( 'bsb_bfcm_dismiss_nonce' );
            $pricing_url = 'https://bplugins.com/products/b-slider/pricing/?utm_source=all_sliders&utm_medium=bfcm_banner&utm_campaign=bfcm2026';
            ?>
            <div id="bsbBfcmBannerWrap" style="display:none;">
                <style>
                    /* ===== BFCM Banner: Full-width with 20px right gap ===== */
                    #bsbBfcmBannerWrap {
                        display: none;
                        width: 100%;
                        box-sizing: border-box;
                        padding-right: 20px;
                        margin: 0;
                        clear: both;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmBanner {
                        display: flex;
                        align-items: stretch;
                        background: #ffffff;
                        border: 1px solid #d1e1fb;
                        border-left: none;
                        border-radius: 0;
                        box-shadow: 0 2px 12px rgba(20, 110, 245, 0.08);
                        margin: 0;
                        width: 100%;
                        overflow: hidden;
                        position: relative;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                        box-sizing: border-box;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmBanner * {
                        box-sizing: border-box;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmRibbon {
                        background: linear-gradient(135deg, #EEF4FF 0%, #E3EDFE 50%, #D8E6FD 100%);
                        border-right: 1px solid #d1e1fb;
                        padding: 12px 18px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-width: 140px;
                        flex-shrink: 0;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmRibbonIconWrap {
                        width: 44px;
                        height: 44px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmRibbonIcon,
                    #bsbBfcmBannerWrap .bsbBfcmRibbonIconWrap svg {
                        width: 100%;
                        height: 100%;
                        display: block;
                        object-fit: contain;
                        filter: drop-shadow(0 4px 10px rgba(20, 110, 245, 0.25));
                    }
                    #bsbBfcmBannerWrap .bsbBfcmRibbonTitle {
                        color: #001737;
                        font-size: 10px;
                        font-weight: 800;
                        letter-spacing: 0.8px;
                        margin-top: 6px;
                        text-transform: uppercase;
                        text-align: center;
                        line-height: 1.2;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmContent {
                        flex: 1;
                        padding: 12px 20px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        gap: 6px;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmHeaderRow {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        flex-wrap: wrap;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmTitle {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 700;
                        color: #070127;
                        line-height: 1.3;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmDesc {
                        margin: 3px 0 8px 0;
                        font-size: 12px;
                        line-height: 1.5;
                        color: #4b5563;
                        max-width: 950px;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmFeaturesRow {
                        display: flex;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 16px;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmFeatureItem {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        font-size: 12px;
                        color: #4b5563;
                        font-weight: 500;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmCheckmark {
                        color: #070127;
                        font-weight: 700;
                        font-size: 12px;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmAction {
                        display: flex;
                        align-items: center;
                        padding-right: 22px;
                        padding-left: 10px;
                        position: relative;
                        flex-shrink: 0;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmCloseBtn {
                        position: absolute;
                        top: 8px;
                        right: 10px;
                        background: transparent;
                        border: none;
                        cursor: pointer;
                        color: #0b81ee;
                        font-size: 18px;
                        line-height: 1;
                        padding: 2px 6px;
                        border-radius: 4px;
                        transition: color 0.15s ease, background 0.15s ease;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmCloseBtn:hover {
                        color: #0860b3;
                        background: rgba(11, 129, 238, 0.1);
                    }
                    #bsbBfcmBannerWrap .bsbBfcmCtaBtn {
                        margin-right: 20px;
                        background: #e3edfe;
                        color: #0b81ee !important;
                        text-decoration: none !important;
                        font-size: 13px;
                        font-weight: 600;
                        padding: 9px 18px;
                        border-radius: 0;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s ease;
                        box-shadow: none !important;
                        border: 1px solid rgba(11, 129, 238, 0.25);
                        white-space: nowrap;
                    }
                    #bsbBfcmBannerWrap .bsbBfcmCtaBtn:hover {
                        background: #d2e3fc;
                        color: #0860b3 !important;
                        box-shadow: none !important;
                        transform: translateY(-1px);
                    }
                    @media (max-width: 900px) {
                        #bsbBfcmBannerWrap .bsbBfcmBanner { flex-direction: column; }
                        #bsbBfcmBannerWrap .bsbBfcmRibbon { width: 100%; flex-direction: row; gap: 12px; padding: 8px 16px; border-right: none; border-bottom: 1px solid #d1e1fb; }
                        #bsbBfcmBannerWrap .bsbBfcmContent { padding: 12px 16px; }
                        #bsbBfcmBannerWrap .bsbBfcmAction { padding: 0 16px 12px; justify-content: flex-start; }
                        #bsbBfcmBannerWrap .bsbBfcmCloseBtn { top: 8px; right: 8px; }
                    }
                </style>
                <div class="bsbBfcmBanner">
                    <div class="bsbBfcmRibbon">
                        <div class="bsbBfcmRibbonIconWrap">
                            <?php echo $this->get_logo_svg(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                        </div>
                        <span class="bsbBfcmRibbonTitle">B SLIDER</span>
                    </div>

                    <div class="bsbBfcmContent">
                        <div class="bsbBfcmHeaderRow">
                            <h3 class="bsbBfcmTitle"><?php esc_html_e( "bSlider's Biggest Black Friday Sale is Live – Up to 45% OFF!", 'b-slider' ); ?></h3>
                        </div>

                        <p class="bsbBfcmDesc"><?php esc_html_e( 'The biggest deal of the year just arrived early! This is your once-a-year opportunity to upgrade to bSlider Pro at an exclusive price. Unlock 100+ templates, AI-powered slider builder, layer animations, and everything you need to take your sliders to the next level!', 'b-slider' ); ?></p>

                        <div class="bsbBfcmFeaturesRow">
                            <span class="bsbBfcmFeatureItem"><span class="bsbBfcmCheckmark">✓</span> <?php esc_html_e( '100+ Ready-Made Templates', 'b-slider' ); ?></span>
                            <span class="bsbBfcmFeatureItem"><span class="bsbBfcmCheckmark">✓</span> <?php esc_html_e( 'AI-Powered Slider Builder', 'b-slider' ); ?></span>
                            <span class="bsbBfcmFeatureItem"><span class="bsbBfcmCheckmark">✓</span> <?php esc_html_e( 'Lottie & Layer Animations', 'b-slider' ); ?></span>
                            <span class="bsbBfcmFeatureItem"><span class="bsbBfcmCheckmark">✓</span> <?php esc_html_e( 'WooCommerce & ACF Sliders', 'b-slider' ); ?></span>
                        </div>
                    </div>

                    <div class="bsbBfcmAction">
                        <button type="button" class="bsbBfcmCloseBtn" id="bsbBfcmCloseBtn" aria-label="Dismiss banner" title="Dismiss">&times;</button>
                        <a href="<?php echo esc_url( $pricing_url ); ?>" target="_blank" rel="noopener noreferrer" class="bsbBfcmCtaBtn">
                            <?php esc_html_e( 'Unlock PRO Features →', 'b-slider' ); ?>
                        </a>
                    </div>
                </div>
            </div>
            <script>
            (function($) {
                $(document).ready(function() {
                    if (localStorage.getItem('bsb_bfcm_2026_dismissed')) {
                        return;
                    }

                    $('#bsbBfcmBannerWrap').show();

                    $('#bsbBfcmCloseBtn').on('click', function(e) {
                        e.preventDefault();
                        $('#bsbBfcmBannerWrap').slideUp(200, function() {
                            $(this).remove();
                        });

                        localStorage.setItem('bsb_bfcm_2026_dismissed', '1');

                        $.post('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>', {
                            action: 'bsb_dismiss_bfcm_notice',
                            nonce: '<?php echo esc_js( $nonce ); ?>'
                        });
                    });
                });
            })(jQuery);
            </script>
            <?php
        }

        /**
         * Return inlined official SVG logo of bSlider.
         */
        private function get_logo_svg() {
            return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="44" height="44" role="img" aria-label="bSlider">
  <defs>
    <linearGradient id="bslbTileN" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#146ef5"/>
      <stop offset="1" stop-color="#6155f5"/>
    </linearGradient>
    <linearGradient id="bslbSunN" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff9dc7"/>
      <stop offset="1" stop-color="#ff4d9d"/>
    </linearGradient>
    <linearGradient id="bslbGlassN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.5"/>
    </linearGradient>
    <radialGradient id="bslbGlowN" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0" stop-color="#ff4d9d" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#ff4d9d" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="bslbClipN"><rect x="0" y="0" width="256" height="256" rx="56"/></clipPath>
    <clipPath id="bslbWinN"><rect x="53" y="52" width="150" height="108" rx="16"/></clipPath>
  </defs>

  <rect x="0" y="0" width="256" height="256" rx="56" fill="url(#bslbTileN)"/>
  <g clip-path="url(#bslbClipN)">
    <circle cx="42" cy="38" r="78" fill="#ffffff" opacity="0.08"/>
    <circle cx="128" cy="104" r="130" fill="url(#bslbGlowN)"/>

    <g>
      <rect x="47" y="46" width="162" height="120" rx="22" fill="#0a2f7a" opacity="0.30"/>
      <rect x="53" y="52" width="150" height="108" rx="16" fill="url(#bslbGlassN)"/>
      <g clip-path="url(#bslbWinN)">
        <g>
          <rect x="53" y="52" width="150" height="108" fill="#e6eefc"/>
          <circle cx="92" cy="86" r="16" fill="url(#bslbSunN)"/>
          <path d="M53 160 L92 96 L120 128 L146 98 L182 148 L203 128 L203 160 Z" fill="#146ef5"/>
          <path d="M146 98 L182 148 L146 160 L110 160 Z" fill="#3a2fbf" opacity="0.5"/>
        </g>
      </g>
      <rect x="53" y="52" width="150" height="108" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="2"/>
    </g>

    <rect x="66" y="180" width="124" height="7" rx="3.5" fill="#ffffff" opacity="0.22"/>
    <rect x="66" y="180" width="80" height="7" rx="3.5" fill="#ff4d9d"/>

    <circle cx="108" cy="210" r="7.5" fill="#ff4d9d"/>
    <circle cx="128" cy="210" r="7.5" fill="rgba(255,255,255,.42)"/>
    <circle cx="148" cy="210" r="7.5" fill="rgba(255,255,255,.42)"/>
  </g>
</svg>';
        }
    }

    BSB_BFCM_Notice::get_instance();
}


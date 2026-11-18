<?php
namespace B_SLIDER;

if (!defined('ABSPATH')) {exit;}
if(!class_exists(__NAMESPACE__ . '\AdminMenu')) {

    class AdminMenu {

        public function __construct() {
            add_action( 'admin_enqueue_scripts', [$this, 'adminEnqueueScripts'] );
            add_action( 'admin_menu', [$this, 'adminMenu'] );
        }

        public function adminEnqueueScripts($hook) {
            if( strpos( $hook, 'b-slider' ) ){
                wp_enqueue_style( 'bsb-admin-dashboard', B_SLIDER_DIR . 'build/admin-dashboard.css', [], B_SLIDER_PLUGIN_VERSION );
                wp_enqueue_script( 'bsb-admin-dashboard', B_SLIDER_DIR . 'build/admin-dashboard.js', [ 'react', 'react-dom', 'wp-data', "wp-api", "wp-util", "wp-i18n" ], B_SLIDER_PLUGIN_VERSION, true );
                wp_set_script_translations( 'bsb-admin-dashboard', 'b-slider', B_SLIDER_DIR_PATH . 'languages' ); 
            }
        }

        public function adminMenu(){
             
            add_submenu_page(
                'edit.php?post_type=bsb',
                __('Help & Demos', 'b-slider'),
                '<span style="color:#f18500;font-weight:bold;">' . __('Help & Demos', 'b-slider') . '</span>',
                'manage_options',
                'b-slider',
                [$this, 'bsbHelpPage']
            );
        }

        public function bsbHelpPage()
        {?>
            <div
                id='bsbDashboard'
                data-info='<?php echo esc_attr( wp_json_encode( [
                    'version'   => B_SLIDER_PLUGIN_VERSION,
                    'adminUrl'  => admin_url(),
                    'isPremium' => function_exists( 'b_slider_fs' ) && b_slider_fs() && b_slider_fs()->can_use_premium_code(),
                    'bfcm'      => [
                        'show'       => class_exists( 'BSB_BFCM_Notice' ) ? \BSB_BFCM_Notice::get_instance()->is_active() : false,
                        'nonce'      => wp_create_nonce( 'bsb_bfcm_dismiss_nonce' ),
                        'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
                        'pricingUrl' => 'https://bplugins.com/products/b-slider/pricing/?utm_source=plugin_dashboard&utm_medium=bfcm_banner&utm_campaign=bfcm2026',
                    ],
                ] ) ); ?>'
            >
            </div>
        <?php }
    }
    new AdminMenu();
}
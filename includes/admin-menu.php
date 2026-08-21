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

                // Read from the file the build writes rather than a list kept by hand. The hand-kept
                // one had drifted: it was missing `wp-api-fetch` and `wp-element`, so the moment a
                // dashboard screen called `apiFetch` or a hook it broke with no error worth reading.
                // `wp-api` and `wp-util` stay because the older screens still lean on `wp.ajax`.
                $asset = require B_SLIDER_DIR_PATH . 'build/admin-dashboard.asset.php';

                wp_enqueue_script(
                    'bsb-admin-dashboard',
                    B_SLIDER_DIR . 'build/admin-dashboard.js',
                    array_unique( array_merge( $asset['dependencies'], [ 'wp-api', 'wp-util' ] ) ),
                    $asset['version'],
                    true
                );
                wp_set_script_translations( 'bsb-admin-dashboard', 'b-slider', B_SLIDER_DIR_PATH . 'languages' );
            }
        }

        public function adminMenu(){
             
            add_submenu_page(
                'edit.php?post_type=bsb',
                __('Demo & Help', 'b-slider'),
                __('Demo & Help', 'b-slider'),
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
                    'version' => B_SLIDER_PLUGIN_VERSION,
                    'adminUrl' => admin_url(),
                    // Always false in this build. Sent rather than assumed so the screens can ask
                    // the same question they ask in the Premium one — see `Settings`.
                    'isPremium' => b_slider_is_premium(),
                ] ) ); ?>'
            >
            </div>
        <?php }
    }
    new AdminMenu();
}
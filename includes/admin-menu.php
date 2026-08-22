<?php
namespace B_SLIDER;

if (!defined('ABSPATH')) {exit;}
if(!class_exists( __NAMESPACE__ . '\AdminMenu' )) {

    class AdminMenu {

        /**
         * The screen this plugin's dashboard lives on, as WordPress named it.
         *
         * Taken from `add_submenu_page()` rather than written out: the hook is built from the parent
         * menu's registered slug at runtime — see `get_plugin_page_hookname()` — so a string spelt
         * here would be a guess about core's internal state.
         *
         * Null until `admin_menu` has run, which is fine: `admin_enqueue_scripts` fires after it.
         */
        private $hook_suffix = null;

        public function __construct() {
            add_action( 'admin_enqueue_scripts', [$this, 'adminEnqueueScripts'] );
            add_action( 'admin_menu', [$this, 'adminMenu'] );
        }

        public function adminEnqueueScripts($hook) {
            /**
             * This screen and no other.
             *
             * This was `if ( strpos( $hook, 'b-slider' ) )`, which is wrong twice over: `strpos`
             * answers `0` for a match at the start — falsy, so a hook beginning with the slug would
             * have been skipped — and `false` for no match, which is also falsy, so the two cases
             * were indistinguishable. It only worked because the hook happens to carry a prefix.
             * It also matched any screen with `b-slider` anywhere in its name.
             */
            if ( $hook === $this->hook_suffix ) {
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
             
            $this->hook_suffix = add_submenu_page(
                'edit.php?post_type=bsb',
                __('Help & Demos', 'b-slider'),
                '<span style="color: #f18500; font-weight: 600;">' . __('Help & Demos', 'b-slider') . '</span>',
                'manage_options',
                'b-slider',
                [$this, 'bsbHelpPage'],
            );   
            
        }

        public function bsbHelpPage()
        {?>
            <div
                id='bsbDashboard'
                data-info='<?php echo esc_attr( wp_json_encode( [
                    'version' => B_SLIDER_PLUGIN_VERSION,
                    'adminUrl' => admin_url(),
                    'isPremium' => b_slider_is_premium(),
                ] ) ); ?>'
            >
            </div>
        <?php } 
    }
    new AdminMenu();
}
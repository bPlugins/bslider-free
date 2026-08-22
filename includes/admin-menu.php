<?php
namespace B_SLIDER;

if (!defined('ABSPATH')) {exit;}
if(!class_exists( __NAMESPACE__ . '\AdminMenu' )) {

    class AdminMenu {

        

        private $hook_suffix = null;

        public function __construct() {
            add_action( 'admin_enqueue_scripts', [$this, 'adminEnqueueScripts'] );
            add_action( 'admin_menu', [$this, 'adminMenu'] );
        }

        public function adminEnqueueScripts($hook) {
            

            if ( $hook === $this->hook_suffix ) {
                wp_enqueue_style( 'bsb-admin-dashboard', B_SLIDER_DIR . 'build/admin-dashboard.css', [], B_SLIDER_PLUGIN_VERSION );

                
                
                
                
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
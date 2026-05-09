<?php
/**
 * Plugin Name: bSlider
 * Description: Simple slider with bootstrap.
 * Version: 2.0.11
 * Author: bPlugins
 * Author URI: http://bplugins.com
 * License: GPLv3
 * License URI: https://www.gnu.org/licenses/gpl-3.0.txt
 * Text Domain: b-slider
 */
 
    // ABS PATH
    if (!defined('ABSPATH')) {exit;}

    define( 'BSB_PLUGIN_VERSION', isset( $_SERVER['HTTP_HOST'] ) && 'localhost' === $_SERVER['HTTP_HOST'] ? time() : '2.0.11' );
    define('BSB_DIR', plugin_dir_url(__FILE__));
    define('BSB_DIR_PATH', plugin_dir_path(__FILE__));
    define('BSB_ASSETS_DIR', plugin_dir_url(__FILE__) . 'assets/');

    if(!function_exists('bs_fs')) {
        
        function bs_fs() 
        {
            global $bs_fs;

            if ( !isset( $bs_fs ) ) {
                require_once dirname(__FILE__) . '/vendor/freemius-lite/start.php'; 

                $bs_fs = fs_lite_dynamic_init([
                    'id'                  => '19318',
                    'slug'                => 'b-slider',
                    'type'                => 'plugin',
                    'public_key'          => 'pk_b24b0b3f21a9dbfaff418c0c40fc1',
                    'is_premium'          => false, 
                    'menu' => array(
                        'slug'           => 'edit.php?post_type=bsb',
                        'first-path'     => 'edit.php?post_type=bsb&page=b-slider#/pricing',
                        'support'     => false,
                    )
                ]);
            }
            return $bs_fs;
        }
        bs_fs();
        do_action('bs_fs_loaded'); 
    }

    require_once plugin_dir_path(__FILE__) . '/includes/Posts.php';
    require_once plugin_dir_path(__FILE__) . '/includes/PostsAjax.php';

    class BSB_Slider{

        private static $instance;

        private function __construct(){

            $this->load_classes();
            add_action('enqueue_block_assets', [$this, 'enqueueBlockAssets']);
            add_action('admin_enqueue_scripts', [$this, 'adminEnqueueScripts']);
            add_action('init', [$this, 'onInit']);
            add_filter( 'plugin_action_links', [$this, 'plugin_action_links'], 10, 2 );
            add_filter('plugin_row_meta', array($this, 'insert_plugin_row_meta'), 10, 2);
        }

        // Check instance 
        public static function get_instance() {
            if ( self::$instance ){
                return self::$instance;
            }

            self::$instance = new self();
            return self::$instance;
        }

        //Class loaded
        public function load_classes () {
            require_once plugin_dir_path(__FILE__) . '/includes/admin-menu.php'; 
            require_once plugin_dir_path(__FILE__) . '/custom-post.php';
            new BSB_SLIDER\LPBCustomPost(); 
        }

        public function plugin_action_links($links, $file) {
            
            if( plugin_basename( __FILE__ ) == $file ) {

                $dashboardLink = admin_url( 'edit.php?post_type=bsb&page=b-slider' );

                 
                $links['go_pro'] = sprintf( '<a href="%s" style="%s" target="__blank">%s</a>', 'https://bplugins.com/products/b-slider/pricing', 'color:#4527a4;font-weight:bold', __( 'Go Pro!', 'b-slider' ) );
            

                $links['dashboard'] = sprintf( '<a href="%s" style="%s" target="__blank">%s</a>', $dashboardLink, 'color:#4527a4;font-weight:bold', __( 'Dashboard!', 'b-slider' ) );
            }
 
            return $links;
        }

        // Extending row meta 
        public function insert_plugin_row_meta($links, $file){

            $demosLine = admin_url( 'edit.php?post_type=bsb&page=b-slider#/demos' );
    
            if ($file == 'b-slider/b-slider.php') {
                // docs & faq
                $links[] = sprintf('<a href="https://bplugins.com/docs/b-slider/" target="_blank">' . __('Docs & FAQs', 'b-slider') . '</a>');

                // Demos
                $links[] = sprintf('<a href="%s" target="_blank">' . __('Demos', 'b-slider') . '</a>', $demosLine);
            }
            return $links;
        }

        // Enqueue Block assets 
        public function enqueueBlockAssets(){
            wp_register_style('bsb-style', BSB_ASSETS_DIR . 'css/bootstrap.min.css', [], BSB_PLUGIN_VERSION);
            wp_register_style('lbb-plyr-style', BSB_ASSETS_DIR . 'css/plyr.min.css', [], BSB_PLUGIN_VERSION);

            wp_register_script('bootstrap', BSB_ASSETS_DIR . 'js/bootstrap.min.js', [], BSB_PLUGIN_VERSION, true);
            wp_register_script('lazyLoad', BSB_ASSETS_DIR . 'js/lazyLoad.js', [], BSB_PLUGIN_VERSION, true);
            wp_register_script('lbb-plyr-script', BSB_ASSETS_DIR . 'js/plyr.min.js', [], BSB_PLUGIN_VERSION, true);

             
        }

        // Short code style
        public function adminEnqueueScripts($hook){
            if ('edit.php' === $hook || 'post.php' === $hook) {
                wp_enqueue_style('bsbAdmin', BSB_ASSETS_DIR . 'css/admin.css', [], BSB_PLUGIN_VERSION);
                wp_enqueue_script('bsbAdmin', BSB_ASSETS_DIR . 'js/admin.js', ['wp-i18n'], BSB_PLUGIN_VERSION, true);
            }
        }

        public function onInit(){
            register_block_type( __DIR__ . '/build' );
        }
    }
    BSB_Slider::get_instance();


 
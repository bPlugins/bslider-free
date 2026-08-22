<?php
/**
 * Plugin Name: bSlider – Build Sliders That Bring Your Content to Life
 * Plugin URI: http://bplugins.com
 * Description: Simple slider with bootstrap.
 * Version: 2.1.0
 * Author: bPlugins
 * Author URI: http://bplugins.com
 * License: GPLv2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: b-slider
 */
 
    // ABS PATH
    if (!defined('ABSPATH')) {exit;}

    if (defined('WP_DEBUG') && WP_DEBUG === true) {
        define('B_SLIDER_PLUGIN_VERSION', time());
    } else {
        define('B_SLIDER_PLUGIN_VERSION', '2.1.0');
    }
    define('B_SLIDER_DIR', plugin_dir_url(__FILE__));
    define('B_SLIDER_DIR_PATH', plugin_dir_path(__FILE__));
    define('B_SLIDER_ASSETS_DIR', plugin_dir_url(__FILE__) . 'assets/');

    if(!function_exists('b_slider_fs')) {
        
        function b_slider_fs() 
        {
            global $b_slider_fs;

            if ( !isset( $b_slider_fs ) ) {
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
            return $b_slider_fs;
        }
        b_slider_fs();
        do_action('b_slider_fs_loaded'); 
    }

    /**
     * Whether this site may use the Premium code. Always false here: this is the free build, and the
     * gates that ask are the ones that would otherwise reach for a class it does not ship.
     *
     * Defined so the shared feed classes can ask the same question in both builds rather than each
     * carrying its own copy of the answer.
     */
    /**
     * The flags for JSON that is going to sit inside an HTML document.
     *
     * `&`, `<`, `>`, `'` and `"` all come out as `\u00XX`, which `JSON.parse` reads back as the
     * characters they stand for and an HTML parser cannot act on at all.
     *
     * **Why this is needed, in the one case that proved it.** A YouTube title arrives from the API with
     * HTML entities already in it — `&quot;` around a quoted word is the common one. Printed into the
     * page, `esc_html()` leaves that entity alone (it does not double-encode), the browser decodes it
     * back to a bare `"` *inside* a JSON string, and the feed fails to parse with "Expected ',' or '}'".
     * One punctuation mark in one video title took out every slide in the slider. With these flags there
     * is no `&` in the output for a browser to decode, so the class of bug is gone rather than patched.
     */
    if ( ! defined( 'BSB_JSON_IN_HTML' ) ) {
        define( 'BSB_JSON_IN_HTML', JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT );
    }

    if ( ! function_exists( 'b_slider_is_premium' ) ) {
        function b_slider_is_premium() {
            return false;
        }
    }

    require_once plugin_dir_path(__FILE__) . '/includes/Posts.php';
    require_once plugin_dir_path(__FILE__) . '/includes/PostsAjax.php';
    require_once plugin_dir_path(__FILE__) . '/includes/AcfFields.php';
    require_once plugin_dir_path(__FILE__) . '/includes/RestQuery.php';

    /*
     * Keeping a feed on this site is Premium, so `FeedStore`, `FeedMedia` and `FeedSync` are stubs
     * here — `SocialFeed` names them in about twenty places, and this is loaded before it so those
     * calls resolve. Each stub guards its own name, so the Premium build's real classes win whichever
     * plugin PHP reaches first. `SocialFeed::storesLocally()` still answers false, so nothing asks
     * them to store anything; they exist so the asking does not have to be guarded.
     */
    require_once plugin_dir_path(__FILE__) . '/includes/stubs.php';

    // The external feed readers. SocialFeed last: it constructs itself on include and drives the
    // other four.
    require_once plugin_dir_path(__FILE__) . '/includes/FeedChannels.php';
    require_once plugin_dir_path(__FILE__) . '/includes/FeedSchema.php';
    require_once plugin_dir_path(__FILE__) . '/includes/YouTubeFeed.php';
    require_once plugin_dir_path(__FILE__) . '/includes/RssFeed.php';
    require_once plugin_dir_path(__FILE__) . '/includes/JsonFeed.php';
    require_once plugin_dir_path(__FILE__) . '/includes/InstagramFeed.php';
    require_once plugin_dir_path(__FILE__) . '/includes/SocialFeed.php';

    // Renewing Instagram tokens before they expire is a recurring event, and it is cleared on the
    // way out — a deactivated plugin leaves nothing running behind it.
    register_deactivation_hook(__FILE__, ['B_SLIDER\\InstagramFeed', 'unscheduleRefresh']);


    class B_Slider{

        private static $instance;

        private function __construct(){

            $this->load_classes();
            add_action( 'enqueue_block_editor_assets', [$this, 'enqueueBlockEditorAssets'] );
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
            new B_SLIDER\CustomPost();
        }

        public function plugin_action_links($links, $file) {
            
            if( plugin_basename( __FILE__ ) == $file ) {

                $dashboardLink = admin_url( 'edit.php?post_type=bsb&page=b-slider' );

                 
                $links['go_pro'] = sprintf( '<a href="%s" style="%s" target="__blank">%s</a>', 'https://bplugins.com/products/b-slider/pricing', 'color:#f18500;font-weight:bold', __( 'Go Pro!', 'b-slider' ) );
            

                $links['dashboard'] = sprintf( '<a href="%s" style="%s" target="__blank">%s</a>', $dashboardLink, 'color:#f18500;font-weight:bold', __( 'Dashboard!', 'b-slider' ) );
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
        /**
         * Tell the editor which build it is running in.
         *
         * `isProActive()` and the panels read `bsbpipecheck`. It is always false here, and it is
         * declared rather than left undefined because the Settings panel reads the bare name — a
         * missing global is a ReferenceError that takes the whole inspector down, not a falsy value.
         */
        public function enqueueBlockEditorAssets() {
            wp_add_inline_script( 'bsb-slider-editor-script', "const bsbpipecheck=" . wp_json_encode( b_slider_is_premium() ) . ';', 'before' );
        }

        public function enqueueBlockAssets(){ 
            wp_register_style('bootstrap', B_SLIDER_ASSETS_DIR . 'css/bootstrap.min.css', [], B_SLIDER_PLUGIN_VERSION);
            wp_register_style('b-slider-plyr-style', B_SLIDER_ASSETS_DIR . 'css/plyr.min.css', [], B_SLIDER_PLUGIN_VERSION);

            wp_register_script('bootstrap', B_SLIDER_ASSETS_DIR . 'js/bootstrap.min.js', [], B_SLIDER_PLUGIN_VERSION, true);
            wp_register_script('lazyLoad', B_SLIDER_ASSETS_DIR . 'js/lazyLoad.js', [], B_SLIDER_PLUGIN_VERSION, true);
            wp_register_script('b-slider-plyr-script', B_SLIDER_ASSETS_DIR . 'js/plyr.min.js', [], B_SLIDER_PLUGIN_VERSION, true);
 
             
        }

        // Short code style
        public function adminEnqueueScripts($hook){
            if ('edit.php' === $hook || 'post.php' === $hook) {
                wp_enqueue_style('b-slider-admin', B_SLIDER_ASSETS_DIR . 'css/admin.css', [], B_SLIDER_PLUGIN_VERSION);
                wp_enqueue_script('b-slider-admin', B_SLIDER_ASSETS_DIR . 'js/admin.js', ['wp-i18n'], B_SLIDER_PLUGIN_VERSION, true);
            }
        }

        public function onInit(){
            register_block_type( __DIR__ . '/build' );
        }
    }
    B_Slider::get_instance();



 
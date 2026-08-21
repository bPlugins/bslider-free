<?php
namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;
if(!class_exists( __NAMESPACE__ . '\PostsAjax' )){
    class PostsAjax{
        /**
         * The most posts one public request may ask for.
         *
         * A slider can be set to `-1` — every post — and in the block that is fine: it renders
         * once, for one page. This endpoint is open to logged out visitors and answers as often as
         * it is called, so the page size it will honour is capped. Paging is the only thing that
         * calls it, and paging never asks for everything at once.
         */
        const MAX_PER_PAGE = 100;

        public function __construct(){
            add_action( 'wp_ajax_bsbPosts', [$this, 'bsbPosts'] );
            add_action( 'wp_ajax_nopriv_bsbPosts', [$this, 'bsbPosts'] );
        }

        public function bsbPosts(){
            $nonce = isset( $_POST['_wpnonce'] ) && is_string( $_POST['_wpnonce'] )
                ? sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) )
                : '';

            if( !wp_verify_nonce( $nonce, 'wp_ajax' )){
                wp_send_json_error( 'Invalid Request' );
            }

            // The query is a nested array, so it is sanitized by `sanitize_array()` on the next
            // line — which walks it and runs every leaf through `sanitize_text_field()` — rather
            // than by a sanitizer the sniff can see applied to `$_POST` directly.
            // phpcs:ignore WordPress.Security.NonceVerification.Missing, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Nonce verified above; sanitized on the next line.
            $rawQuery   = ( isset( $_POST['queryAttr'] ) && is_array( $_POST['queryAttr'] ) ) ? wp_unslash( $_POST['queryAttr'] ) : [];
            $postsQuery = \B_SLIDER\Posts::sanitize_array( $rawQuery );
            $postsQuery = is_array( $postsQuery ) ? $postsQuery : [];

            // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Verified above.
            $pageNumber = isset( $_POST['pageNumber'] ) && is_scalar( $_POST['pageNumber'] ) ? (int) $_POST['pageNumber'] : 1;
            $pageNumber = max( 1, $pageNumber );

            // `-1` — every post — degrades to the cap rather than to a single post, so a slider
            // set that way still answers with a sensible page instead of looking broken.
            $per_page = \B_SLIDER\Posts::perPage( $postsQuery['per_page'] ?? 10 );
            $postsQuery['per_page'] = ( $per_page < 1 || $per_page > self::MAX_PER_PAGE ) ? self::MAX_PER_PAGE : $per_page;

            wp_send_json_success( \B_SLIDER\Posts::getPosts( [ 'postsQuery' => $postsQuery ], $pageNumber ) );
        }
    }
    new PostsAjax();
}

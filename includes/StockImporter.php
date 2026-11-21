<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\StockImporter' ) ) {
    class StockImporter {
        const OPENVERSE = 'https://api.openverse.org/v1/images/';

        const PROXY = 'https://api.bplugins.com/wp-json/bpl-stock/v1';

        const META = [
            'openverse' => '_b_slider_openverse_id',
            'pixabay'   => '_b_slider_pixabay_id',
        ];

        const LICENSES = [ 'pdm', 'cc0' ];

        const MIMES = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/gif'  => 'gif',
            'image/webp' => 'webp',
        ];

        public function __construct() {
            add_action( 'rest_api_init', [ $this, 'register_routes' ] );
        }

        public function register_routes() {
            register_rest_route( 'bsb/v1', '/stock/import', [
                'methods'             => 'POST',
                'callback'            => [ $this, 'import' ],
                'permission_callback' => [ __CLASS__, 'can_upload' ],
                'args'                => [
                    'source' => [
                        'type'    => 'string',
                        'default' => 'openverse',
                        'enum'    => [ 'openverse', 'pixabay' ],
                    ],
                    'id'     => [
                        'type'     => 'string',
                        'required' => true,
                        'pattern'  => '^[A-Za-z0-9_-]{1,40}$',
                    ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/stock/search', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'search' ],
                'permission_callback' => [ __CLASS__, 'can_upload' ],
                'args'                => [
                    'source' => [
                        'type'     => 'string',
                        'required' => true,
                        'enum'     => [ 'pixabay' ],
                    ],
                    'q'      => [
                        'type'              => 'string',
                        'required'          => true,
                        'sanitize_callback' => 'sanitize_text_field',
                    ],
                    'page'   => [
                        'type'    => 'integer',
                        'default' => 1,
                        'minimum' => 1,
                        'maximum' => 50,
                    ],
                ],
            ] );
        }

        public static function can_upload() {
            return current_user_can( 'upload_files' );
        }

        private static function proxy() {
            $url = defined( 'B_SLIDER_STOCK_PROXY' ) ? B_SLIDER_STOCK_PROXY : self::PROXY;

            return untrailingslashit( (string) apply_filters( 'b_slider_stock_proxy', $url ) );
        }

        private static function agent() {
            $version = defined( 'B_SLIDER_PLUGIN_VERSION' ) ? B_SLIDER_PLUGIN_VERSION : '1.0';

            return 'bSlider/' . $version . ' (+https://bplugins.com)';
        }

        private static function is_pixabay_image( $url ) {
            return 'https' === wp_parse_url( $url, PHP_URL_SCHEME ) && in_array( wp_parse_url( $url, PHP_URL_HOST ), [ 'pixabay.com', 'cdn.pixabay.com' ], true );
        }

        private static function remote( $method, $url, $args = [] ) {
            $response = wp_safe_remote_request( $url, array_merge( [
                'method'     => $method,
                'timeout'    => 20,
                'user-agent' => self::agent(),
                'headers'    => [ 'Accept' => 'application/json' ],
            ], $args ) );

            $code = is_wp_error( $response ) ? 0 : (int) wp_remote_retrieve_response_code( $response );
            $body = is_wp_error( $response ) ? null : json_decode( wp_remote_retrieve_body( $response ), true );

            if ( 404 === $code && 'rest_no_route' !== ( $body['code'] ?? '' ) ) {
                return new \WP_Error( 'bsb_stock_missing', __( 'This photo is no longer available.', 'b-slider' ), [ 'status' => 404 ] );
            }

            if ( 429 === $code ) {
                return new \WP_Error( 'bsb_stock_busy', __( 'Too many requests right now. Please try again in a little while.', 'b-slider' ), [ 'status' => 429 ] );
            }

            if ( 200 !== $code || ! is_array( $body ) ) {
                return new \WP_Error( 'bsb_stock_unreachable', __( 'The photo service could not be reached. Please try again.', 'b-slider' ), [ 'status' => 502 ] );
            }

            return $body;
        }

        public function search( \WP_REST_Request $request ) {
            $source = (string) $request->get_param( 'source' );

            $data = self::remote( 'GET', add_query_arg( [
                'q'    => rawurlencode( (string) $request->get_param( 'q' ) ),
                'page' => (int) $request->get_param( 'page' ),
            ], self::proxy() . '/' . $source . '/search' ) );

            if ( is_wp_error( $data ) ) {
                return $data;
            }

            $results = [];

            foreach ( (array) ( $data['results'] ?? [] ) as $photo ) {
                $id        = (string) ( $photo['id'] ?? '' );
                $thumbnail = (string) ( $photo['thumbnail'] ?? '' );

                if ( ! preg_match( '/^[A-Za-z0-9_-]{1,40}$/', $id ) || ! self::is_pixabay_image( $thumbnail ) ) {
                    continue;
                }

                $results[] = [
                    'id'         => $id,
                    'thumbnail'  => esc_url_raw( $thumbnail ),
                    'title'      => sanitize_text_field( $photo['title'] ?? '' ),
                    'creator'    => sanitize_text_field( $photo['creator'] ?? '' ),
                    'creatorUrl' => esc_url_raw( $photo['creatorUrl'] ?? '' ),
                ];
            }

            return rest_ensure_response( [
                'pageCount' => min( 50, max( 0, (int) ( $data['pageCount'] ?? 0 ) ) ),
                'results'   => $results,
            ] );
        }

        public function import( \WP_REST_Request $request ) {
            $source = (string) $request->get_param( 'source' );
            $id     = (string) $request->get_param( 'id' );

            if ( 'pixabay' === $source ) {
                if ( ! preg_match( '/^[0-9]{1,12}$/', $id ) ) {
                    return new \WP_Error( 'rest_invalid_param', __( 'Invalid photo.', 'b-slider' ), [ 'status' => 400 ] );
                }
            } else {
                $id = strtolower( $id );

                if ( ! preg_match( '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $id ) ) {
                    return new \WP_Error( 'rest_invalid_param', __( 'Invalid photo.', 'b-slider' ), [ 'status' => 400 ] );
                }
            }

            $existing = self::existing( $source, $id );

            if ( $existing ) {
                return rest_ensure_response( self::media( $existing ) );
            }

            $photo = 'pixabay' === $source ? self::pixabay_photo( $id ) : self::openverse_photo( $id );

            if ( is_wp_error( $photo ) ) {
                return $photo;
            }

            $attachment = self::sideload( $source, $id, $photo );

            if ( is_wp_error( $attachment ) ) {
                return $attachment;
            }

            return rest_ensure_response( self::media( $attachment ) );
        }

        private static function existing( $source, $id ) {
            $found = get_posts( [
                'post_type'      => 'attachment',
                'post_status'    => 'inherit',
                'posts_per_page' => 1,
                'fields'         => 'ids',
                'no_found_rows'  => true,
                'meta_key'       => self::META[ $source ], // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
                'meta_value'     => $id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
            ] );

            return $found ? (int) $found[0] : 0;
        }

        private static function openverse_photo( $id ) {
            $image = self::remote( 'GET', self::OPENVERSE . rawurlencode( $id ) . '/' );

            if ( is_wp_error( $image ) ) {
                return $image;
            }

            if ( empty( $image['url'] ) || ! wp_http_validate_url( $image['url'] ) ) {
                return new \WP_Error( 'bsb_stock_missing', __( 'This photo is no longer available.', 'b-slider' ), [ 'status' => 404 ] );
            }

            if ( ! in_array( $image['license'] ?? '', self::LICENSES, true ) || ! empty( $image['mature'] ) ) {
                return new \WP_Error( 'bsb_stock_license', __( 'This photo cannot be imported.', 'b-slider' ), [ 'status' => 403 ] );
            }

            $title = self::clean( $image['title'] ?? '' );

            return [
                'url'         => $image['url'],
                'title'       => $title,
                'description' => self::openverse_credit( $image, $title ),
            ];
        }

        private static function pixabay_photo( $id ) {
            $photo = self::remote( 'POST', self::proxy() . '/pixabay/photo', [
                'headers' => [ 'Accept' => 'application/json', 'Content-Type' => 'application/json' ],
                'body'    => wp_json_encode( [ 'id' => $id ] ),
            ] );

            if ( is_wp_error( $photo ) ) {
                return $photo;
            }

            if ( empty( $photo['url'] ) || ! self::is_pixabay_image( $photo['url'] ) ) {
                return new \WP_Error( 'bsb_stock_missing', __( 'This photo is no longer available.', 'b-slider' ), [ 'status' => 404 ] );
            }

            $creator = self::clean( $photo['creator'] ?? '' );
            $title   = self::clean( $photo['title'] ?? '' );

            return [
                'url'         => $photo['url'],
                'title'       => $title,
                'description' => self::pixabay_credit( $photo, $creator ),
            ];
        }

        private static function clean( $text ) {
            return sanitize_text_field( html_entity_decode( (string) $text, ENT_QUOTES, 'UTF-8' ) );
        }

        private static function download( $url ) {
            $tmp = wp_tempnam( $url );

            if ( ! $tmp ) {
                return new \WP_Error( 'bsb_stock_download', __( 'The photo could not be downloaded. Please try another one.', 'b-slider' ), [ 'status' => 500 ] );
            }

            $response = wp_safe_remote_get( $url, [
                'timeout'             => 30,
                'stream'              => true,
                'filename'            => $tmp,
                'user-agent'          => self::agent(),
                'limit_response_size' => 25 * MB_IN_BYTES,
            ] );

            if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
                wp_delete_file( $tmp );

                return new \WP_Error( 'bsb_stock_download', __( 'The photo could not be downloaded. Please try another one.', 'b-slider' ), [ 'status' => 502 ] );
            }

            return $tmp;
        }

        private static function sideload( $source, $id, $photo ) {
            if ( ! function_exists( 'media_handle_sideload' ) ) {
                require_once ABSPATH . 'wp-admin/includes/file.php';
                require_once ABSPATH . 'wp-admin/includes/media.php';
                require_once ABSPATH . 'wp-admin/includes/image.php';
            }

            $tmp = self::download( $photo['url'] );

            if ( is_wp_error( $tmp ) ) {
                return $tmp;
            }

            $mime = wp_get_image_mime( $tmp );

            if ( ! $mime || ! isset( self::MIMES[ $mime ] ) ) {
                wp_delete_file( $tmp );

                return new \WP_Error( 'bsb_stock_type', __( 'This photo is not in a supported image format.', 'b-slider' ), [ 'status' => 415 ] );
            }

            $title = $photo['title'];
            $slug  = substr( sanitize_title( $title ), 0, 60 );
            $name  = sanitize_file_name( $source . '-' . ( $slug ? $slug : substr( $id, 0, 8 ) ) . '.' . self::MIMES[ $mime ] );

            $attachment = media_handle_sideload(
                [ 'name' => $name, 'tmp_name' => $tmp ],
                0,
                $title ? $title : null,
                [ 'post_content' => $photo['description'] ]
            );

            if ( is_wp_error( $attachment ) ) {
                wp_delete_file( $tmp );

                return new \WP_Error( 'bsb_stock_save', __( 'The photo could not be added to the Media Library.', 'b-slider' ), [ 'status' => 500 ] );
            }

            update_post_meta( $attachment, self::META[ $source ], $id );

            if ( $title ) {
                update_post_meta( $attachment, '_wp_attachment_image_alt', $title );
            }

            return (int) $attachment;
        }

        private static function link( $url, $text ) {
            $url = esc_url( (string) $url );

            return $url ? '<a href="' . $url . '" target="_blank" rel="noopener">' . esc_html( $text ) . '</a>' : esc_html( $text );
        }

        private static function openverse_credit( $image, $title ) {
            $license = strtoupper( (string) $image['license'] ) . ( empty( $image['license_version'] ) ? '' : ' ' . $image['license_version'] );
            $creator = self::clean( $image['creator'] ?? '' );
            $work    = self::link( $image['foreign_landing_url'] ?? '', $title ? $title : __( 'Photo', 'b-slider' ) );
            $terms   = self::link( $image['license_url'] ?? '', $license );

            $credit = $creator
                /* translators: 1: photo title, 2: photographer name, 3: licence such as CC0 1.0. */
                ? sprintf( __( '%1$s by %2$s / %3$s', 'b-slider' ), $work, self::link( $image['creator_url'] ?? '', $creator ), $terms )
                /* translators: 1: photo title, 2: licence such as CC0 1.0. */
                : sprintf( __( '%1$s / %2$s', 'b-slider' ), $work, $terms );

            return wp_kses_post( $credit );
        }

        private static function pixabay_credit( $photo, $creator ) {
            $pixabay = self::link( $photo['link'] ?? 'https://pixabay.com/', 'Pixabay' );

            $credit = $creator
                /* translators: 1: photographer name, 2: Pixabay. */
                ? sprintf( __( 'Image by %1$s from %2$s', 'b-slider' ), self::link( $photo['creatorUrl'] ?? '', $creator ), $pixabay )
                /* translators: %s: Pixabay. */
                : sprintf( __( 'Image from %s', 'b-slider' ), $pixabay );

            return wp_kses_post( $credit );
        }

        private static function media( $id ) {
            return [
                'id'      => (int) $id,
                'url'     => (string) wp_get_attachment_url( $id ),
                'alt'     => (string) get_post_meta( $id, '_wp_attachment_image_alt', true ),
                'title'   => get_the_title( $id ),
                'caption' => '',
            ];
        }
    }

    new StockImporter();
}

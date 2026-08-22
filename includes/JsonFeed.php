<?php
namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( __NAMESPACE__ . '\\JsonFeed' ) ) {
    class JsonFeed {
        public static function items( $url, $limit = 12, $date_format = 'M j, Y', $excerpt_length = 25, $placeholder_image = '', $title_length = -1, $root_key = '', $img_key = '', $title_key = '', $link_key = '', $excerpt_key = '', $btn_label_key = '', $date_key = '', $author_key = '' ) {
            /**
             * The address is checked before it is fetched, and the certificate is checked too.
             *
             * `wp_http_validate_url()` refuses anything that is not http(s), and refuses loopback and
             * private ranges — so an endpoint typed into the editor cannot be used to read
             * `127.0.0.1`, a host on the site's own network, or a cloud provider's metadata service,
             * whose answer this reader would otherwise parse and hand back as slides.
             *
             * `sslverify` was false here, and nowhere else in the plugin. It accepts a forged
             * certificate, so the feed it returns is whatever a machine on the path says it is. The
             * default is true; the option is simply gone rather than set.
             */
            $safe_url = wp_http_validate_url( $url );

            if ( ! $safe_url ) {
                return new \WP_Error(
                    'b_slider_json_bad_url',
                    __( 'That address cannot be fetched. Enter a public http:// or https:// URL.', 'b-slider' )
                );
            }

            $response = wp_remote_get( $safe_url, [
                'timeout' => 15,
            ] );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = wp_remote_retrieve_body( $response );
            if ( empty( $body ) ) {
                return new \WP_Error( 'b_slider_json_empty_body', __( 'The JSON endpoint returned an empty response.', 'b-slider' ) );
            }

            $data = json_decode( $body, true );
            if ( null === $data ) {
                return new \WP_Error( 'b_slider_json_parse_error', __( 'Failed to parse JSON response. Check the URL and format.', 'b-slider' ) );
            }

            // 1. Locate the array of items
            $items_array = self::find_items_array( $data, $root_key );

            if ( is_wp_error( $items_array ) ) {
                return $items_array;
            }

            if ( ! is_array( $items_array ) ) {
                return new \WP_Error( 'b_slider_json_no_list', __( 'The JSON response does not contain a list of items.', 'b-slider' ) );
            }

            if ( empty( $items_array ) ) {
                return [];
            }

            if ( ! self::is_list_array( $items_array ) ) {
                return new \WP_Error( 'b_slider_json_invalid_format', __( 'The JSON response format is invalid. A list of items was expected.', 'b-slider' ) );
            }

            $limit       = min( (int) $limit, count( $items_array ) );
            $items_array = array_slice( $items_array, 0, $limit );
            $results     = [];

            foreach ( $items_array as $index => $item ) {
                $results[] = self::makeItem( $item, $index, $date_format, $excerpt_length, $placeholder_image, $title_length, $img_key, $title_key, $link_key, $excerpt_key, $btn_label_key, $date_key, $author_key );
            }

            return $results;
        }

        private static function is_list_array( $arr ) {
            if ( ! is_array( $arr ) ) {
                return false;
            }
            if ( empty( $arr ) ) {
                return true;
            }
            $keys = array_keys( $arr );
            return $keys === range( 0, count( $arr ) - 1 );
        }

        private static function find_items_array( $data, $root_key ) {
            if ( ! empty( $root_key ) ) {
                // Support dot-notation (e.g. "data.posts")
                $parts = explode( '.', $root_key );
                $temp  = $data;
                foreach ( $parts as $part ) {
                    if ( is_array( $temp ) && isset( $temp[ $part ] ) ) {
                        $temp = $temp[ $part ];
                    } else {
                        $temp = null;
                        break;
                    }
                }
                if ( is_array( $temp ) ) {
                    return $temp;
                }
            }

            // If the root is directly an array list
            if ( self::is_list_array( $data ) ) {
                return $data;
            }

            // Otherwise, search for common array keys
            if ( is_array( $data ) ) {
                $common_keys = [ 'items', 'posts', 'images', 'data', 'slides', 'results', 'entries', 'articles' ];
                foreach ( $common_keys as $key ) {
                    if ( isset( $data[ $key ] ) && is_array( $data[ $key ] ) ) {
                        return $data[ $key ];
                    }
                }

                // If still not found, search recursively for the first list array
                foreach ( $data as $val ) {
                    if ( self::is_list_array( $val ) && ! empty( $val ) ) {
                        return $val;
                    }
                }
            }

            return $data;
        }

        private static function makeItem( $item, $index, $date_format, $excerpt_length, $placeholder_image, $title_length, $img_key, $title_key, $link_key, $excerpt_key, $btn_label_key, $date_key, $author_key ) {
            // If the item is a string, treat it directly as the image URL
            if ( is_string( $item ) ) {
                $image_url = $item;
                /* translators: %d: image index */
                $title     = sprintf( __( 'Image %d', 'b-slider' ), (int) $index + 1 );
                $link      = '#';
                $excerpt   = '';
                $btn_label = '';
            } else {
                $image_url = self::resolve_value( $item, $img_key, [ 'image', 'url', 'src', 'thumbnail', 'img', 'featured_image', 'file', 'image_url', 'img_url' ] );
                $title     = self::resolve_value( $item, $title_key, [ 'title', 'name', 'heading', 'label', 'caption' ] );
                $link      = self::resolve_value( $item, $link_key, [ 'link', 'url', 'permalink', 'href', 'link_url' ] );
                $excerpt   = self::resolve_value( $item, $excerpt_key, [ 'excerpt', 'description', 'content', 'desc', 'summary' ] );
                $btn_label = self::resolve_value( $item, $btn_label_key, [ 'button_text', 'btn_text', 'button_label', 'btn_label', 'read_more' ] );
            }

            // Fallback for image
            if ( empty( $image_url ) && ! empty( $placeholder_image ) ) {
                $image_url = $placeholder_image;
            }

            // Excerpt truncation
            $raw_excerpt = is_string( $excerpt ) ? wp_strip_all_tags( $excerpt ) : '';
            if ( $excerpt_length > -1 ) {
                $excerpt = wp_trim_words( $raw_excerpt, $excerpt_length );
            } else {
                $excerpt = $raw_excerpt;
            }

            // Title truncation
            $raw_title = is_string( $title ) ? wp_strip_all_tags( $title ) : '';
            if ( $title_length > -1 ) {
                $title = wp_trim_words( $raw_title, $title_length );
            } else {
                $title = $raw_title;
            }

            // Resolve date
            $date_val = self::resolve_value( $item, $date_key ?: 'date', [ 'date', 'pubDate', 'published_at', 'created_at', 'time' ] );
            $timestamp = ! empty( $date_val ) ? strtotime( $date_val ) : ( time() - ( $index * 3600 ) );
            if ( ! $timestamp ) {
                $timestamp = time() - ( $index * 3600 );
            }
            
            // `wp_date`, not `date_i18n`: `$timestamp` is a real Unix timestamp from `strtotime`, and
            // `date_i18n` adds the site's offset to a value that is already UTC — so a date printed
            // that way is out by the offset. `wp_date` converts one properly.
            $formatted_date = ! empty( $date_format ) ? wp_date( $date_format, $timestamp ) : '';
            $date_gmt       = gmdate( 'Y-m-d H:i:s', $timestamp );

            $item_id = '';
            if ( ! is_string( $item ) ) {
                $item_id = self::resolve_value( $item, '', [ 'id', 'guid', 'url', 'link' ] );
            }
            if ( '' === $item_id ) {
                if ( ! empty( $link ) && '#' !== $link ) {
                    $item_id = md5( $link );
                } elseif ( ! empty( $title ) ) {
                    $item_id = md5( $title );
                } else {
                    $item_id = (string) $index;
                }
            }

            return [
                'id'          => $item_id,
                'title'       => $title,
                'content'     => $excerpt,
                'excerpt'     => $excerpt,
                // `esc_url_raw` refuses a `javascript:` scheme, which this would otherwise print as a
                // clickable href — the sibling reader does the same, see `RssFeed::items()`.
                'link'        => ! empty( $link ) ? esc_url_raw( (string) $link ) : '#',
                // Stripped like the title and the excerpt above. It was the one field that was not,
                // and it is rendered with `dangerouslySetInnerHTML` — see `PostItem`.
                'btnLabel'    => wp_strip_all_tags( (string) $btn_label ),
                'date'        => $formatted_date,
                // `gmdate`, not `date`: this is the machine-readable stamp — schema.org and any
                // sorting read it — so it must not shift with the server's timezone setting.
                'dateISO'     => gmdate( 'c', $timestamp ),
                'dateGMT'     => $date_gmt,
                'author'      => [
                    'name' => wp_strip_all_tags( (string) self::resolve_value( $item, $author_key, [ 'author', 'creator', 'byline', 'user' ] ) ),
                    'link' => '',
                ],
                'videoId'     => '',
                'thumbnail' => [
                    'url'      => esc_url_raw( (string) $image_url ),
                    'fallback' => esc_url_raw( (string) $image_url ),
                    'srcset'   => '',
                    'sizes'    => '',
                    'alt'      => $title,
                ],
            ];
        }

        private static function resolve_value( $item, $custom_key, $fallback_keys ) {
            if ( ! is_array( $item ) ) {
                return '';
            }

            if ( ! empty( $custom_key ) ) {
                // Support dot-notation inside objects (e.g. "media.url")
                $parts = explode( '.', $custom_key );
                $temp  = $item;
                foreach ( $parts as $part ) {
                    if ( is_array( $temp ) && isset( $temp[ $part ] ) ) {
                        $temp = $temp[ $part ];
                    } else {
                        $temp = null;
                        break;
                    }
                }
                if ( is_scalar( $temp ) ) {
                    return trim( (string) $temp );
                }
            }

            // Fallback lookup
            foreach ( $fallback_keys as $key ) {
                if ( isset( $item[ $key ] ) && is_scalar( $item[ $key ] ) ) {
                    return trim( (string) $item[ $key ] );
                }
            }

            return '';
        }
    }
}

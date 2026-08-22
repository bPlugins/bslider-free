<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\RssFeed' ) ) {
    

    class RssFeed {

        

        

        private static function safeUrl( $source ) {
            $url = wp_http_validate_url( (string) $source );

            if ( ! $url ) {
                return new \WP_Error(
                    'b_slider_rss_bad_url',
                    __( 'That address cannot be fetched. Enter a public http:// or https:// feed URL.', 'b-slider' )
                );
            }

            return $url;
        }

        public static function items( $source, $limit = 12, $date_format = 'M j, Y', $excerpt_length = 25, $default_image_url = '', $title_length = -1, $timezone_offset = '', $translate_date = '' ) {
            if ( empty( $source ) ) {
                return new \WP_Error( 'b_slider_rss_empty', __( 'Please provide a valid RSS feed URL.', 'b-slider' ) );
            }

            $source = self::safeUrl( $source );

            if ( is_wp_error( $source ) ) {
                return $source;
            }

            
            $feed = fetch_feed( $source );

            if ( is_wp_error( $feed ) ) {
                return $feed;
            }

            $limit = (int) $limit;
            if ( $limit <= 0 ) {
                $limit = 12;
            }

            $feed_items = $feed->get_items( 0, $limit );
            $items      = [];

            foreach ( (array) $feed_items as $item ) {
                $items[] = self::makeItem( $item, $date_format, $excerpt_length, $default_image_url, $title_length, $timezone_offset, $translate_date );
            }

            return $items;
        }

        

        

        private static function plainText( $value ) {
            return trim( wp_strip_all_tags( html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );
        }

        public static function profile( $source ) {
            if ( empty( $source ) ) {
                return new \WP_Error( 'b_slider_rss_empty', __( 'Please provide a valid RSS feed URL.', 'b-slider' ) );
            }

            $source = self::safeUrl( $source );

            if ( is_wp_error( $source ) ) {
                return $source;
            }

            $feed = fetch_feed( $source );

            if ( is_wp_error( $feed ) ) {
                return $feed;
            }

            $name = self::plainText( (string) $feed->get_title() );
            
            
            $link = esc_url_raw( (string) $feed->get_link() );

            if ( '' === $name && '' === $link ) {
                return new \WP_Error( 'b_slider_rss_no_profile', __( 'That feed does not say what it is called or where it lives.', 'b-slider' ) );
            }

            return [
                'id'          => '' !== $link ? $link : (string) $source,
                'username'    => '',
                'name'        => $name,
                'bio'         => self::plainText( (string) $feed->get_description() ),
                'avatar'      => esc_url_raw( (string) $feed->get_image_url() ),
                
                
                'banner'      => '',
                'link'        => $link,
                'website'     => $link,
                'accountType' => 'rss',
                'posts'       => 0,
                'followers'   => 0,
                
                'views'       => 0,
            ];
        }

        

        private static function makeItem( $item, $date_format, $excerpt_length = 25, $default_image_url = '', $title_length = -1, $timezone_offset = '', $translate_date = '' ) {
            $title = trim( wp_strip_all_tags( (string) $item->get_title() ) );
            if ( $title_length > -1 ) {
                $title = wp_trim_words( $title, $title_length, '...' );
            }

            
            $image_url = '';

            
            $media_content = $item->get_item_tags( 'http://search.yahoo.com/mrss/', 'content' );
            if ( ! empty( $media_content ) && isset( $media_content[0]['attribs']['']['url'] ) ) {
                $image_url = $media_content[0]['attribs']['']['url'];
            }

            
            if ( ! $image_url ) {
                $media_thumb = $item->get_item_tags( 'http://search.yahoo.com/mrss/', 'thumbnail' );
                if ( ! empty( $media_thumb ) && isset( $media_thumb[0]['attribs']['']['url'] ) ) {
                    $image_url = $media_thumb[0]['attribs']['']['url'];
                }
            }

            
            if ( ! $image_url ) {
                $enclosures = $item->get_enclosures();
                if ( ! empty( $enclosures ) ) {
                    foreach ( $enclosures as $enclosure ) {
                        if ( $enclosure->get_link() && 0 === strpos( (string) $enclosure->get_type(), 'image/' ) ) {
                            $image_url = $enclosure->get_link();
                            break;
                        }
                    }
                }
            }

            
            if ( ! $image_url ) {
                $content = $item->get_content();
                if ( ! $content ) {
                    $content = $item->get_description();
                }
                if ( $content && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $content, $matches ) ) {
                    $image_url = $matches[1];
                }
            }

            
            if ( ! $image_url && ! empty( $default_image_url ) ) {
                $image_url = $default_image_url;
            }

            $link = esc_url_raw( (string) $item->get_permalink() );
            $id   = md5( $link ); 

            $raw_description = (string) $item->get_description();
            if ( ! $raw_description ) {
                $raw_description = (string) $item->get_content();
            }

            $description = Posts::applyBSBFilter( $raw_description );
            if ( $excerpt_length > -1 ) {
                $description = wp_trim_words( $description, $excerpt_length + 1, '' );
            }

            $published = $item->get_date( 'Y-m-d H:i:s' );

            if ( $published ) {
                $offset_val = ( '' !== $timezone_offset && 'site' !== $timezone_offset ) ? $timezone_offset : get_option( 'gmt_offset', 0 );
                if ( 0 != $offset_val ) {
                    $timestamp = strtotime( $published );
                    if ( false !== $timestamp ) {
                        $offset_seconds = (float) $offset_val * HOUR_IN_SECONDS;
                        $timestamp += $offset_seconds;
                        

                        $published = gmdate( 'Y-m-d H:i:s', $timestamp );
                    }
                }
            }

            $author = $item->get_author();
            $author_name = $author ? $author->get_name() : '';
            $author_link = $author ? $author->get_link() : '';

            $thumbnail = [];
            if ( ! empty( $image_url ) && 0 === strpos( $image_url, 'http' ) ) {
                $thumbnail = [
                    'url'      => esc_url_raw( $image_url ),
                    'alt'      => $title,
                    'fallback' => esc_url_raw( $image_url ),
                    'srcset'   => '',
                    'sizes'    => '(max-width: 782px) 100vw, 1280px',
                ];
            }

            $date_val = '';
            if ( $published && ! empty( $date_format ) ) {
                
                $date_val = self::translateDate( gmdate( $date_format, strtotime( $published ) ), $translate_date );
            }

            return [
                'id'        => $id,
                'link'      => $link,
                'name'      => $id,
                'thumbnail' => $thumbnail,
                'title'     => esc_html( $title ),
                'content'   => $description,
                'excerpt'   => $description,
                

                'author'    => [
                    'name' => self::plainText( (string) $author_name ),
                    'link' => esc_url_raw( trim( (string) $author_link ) ),
                ],
                'date'            => $date_val,
                
                'dateISO'         => $published ? gmdate( 'c', strtotime( $published ) ) : '',
                'dateGMT'         => $published,
                'modifiedDate'    => $published,
                'modifiedDateGMT' => $published,
                'commentCount'    => 0,
                'commentStatus'   => 'closed',
                'categories'      => [ 'coma' => '', 'space' => '' ],
                'taxonomies'      => [],
                'acf_fields'      => [],
                'readTime'        => [ 'min' => 0, 'sec' => 0 ],
                'status'          => 'publish',
                
                'videoId'         => '',
                'views'           => 0,
                'duration'        => '',
            ];
        }

        

        private static function translateDate( $date_string, $translation_settings ) {
            if ( empty( $translation_settings ) ) {
                return $date_string;
            }
            $pairs = explode( '||', $translation_settings );
            $replace_map = [];
            foreach ( $pairs as $pair ) {
                $parts = explode( '->', $pair );
                if ( count( $parts ) === 2 ) {
                    $key   = trim( $parts[0] );
                    $value = trim( $parts[1] );
                    if ( '' !== $key ) {
                        $replace_map[ $key ] = $value;
                    }
                }
            }
            if ( ! empty( $replace_map ) ) {
                return strtr( $date_string, $replace_map );
            }
            return $date_string;
        }
    }
}

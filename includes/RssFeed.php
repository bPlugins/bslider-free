<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\RssFeed' ) ) {
    /**
     * An RSS or Atom feed, as slider items.
     *
     * Delegates feed retrieval to WordPress's built-in `fetch_feed()` function (SimplePie),
     * which caches results automatically. The returned items are normalized to match the post shape.
     */
    class RssFeed {

        /**
         * Fetch RSS feed items and return them as normalized slider posts.
         *
         * @param string $source          The RSS feed URL.
         * @param int    $limit           How many items to fetch.
         * @param string $date_format     PHP date format string.
         * @param int    $excerpt_length  Excerpt length in words.
         * @return array|\WP_Error
         */
        public static function items( $source, $limit = 12, $date_format = 'M j, Y', $excerpt_length = 25, $default_image_url = '', $title_length = -1, $timezone_offset = '', $translate_date = '' ) {
            if ( empty( $source ) ) {
                return new \WP_Error( 'b_slider_rss_empty', __( 'Please provide a valid RSS feed URL.', 'b-slider' ) );
            }

            // SimplePie caches internally, but we also wrap it under our own SocialFeed caching layer.
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

        /**
         * The publication behind a feed, in the shape the Profile Header draws.
         *
         * The same keys every reader's `profile()` returns — the header card and the button under the slides
         * read one shape and never ask which service filled it in. A feed states its own title,
         * description, site link and, where the publisher bothered, a logo, which is all of what the
         * card shows. Nobody follows an RSS feed and there is no count to print, so the button sends
         * the visitor to the site itself and `followers` stays at 0, which is read as "do not print".
         *
         * @return array|\WP_Error
         */
        /**
         * A feed's own words as plain text — no tags, and no entities left standing.
         *
         * **`wp_strip_all_tags` alone was not enough, and the profile card is where it showed.** SimplePie
         * hands back a title already HTML-encoded, and stripping tags does not touch an entity — so a
         * publication called "NYT > World News" arrived as `NYT &gt; World News`, and the header card,
         * which draws its name as text rather than as markup, printed those five characters. It also
         * travels: "Fill from the account" writes this name into the block, so the entity was saved into
         * the slider and stayed there.
         *
         * **Decoded first and stripped second, in that order.** The other way round, `&lt;script&gt;`
         * would survive the strip as an entity and then become a real tag when decoded. Decoding first
         * means whatever the entities turn into still has to get past `wp_strip_all_tags`.
         */
        private static function plainText( $value ) {
            return trim( wp_strip_all_tags( html_entity_decode( $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ) ) );
        }

        public static function profile( $source ) {
            if ( empty( $source ) ) {
                return new \WP_Error( 'b_slider_rss_empty', __( 'Please provide a valid RSS feed URL.', 'b-slider' ) );
            }

            $feed = fetch_feed( $source );

            if ( is_wp_error( $feed ) ) {
                return $feed;
            }

            $name = self::plainText( (string) $feed->get_title() );
            // The site the feed belongs to, not the feed's own address — that is where a reader who
            // has come to the end of the slider is trying to go.
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
                // RSS has one image per channel and it is the logo, already taken as the avatar
                // above. Named for the same reason Instagram's is — one shape for every reader.
                'banner'      => '',
                'link'        => $link,
                'website'     => $link,
                'accountType' => 'rss',
                'posts'       => 0,
                'followers'   => 0,
                // An RSS feed counts nothing about itself; named for one shape across the readers.
                'views'       => 0,
            ];
        }

        /**
         * Normalize a single SimplePie_Item into a post array.
         */
        private static function makeItem( $item, $date_format, $excerpt_length = 25, $default_image_url = '', $title_length = -1, $timezone_offset = '', $translate_date = '' ) {
            $title = trim( wp_strip_all_tags( (string) $item->get_title() ) );
            if ( $title_length > -1 ) {
                $title = wp_trim_words( $title, $title_length, '...' );
            }

            // Try to extract image URL from various standard feeds
            $image_url = '';

            // 1. Media RSS: media:content url
            $media_content = $item->get_item_tags( 'http://search.yahoo.com/mrss/', 'content' );
            if ( ! empty( $media_content ) && isset( $media_content[0]['attribs']['']['url'] ) ) {
                $image_url = $media_content[0]['attribs']['']['url'];
            }

            // 2. Media RSS: media:thumbnail url
            if ( ! $image_url ) {
                $media_thumb = $item->get_item_tags( 'http://search.yahoo.com/mrss/', 'thumbnail' );
                if ( ! empty( $media_thumb ) && isset( $media_thumb[0]['attribs']['']['url'] ) ) {
                    $image_url = $media_thumb[0]['attribs']['']['url'];
                }
            }

            // 3. Enclosures of image type
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

            // 4. Regex img src extraction from content or description
            if ( ! $image_url ) {
                $content = $item->get_content();
                if ( ! $content ) {
                    $content = $item->get_description();
                }
                if ( $content && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $content, $matches ) ) {
                    $image_url = $matches[1];
                }
            }

            // 5. Fallback to custom default image URL
            if ( ! $image_url && ! empty( $default_image_url ) ) {
                $image_url = $default_image_url;
            }

            $link = esc_url_raw( (string) $item->get_permalink() );
            $id   = md5( $link ); // Stable unique ID

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
                        /**
                         * `gmdate`, because the offset has already been applied by hand above.
                         *
                         * `date()` would add the server's own timezone on top of it, shifting the
                         * result twice — an article published at noon showing as 6pm on a site
                         * whose PHP is set six hours out. Formatting a timestamp that is already
                         * where it should be is exactly what `gmdate` is for.
                         */
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
                // Same reasoning as above: `$published` already carries the chosen offset.
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
                /**
                 * Cast before trimming, because a feed need not name an author at all.
                 *
                 * `get_author()` returns null for an item without one — most news feeds — and PHP 8.1
                 * deprecates `trim(null)`, so every such item wrote a notice to the log. On the NYT
                 * feed that is fifty-five notices for one page load.
                 *
                 * The name goes through `plainText` for the same reason the profile's does: a byline
                 * arrives HTML-encoded, and this one is read as text.
                 */
                'author'    => [
                    'name' => self::plainText( (string) $author_name ),
                    'link' => esc_url_raw( trim( (string) $author_link ) ),
                ],
                'date'            => $date_val,
                // The machine-readable stamp — see the note in `JsonFeed`.
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
                // RSS-specific placeholders/fallbacks to match the standard schema/post layout.
                'videoId'         => '',
                'views'           => 0,
                'duration'        => '',
            ];
        }

        /**
         * Translate date string based on translation mappings.
         */
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

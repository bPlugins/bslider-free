<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if(!class_exists( __NAMESPACE__ . '\Posts' )){
    class Posts{
        static function sanitize_array($array){
            if( !is_array( $array ) ) {
                return false;
            }

            foreach( $array as $key => $value ) {
                if( strpos( $key, 'secret_key' ) !== false && strlen( $value ) == 32 ) {
                    $value = sanitize_text_field( str_replace( '<', '&lt;', $value ) ); 
                    $value = sanitize_text_field( $value );
                    $array[$key] = str_replace( ['&lt;', '&gt;', '&amp;'], [ '<', '>', '&'], $value );
                }else {
                    if( is_array( $value ) ) {
                        $array[$key] = self::sanitize_array( $value );
                    }else {
                        $array[$key] =$value == 'true' ? true : ( $value == 'false' ? false :  sanitize_text_field( $value ) );
                    }
                }
            }
            return $array;
        }

        static function filterNaN( $array ) {
            return array_filter( self::asList( $array ), function( $id ) {
                return $id && is_numeric( $id );
            });
        }

        /**
         * A value the query can iterate over.
         *
         * Everything in `postsQuery` can arrive from a request body, where a key the editor writes
         * as a list may turn up as a string or be missing altogether. Callers that walk one of
         * these read it through here so a malformed value narrows the query rather than erroring.
         */
        static function asList( $value ) {
            return is_array( $value ) ? array_values( $value ) : [];
        }

        /**
         * Posts per page as WP_Query should see it: a positive count, or `-1` for all of them.
         *
         * Anything else — `0`, a string, a negative other than `-1` — becomes the block's default,
         * since `0` reads to WP_Query as "the site's page size" rather than as "none".
         */
        static function perPage( $per_page ) {
            $per_page = (int) ( is_scalar( $per_page ) ? $per_page : 10 );

            if ( $per_page < 0 ) {
                return -1;
            }

            return $per_page > 0 ? $per_page : 10;
        }

        static function wordCount( $content ) {
            return $content ? count( preg_split( 
                '/[\s]+/',
                preg_replace( '/(<([^>]+)>)/i', '', $content )
            ) ) : 0;
        }

        static function applyBSBFilter( $rawContent ){
            // remove script and style tag
            // $rawContent = preg_replace( '/<script\b[^>]*>(.*?)<\/script>|<style\b[^>]*>(.*?)<\/style>/is', '', $rawContent );

            // `wp_kses` reads each tag's value as a map of allowed attributes, so nesting one tag
            // list inside another only ever produced an attribute named `0`. Each tag names its own.
            $allowedHTML = [
                'a'      => [ 'href' => [], 'title' => [] ],
                'br'     => [],
                'em'     => [],
                'strong' => [],
                'span'   => [ 'class' => [] ],
                'p'      => [ 'class' => [] ]
            ];
            $content = wp_kses( $rawContent, $allowedHTML );
            $plainText = trim( wp_strip_all_tags( $content ?? '' ) );

            return apply_filters( 'b_slider_posts_excerpt_filter', $plainText, $content );
        }

        /** Query keys naming an ACF field that fills one of the item's built-in slots. */
        const ACF_ROLE_KEYS = [ 'imageField', 'buttonTextField', 'buttonLinkField', 'titleField', 'descField' ];

        /**
         * The post types a slider can query without a Pro licence: WordPress' own two, plus
         * WooCommerce products, which this plugin has always offered as a source of its own.
         * Everything else — any post type a theme, another plugin or the user registered — is Pro.
         *
         * Mirrored in `utils/functions.js` as `FREE_POST_TYPES`, which is what the editor greys
         * the picker out by.
         */
        const FREE_POST_TYPES = [ 'post', 'page', 'product' ];

        /** The free list, after `b_slider_free_post_types` has had a say. */
        static function freePostTypes() {
            $types = apply_filters( 'b_slider_free_post_types', self::FREE_POST_TYPES );

            return is_array( $types ) ? $types : self::FREE_POST_TYPES;
        }

        /** Whether this licence may query `$post_type` at all. */
        static function isPostTypeAllowed( $post_type ) {
            if ( function_exists( 'b_slider_is_premium' ) && b_slider_is_premium() ) {
                return true;
            }

            return in_array( $post_type, self::freePostTypes(), true );
        }

        /**
         * The ACF fields to pull for each post: the ones picked for display, plus any field
         * assigned to the image, title, description or button slot.
         *
         * Slot fields are fetched even when they are not on display, otherwise the user would
         * have to also list them under "Select ACF Fields" just to make the slot resolve — and
         * image fields are never listed there at all.
         *
         * There is no cap on how many fields may be picked — every field the user selected is
         * fetched. What this still does is filter: every path that renders a slider comes through
         * here, so a name written straight into the block markup cannot reach `get_post_meta()`
         * unless ACF actually registered it for this post type.
         */
        static function acfFieldsToFetch( $postsQuery = [], $post_type = null ) {
            $post_type = $post_type ?: ( $postsQuery['post_type'] ?? 'post' );

            $fields = $postsQuery['selectedAcfFields'] ?? [];
            $fields = is_array( $fields ) ? array_values( $fields ) : [];

            // Names come in with the request and go out to `get_post_meta()`, so they are filtered
            // down to the fields ACF registered for this post type before anything else is done
            // with them — see AcfFields::allowedFieldNames().
            $fields = self::allowedAcfFields( $fields, $post_type );

            foreach ( self::ACF_ROLE_KEYS as $key ) {
                $name = trim( (string) ( $postsQuery[ $key ] ?? '' ) );

                if ( '' !== $name && ! in_array( $name, $fields, true ) && ! empty( self::allowedAcfFields( [ $name ], $post_type ) ) ) {
                    $fields[] = $name;
                }
            }

            return $fields;
        }

        /** `$fields` with anything this post type has no registered ACF field for dropped. */
        static function allowedAcfFields( $fields, $post_type ) {
            if ( ! class_exists( __NAMESPACE__ . '\AcfFields' ) ) {
                return [];
            }

            return AcfFields::allowedFields( $fields, $post_type );
        }

        /**
         * The IDs among `$terms` that really are terms of `$taxonomy` on `$post_type`.
         *
         * `selectedCategories` and `selectedTags` are one pair of keys shared by every post type, so
         * a slider moved from Posts over to products or a CPT still carries whatever was picked for
         * the old one. Those IDs belong to `category` and `post_tag`: a `tax_query` built from them
         * matches nothing, and naming a taxonomy the post type does not even have makes WP_Query
         * put `0 = 1` in the SQL and return no rows at all. Either way a slider that worked before
         * an update would come back empty, so terms that cannot apply are dropped and the filter
         * disappears with them.
         *
         * An unknown post type filters by nothing, which is what this query has always done for a
         * slider saved without one.
         */
        static function termsOfTaxonomy( $terms, $taxonomy, $post_type ) {
            if ( empty( $terms ) || ! is_array( $terms ) || ! taxonomy_exists( $taxonomy ) ) {
                return [];
            }

            if ( ! $post_type || ! is_object_in_taxonomy( $post_type, $taxonomy ) ) {
                return [];
            }

            return array_values( array_filter( array_map( 'intval', $terms ), function( $id ) use ( $taxonomy ) {
                $term = get_term( $id );

                return $term && ! is_wp_error( $term ) && $taxonomy === $term->taxonomy;
            } ) );
        }

        static function arrangedPosts( $posts, $post_type='post', $fImgSize = 'full', $metaDateFormat = 'M j, Y', $isExcerptFromContent=true, $excerptLength = 25, $selectedAcfFields = [] ) {
        
            $arranged = [];
            $excerptLength = (int) $excerptLength;
            $taxOfPostType = array_diff( get_object_taxonomies( $post_type ), array( 'post_format', 'category' ) );

            foreach( $posts as $post ){
                $id = isset( $post->ID ) ? sanitize_text_field( $post->ID ) :'';
                $content = preg_replace( '/(<([^>]+)>)/i', '', $post->post_content );
                $post_excerpt = isset($post->post_excerpt) ? sanitize_text_field($post->post_excerpt) : '';
                $contentWords = self::wordCount( $content );
        
                $thumbnail = [
                    'url' => get_the_post_thumbnail_url( $post, $fImgSize ),
                    'alt' => get_post_meta( get_post_thumbnail_id( $id ), '_wp_attachment_image_alt', true )
                ];
        
                $taxonomies = [];
                foreach ( $taxOfPostType as $key => $slug ) {
                    $terms = wp_get_post_terms( $id, $slug );
        
                    $links = '';
                    foreach( $terms as $index => $t ){
                        $link = get_term_link( $t->slug, $slug );

                        if ( is_wp_error( $link ) ) {
                            continue;
                        }
                        $terms[$index]->link = $link;

                        $links .= sprintf(
                            "<a href='%s' rel='%s'>%s</a>",
                            esc_url( $link ),
                            esc_attr( $slug ),
                            esc_html( $t->name )
                        );
                    };
                    $taxonomies[$slug] = $links;
                }
        
                $contentOrExcerptArr = $isExcerptFromContent ? [
                    'content' => $excerptLength > -1 ?
                        wp_trim_words( self::applyBSBFilter( $post->post_content ), $excerptLength, '' ) :
                        self::applyBSBFilter( $post->post_content )
                ] : [
                    'excerpt' => self::applyBSBFilter( $post->post_excerpt )
                ];

                $acfData = class_exists( __NAMESPACE__ . '\AcfFields' )
                    ? AcfFields::get_fields_for_post( $selectedAcfFields, $id )
                    : [];

                $price = '';
                $sale = '';
                $sale_percent = '';
                if ( isset( $post->post_type ) && 'product' === $post->post_type && function_exists( 'wc_get_product' ) ) {
                    $product = wc_get_product( $id );
                    if ( $product ) {
                        $price_html = $product->get_price_html();
                        $price_html = preg_replace( '/<span class="screen-reader-text">.*?<\/span>/is', '', $price_html );
                        $price = html_entity_decode( $price_html, ENT_QUOTES, 'UTF-8' );
                        
                        if ( $product->is_on_sale() ) {
                            $sale = __( 'Sale!', 'b-slider' );
                            if ( $product->is_type( 'simple' ) || $product->is_type( 'external' ) ) {
                                $regular_price = (float) $product->get_regular_price();
                                $sale_price = (float) $product->get_sale_price();
                                if ( $regular_price > 0 && $sale_price > 0 ) {
                                    $percentage = round( ( ( $regular_price - $sale_price ) / $regular_price ) * 100 );
                                    $sale_percent = '-' . $percentage . '%';
                                }
                            } else if ( $product->is_type( 'variable' ) ) {
                                $prices = $product->get_variation_prices();
                                $max_percentage = 0;
                                foreach ( $prices['price'] as $key => $var_price ) {
                                    $regular_price = (float) $prices['regular_price'][$key];
                                    $sale_price = (float) $prices['sale_price'][$key];
                                    if ( $regular_price > 0 && $sale_price > 0 && $regular_price > $sale_price ) {
                                        $p = round( ( ( $regular_price - $sale_price ) / $regular_price ) * 100 );
                                        if ( $p > $max_percentage ) {
                                            $max_percentage = $p;
                                        }
                                    }
                                }
                                if ( $max_percentage > 0 ) {
                                    $sale_percent = '-' . $max_percentage . '%';
                                }
                            }
                            if ( empty( $sale_percent ) ) {
                                $sale_percent = __( 'Sale!', 'b-slider' );
                            }
                        }
                    }
                }

                $arranged[] = array_merge( [
                    'id' => $id,
                    'price' => $price,
                    'sale' => $sale,
                    'sale_percent' => $sale_percent,
                    'link' => get_permalink( $post ),
                    'name' => isset( $post->post_name ) ? sanitize_text_field($post->post_name) : '',
                    'thumbnail' => $thumbnail,
                    'title' => isset($post->post_title) ? sanitize_text_field($post->post_title):'',
                    'author' => [
                        'name' => get_the_author_meta( 'display_name', isset($post->post_author) ? sanitize_text_field($post->post_author) : '' ),
                        'link' => get_author_posts_url( isset( $post->post_author ) ? sanitize_text_field( $post->post_author ):'' )
                    ],
                    'date' => isset($post->post_date) ? sanitize_text_field($post->post_date) : '',
                    'date' => get_the_date( $metaDateFormat, $id ),
                    'dateGMT' => isset($post->post_date_gmt) ? sanitize_text_field($post->post_date_gmt):'',
                    'modifiedDate' => isset($post->post_modified) ? sanitize_text_field($post->post_modified):'',
                    'modifiedDateGMT' => isset($post->post_modified_gmt) ? sanitize_text_field($post->post_modified_gmt):'',
                    'commentCount' => isset($post->comment_count) ? sanitize_text_field($post->comment_count):'',
                    'commentStatus' => isset($post->comment_status) ? sanitize_text_field($post->comment_status):'',
                    'categories' => [
                        'coma' => get_the_category_list( ', ', '', $id ),
                        'space' => get_the_category_list( ' ', '', $id )
                    ],
                    'taxonomies' => $taxonomies,
                    'acf_fields' => $acfData,
                    'readTime' => [
                        'min' => floor( $contentWords / 200 ),
                        'sec' => floor( $contentWords % 200 / ( 200 / 60 ) )
                    ],
                    'status' => isset($post->post_status) ? sanitize_text_field($post->post_status):''
                ], $contentOrExcerptArr );
            }
        
            return $arranged;
        }

        /**
         * WP_Query orderings the block offers, plus the ones a slider may already have saved.
         *
         * `orderby` arrives from block markup and from the public AJAX endpoint, so it is read off
         * a list rather than passed through: WP_Query hands anything it does not recognise on to
         * the ORDER BY clause, and an unrecognised value is never something the editor produced.
         */
        const ORDERBY = [ 'ID', 'author', 'title', 'name', 'date', 'modified', 'rand', 'comment_count', 'menu_order', 'none' ];

        /** One of `self::ORDERBY`, defaulting to the block's own default. */
        static function orderby( $orderby ) {
            $orderby = is_string( $orderby ) ? trim( $orderby ) : '';

            return in_array( $orderby, self::ORDERBY, true ) ? $orderby : 'date';
        }

        /**
         * A meta key as WP_Query may be given one, or an empty string.
         *
         * Not `sanitize_key()`: that lowercases, and a meta key is compared byte for byte, so a
         * field named `eventDate` would be looked up as `eventdate` and match nothing. Only the
         * characters a key can be built from are kept.
         */
        static function metaKey( $key ) {
            $key = is_string( $key ) ? trim( $key ) : '';

            return (string) preg_replace( '/[^A-Za-z0-9_\-]/', '', $key );
        }

        /**
         * Whether this licence may sort a slider on a custom field.
         *
         * Held here rather than in the editor for the same reason the post type gate is — every
         * path that renders a slider builds its args in `query()`, so a slider set up while
         * licensed, or one whose markup was written by hand, comes back sorted by date once the
         * licence is gone.
         */
        static function isMetaOrderAllowed() {
            return function_exists( 'b_slider_is_premium' ) && b_slider_is_premium();
        }

        /**
         * The ordering half of the args, for a slider sorting on a custom field.
         *
         * Naming a field is itself the choice to sort by it — there is no value in `orderby` saying
         * so. That is deliberate: the two orderings then sit side by side instead of in one slot, so
         * clearing the field hands the slider back to whichever column it was sorted on before,
         * rather than to a default it never asked for. It also keeps `orderby` a value core's REST
         * endpoint already accepts, which is half of why the editor can preview this at all.
         *
         * Returns the keys to merge into the query, and nothing at all when no field is named — so
         * an ordinary slider's args are untouched by this having been added.
         *
         * @param string $key     Meta key to sort on, already through `metaKey()`.
         * @param bool   $numeric Compare the values as numbers rather than as text.
         * @param bool   $require Drop posts that have no value for the key, rather than keeping them.
         */
        static function metaOrderArgs( $key, $numeric, $order, $require ) {
            if ( '' === $key || ! self::isMetaOrderAllowed() ) {
                return [];
            }

            /**
             * Dropping the posts that have nothing to sort by.
             *
             * Not `meta_key`, and not `EXISTS`. Clearing a field in ACF does not delete its row — it
             * writes an empty string into it — so a post whose value the author deliberately emptied
             * still has the key, and either of those tests would let it through. "Hide the ones
             * without a value" has to be a test on the value.
             *
             * Two clauses on the one key because they are asked in different currencies: the
             * ordering clause carries the type, so it can sort numerically, while the emptiness test
             * stays on `CHAR`. Cast to a number, `''` and `0` are the same thing, and a price of
             * zero — free, in stock, no charge — would vanish along with the blanks.
             */
            if ( $require ) {
                return [
                    // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                    'meta_query' => [
                        'bsbOrder' => [
                            'key'     => $key,
                            'compare' => 'EXISTS',
                            'type'    => $numeric ? 'NUMERIC' : 'CHAR'
                        ],
                        [ 'key' => $key, 'value' => '', 'compare' => '!=', 'type' => 'CHAR' ]
                    ],
                    'orderby' => [ 'bsbOrder' => $order ]
                ];
            }

            /**
             * Keeping them means asking for both groups and sorting on the named clause: posts with
             * a value sort by it, posts without join as NULL and gather at whichever end the
             * direction puts them. `meta_value_num` has no meaning inside a clause, so the same
             * distinction is made by the clause's own `type`.
             */
            return [
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                'meta_query' => [
                    'relation' => 'OR',
                    'bsbOrder' => [
                        'key'     => $key,
                        'compare' => 'EXISTS',
                        'type'    => $numeric ? 'NUMERIC' : 'CHAR'
                    ],
                    [ 'key' => $key, 'compare' => 'NOT EXISTS' ]
                ],
                'orderby' => [ 'bsbOrder' => $order ]
            ];
        }

        /**
         * The comparisons a filter rule may ask for.
         *
         * A closed list, and the block's own vocabulary rather than SQL's: the editor sends
         * `includes`, never `LIKE`. That is not only for safety — though `compare` does reach the
         * query — but because several of these are not one comparison at all. `includes` searches
         * for a value inside a serialized array, `empty` has to catch both a missing row and a blank
         * one, and neither is something a user should have to know to express.
         *
         * @var array Token => the WP_Meta_Query compare it becomes, or null when it is built by hand.
         */
        const META_COMPARE = [
            'is'           => '=',
            'is_not'       => '!=',
            'gt'           => '>',
            'gte'          => '>=',
            'lt'           => '<',
            'lte'          => '<=',
            'contains'     => 'LIKE',
            'not_contains' => 'NOT LIKE',
            'includes'     => 'LIKE',
            'not_includes' => 'NOT LIKE',
            'empty'        => null,
            'not_empty'    => null
        ];

        /** Comparisons that need no value typed beside them. */
        const META_COMPARE_VALUELESS = [ 'empty', 'not_empty' ];

        /**
         * Comparisons that a post with nothing in the field should satisfy.
         *
         * "Does not include Status" is true of a post that has no stock field at all — but SQL will
         * not say so on its own, because `NOT LIKE` is evaluated against a row, and a post with no
         * value has no row to evaluate. Left alone, asking for everything that is not X returns
         * neither the X's nor the blanks, and the two halves of a yes/no question do not add up to
         * the whole list.
         */
        const META_COMPARE_NEGATIVE = [ 'is_not', 'not_contains', 'not_includes' ];

        /** The two states ACF leaves behind for "nothing here": no row, or a row holding ''. */
        private static function metaBlankClauses( $key ) {
            return [
                [ 'key' => $key, 'compare' => 'NOT EXISTS' ],
                [ 'key' => $key, 'value' => '', 'compare' => '=', 'type' => 'CHAR' ]
            ];
        }

        /**
         * One filter rule, as a WP_Meta_Query clause.
         *
         * @param array $rule    `key`, `compare`, `value`, and the `numeric` flag.
         * @return array|null    Null for a rule too incomplete to mean anything, which is dropped
         *                       rather than guessed at: a half typed rule matching nothing would
         *                       empty the slider while the editor still showed the rule as set.
         */
        static function metaFilterClause( $rule ) {
            $key     = self::metaKey( $rule['key'] ?? '' );
            $compare = is_string( $rule['compare'] ?? '' ) ? $rule['compare'] : '';
            $value   = isset( $rule['value'] ) && is_scalar( $rule['value'] ) ? (string) $rule['value'] : '';
            $numeric = ! empty( $rule['numeric'] ) && 'false' !== $rule['numeric'];

            if ( '' === $key || ! array_key_exists( $compare, self::META_COMPARE ) ) {
                return null;
            }

            $needsValue = ! in_array( $compare, self::META_COMPARE_VALUELESS, true );

            if ( $needsValue && '' === $value ) {
                return null;
            }

            /**
             * "Has nothing in it", which in ACF is two different states.
             *
             * A field never filled in has no row; one whose value was cleared keeps its row holding
             * an empty string. Both read as empty to the person looking at the post, so both have to
             * answer to the same rule — the same distinction the sort's `Hide with no value` makes.
             */
            if ( 'empty' === $compare ) {
                return array_merge( [ 'relation' => 'OR' ], self::metaBlankClauses( $key ) );
            }

            if ( 'not_empty' === $compare ) {
                return [
                    'key'     => $key,
                    'value'   => '',
                    'compare' => '!=',
                    'type'    => 'CHAR'
                ];
            }

            /**
             * A value stored inside a serialized array.
             *
             * `checkbox` and the multiple flavours of `select`, `post_object` and `relationship` do
             * not store `rent` — they store `a:1:{i:0;s:4:"rent";}`. An `=` against that never
             * matches, which is the single most common way a hand written meta filter fails. The
             * quotes are part of the needle on purpose: without them `rent` would also match a
             * stored `current`.
             */
            $serialized = ( 'includes' === $compare || 'not_includes' === $compare );

            $clause = [
                'key'     => $key,
                'value'   => $serialized ? '"' . $value . '"' : $value,
                'compare' => self::META_COMPARE[ $compare ],
                'type'    => ( $numeric && ! $serialized ) ? 'NUMERIC' : 'CHAR'
            ];

            /**
             * A negative rule also owns the posts that have nothing.
             *
             * Asked whether the stock does not include `Status`, a post that was never given a stock
             * field has to answer yes — it includes nothing. SQL disagrees only because there is no
             * row for it to test, so the blanks are added back explicitly. Without this, "in stock"
             * and "not in stock" would return three posts and one out of five, and the missing one
             * would be invisible in both.
             */
            if ( in_array( $compare, self::META_COMPARE_NEGATIVE, true ) ) {
                return array_merge(
                    [ 'relation' => 'OR', $clause ],
                    self::metaBlankClauses( $key )
                );
            }

            if ( ! $numeric || $serialized ) {
                return $clause;
            }

            /**
             * A positive number comparison also has to say the value is there.
             *
             * Cast to a number an empty string is `0`, so a post whose price was never filled in
             * answers every question asked about prices: it is under 1500, and it is equal to zero.
             * Neither is true of a post that has no price — it simply has nothing to compare — and a
             * slider advertising "under 1500" that quietly includes the blanks is worse than one
             * that shows nothing.
             *
             * Only the positive ones: a negative comparison has already claimed the blanks above,
             * and rightly. So the emptiness test rides along here, and on `CHAR`, where `'0'` and
             * `''` are still two different things and a genuine zero survives.
             */
            return [
                'relation' => 'AND',
                [ 'key' => $key, 'value' => '', 'compare' => '!=', 'type' => 'CHAR' ],
                $clause
            ];
        }

        /**
         * Every filter rule as one meta query group, or nothing at all.
         *
         * @param array  $filters  Rules as the block saved them.
         * @param string $relation `AND` when every rule must hold, `OR` when any may.
         */
        static function metaFilterGroup( $filters, $relation ) {
            if ( ! is_array( $filters ) || ! self::isMetaOrderAllowed() ) {
                return [];
            }

            $clauses = [];

            foreach ( $filters as $rule ) {
                $clause = is_array( $rule ) ? self::metaFilterClause( $rule ) : null;

                if ( $clause ) {
                    $clauses[] = $clause;
                }
            }

            if ( ! $clauses ) {
                return [];
            }

            // A single clause still travels in a group, so the caller has one shape to merge.
            return array_merge(
                [ 'relation' => 'OR' === strtoupper( (string) $relation ) ? 'OR' : 'AND' ],
                $clauses
            );
        }

        /**
         * Everything the custom fields have to say about a query: what it is sorted on, and which
         * posts it is narrowed to.
         *
         * The two are built together because they share one `meta_query`. Kept as the single
         * entry point for both callers — `query()` on the front end and `RestQuery` for the
         * editor's preview — so the site and the preview cannot drift apart by being assembled
         * twice from the same parts.
         *
         * @param array  $conf  `orderByField`, `orderByNumeric`, `orderByRequire`, `metaFilters`,
         *                      `metaRelation`, however they reached us.
         * @param string $order `ASC` or `DESC`, already through `order()`.
         */
        static function metaQueryArgs( $conf, $order ) {
            $conf = is_array( $conf ) ? $conf : [];

            $args = self::metaOrderArgs(
                self::metaKey( $conf['orderByField'] ?? '' ),
                ! empty( $conf['orderByNumeric'] ) && 'false' !== $conf['orderByNumeric'],
                $order,
                ! empty( $conf['orderByRequire'] ) && 'false' !== $conf['orderByRequire']
            );

            $filters = self::metaFilterGroup( $conf['metaFilters'] ?? [], $conf['metaRelation'] ?? 'AND' );

            if ( ! $filters ) {
                return $args;
            }

            // Nested rather than appended: the ordering's own group may be an OR, and flattening the
            // filters into it would turn "must match this rule" into "or matches this rule". The
            // named `bsbOrder` clause is still found for the sort — WP_Meta_Query reads its clauses
            // across nesting, not only at the top level.
            $args['meta_query'] = isset( $args['meta_query'] )
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
                ? [ 'relation' => 'AND', $args['meta_query'], $filters ]
                : $filters;

            return $args;
        }

        /** `ASC` or `DESC`, defaulting to the block's own default. */
        static function order( $order ) {
            $order = is_string( $order ) ? strtoupper( trim( $order ) ) : '';

            return 'ASC' === $order ? 'ASC' : 'DESC';
        }

        static function query( $attributes ){
            $postsQuery = ( isset( $attributes['postsQuery'] ) && is_array( $attributes['postsQuery'] ) )
                ? $attributes['postsQuery']
                : [];

            // Read every value off the array by name. `extract()` let anything in the request body
            // become a local, so a key the editor never writes could still land in the args below.
            $selectedTaxonomies = ( isset( $postsQuery['selectedTaxonomies'] ) && is_array( $postsQuery['selectedTaxonomies'] ) )
                ? $postsQuery['selectedTaxonomies']
                : [];
            $selectedCategories = self::asList( $postsQuery['selectedCategories'] ?? [] );
            $selectedTags       = self::asList( $postsQuery['selectedTags'] ?? [] );
            $orderby            = self::orderby( $postsQuery['orderby'] ?? '' );
            $order              = self::order( $postsQuery['order'] ?? '' );
            $include            = self::asList( $postsQuery['include'] ?? [] );
            $isExcludeCurrent   = ! empty( $postsQuery['isExcludeCurrent'] ) && 'false' !== $postsQuery['isExcludeCurrent'];
            // A slider saved before the post type was a setting has no key for it. WP_Query reads an
            // empty one as `post` either way, so this only keeps the branch below off an undefined.
            $post_type          = $postsQuery['post_type'] ?? '';
            $post_type          = is_string( $post_type ) ? $post_type : '';

            // Where the Pro gate on custom post types is actually held. Every path that renders a
            // slider — front end, shortcode, the editor's own preview — builds its args here, so a
            // CPT picked while licensed, or written straight into the block markup, still comes
            // back as plain posts once the licence is gone. The editor greys the picker out too,
            // but only so the preview agrees with the site; it is not what holds the line.
            if ( $post_type && ! self::isPostTypeAllowed( $post_type ) ) {
                $post_type = 'post';
            }
            // WP_Query reads an empty post type as `post` anyway. Saying so here means the
            // taxonomy checks below judge such a slider against posts rather than against nothing,
            // which is what dropped every term filter a slider saved without one still carried.
            $post_type          = $post_type ?: 'post';
            $per_page           = self::perPage( $postsQuery['per_page'] ?? 10 );
            $offset             = max( 0, (int) ( $postsQuery['offset'] ?? 0 ) );

            $termsQuery = ['relation' => 'AND'];
            foreach ( $selectedTaxonomies as $taxonomy => $terms ){
                // The taxonomy name goes into the query as written, so only a registered one is
                // taken, and its terms are narrowed to IDs that really belong to it.
                $terms = is_string( $taxonomy ) ? self::termsOfTaxonomy( $terms, $taxonomy, $post_type ) : [];

                if( count( $terms ) ){
                    $termsQuery[] = [
                        'taxonomy'	=> $taxonomy,
                        'field'		=> 'term_id',
                        'terms'		=> $terms,
                    ];
                }
            }

            $defaultPostQuery = [];
            if ( 'post' === $post_type ) {
                // `category__in` and `tag__in` are ID lists, which WP_Query parses as such.
                $defaultPostQuery = [
                    'category__in'	=> array_map( 'intval', $selectedCategories ),
                    'tag__in'		=> array_map( 'intval', $selectedTags )
                ];
            } else {
                $taxFilters = [
                    ( 'product' === $post_type ? 'product_cat' : 'category' ) => $selectedCategories,
                    ( 'product' === $post_type ? 'product_tag' : 'post_tag' ) => $selectedTags
                ];

                foreach ( $taxFilters as $taxonomy => $terms ) {
                    $terms = self::termsOfTaxonomy( $terms, $taxonomy, $post_type );

                    if ( ! empty( $terms ) ) {
                        // `$termsQuery` already opens with `relation => AND`, so appending is enough.
                        $termsQuery[] = [
                            'taxonomy' => $taxonomy,
                            'field'    => 'term_id',
                            'terms'    => $terms,
                        ];
                    }
                }
            }

            $postsInclude = self::filterNaN( $include ?? [] );
            $post__in = !empty( $postsInclude ) ? [ 'post__in' => $postsInclude ] : [];
            $postsExclude = self::filterNaN( $postsQuery['exclude'] ?? [] );

            $query = array_merge( [
                'post_type'			=> $post_type,
                'posts_per_page'	=> $per_page,
                'orderby'			=> $orderby,
                'order'				=> $order,
                // Filtering a slider by category, tag or a custom taxonomy is the feature; there is
                // no way to express it to WP_Query other than this. Every term that reaches here has
                // already been narrowed to one that really belongs to the queried post type, so the
                // clause is as small as the user's own selection.
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
                'tax_query'			=> $termsQuery,
                'offset'			=> $offset,
                // "Exclude these posts" and "exclude the current one" are settings in the block, and
                // the alternative — over-fetching and dropping rows in PHP afterwards — would leave
                // `posts_per_page` and the pagination offsets counting rows the slider never shows.
                // phpcs:ignore WordPressVIPMinimum.Performance.WPQueryParams.PostNotIn_post__not_in
                'post__not_in'		=> $isExcludeCurrent ? array_merge( [ get_the_ID() ], $postsExclude ) : $postsExclude,
                'has_password'		=> false,
                'post_status'		=> 'publish'
            ], $post__in, $defaultPostQuery, self::metaQueryArgs( $postsQuery, $order ) );

            // `-1` means show all posts. WP_Query ignores `offset` while `nopaging` is on.
            if ( $per_page < 0 ) {
                $query['posts_per_page'] = -1;
                $query['nopaging']       = true;
                unset( $query['offset'] );
            }

            return $query;
        }

        /**
         * Run a set of `query()` args.
         *
         * `get_posts()` was what both render paths used, and it turns `suppress_filters` on: a site
         * running a `posts_where` of its own — a translation plugin, most of them — had it ignored
         * here and nowhere else. WP_Query leaves those filters in place, so a slider now shows what
         * the rest of the page shows. `ignore_sticky_posts` stays, since a sticky post jumping to
         * the front of a slider is not an ordering anybody picked.
         *
         * @param bool $count Whether the total is wanted. `found_posts` costs an extra pass over
         *                    the index, so only the render that paginates asks for it.
         */
        static function run( $args, $count = false ) {
            return new \WP_Query( array_merge( $args, [
                'ignore_sticky_posts' => true,
                'no_found_rows'       => ! $count
            ] ) );
        }

        static function getPosts( $attributes = [], $pageNumber = 1 ){
            $postsQuery = ( isset( $attributes['postsQuery'] ) && is_array( $attributes['postsQuery'] ) )
                ? $attributes['postsQuery']
                : [];

            $per_page   = self::perPage( $postsQuery['per_page'] ?? 10 );
            $offset     = max( 0, (int) ( $postsQuery['offset'] ?? 0 ) );
            $pageNumber = max( 1, (int) $pageNumber );
            $newArgs    = self::query( $attributes );
            // Scoped to the post type `query()` settled on, not the one the request asked for, so
            // a request naming a Pro-only type cannot reach that type's fields on a free licence.
            $selectedAcfFields = self::acfFieldsToFetch( $postsQuery, $newArgs['post_type'] );
            // A saved `'false'` is a string, which is truthy on its own. Absent means the block's
            // own default, which is to take the excerpt from the content.
            $fromContent = $postsQuery['isExcerptFromContent'] ?? true;
            $fromContent = ! empty( $fromContent ) && 'false' !== $fromContent;

            // Paging only makes sense with a positive per page value, `-1` returns every post.
            if ( $per_page > 0 ) {
                $newArgs['offset'] = ( $per_page * ( $pageNumber - 1 ) ) + $offset;
            }
            $posts = self::arrangedPosts(
                self::run( $newArgs )->posts,
                // Read back off the args rather than off `$postsQuery`, so the taxonomies collected
                // per post belong to the type actually queried after the Pro gate in `query()`.
                $newArgs['post_type'],
                $postsQuery['fImgSize'] ?? 'full',
                $postsQuery['metaDateFormat'] ?? 'M j, Y',
                $fromContent,
                $postsQuery['excerptLength'] ?? 25,
                $selectedAcfFields
            );


            return $posts;

        }
    }
}
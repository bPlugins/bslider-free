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

        

        static function asList( $value ) {
            return is_array( $value ) ? array_values( $value ) : [];
        }

        

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

        
        const ACF_ROLE_KEYS = [ 'imageField', 'buttonTextField', 'buttonLinkField', 'titleField', 'descField' ];

        

        const FREE_POST_TYPES = [ 'post', 'page', 'product' ];

        
        static function freePostTypes() {
            $types = apply_filters( 'b_slider_free_post_types', self::FREE_POST_TYPES );

            return is_array( $types ) ? $types : self::FREE_POST_TYPES;
        }

        
        static function isPostTypeAllowed( $post_type ) {
            if ( function_exists( 'b_slider_is_premium' ) && b_slider_is_premium() ) {
                return true;
            }

            return in_array( $post_type, self::freePostTypes(), true );
        }

        

        static function acfFieldsToFetch( $postsQuery = [], $post_type = null ) {
            $post_type = $post_type ?: ( $postsQuery['post_type'] ?? 'post' );

            $fields = $postsQuery['selectedAcfFields'] ?? [];
            $fields = is_array( $fields ) ? array_values( $fields ) : [];

            
            
            
            $fields = self::allowedAcfFields( $fields, $post_type );

            foreach ( self::ACF_ROLE_KEYS as $key ) {
                $name = trim( (string) ( $postsQuery[ $key ] ?? '' ) );

                if ( '' !== $name && ! in_array( $name, $fields, true ) && ! empty( self::allowedAcfFields( [ $name ], $post_type ) ) ) {
                    $fields[] = $name;
                }
            }

            return $fields;
        }

        
        static function allowedAcfFields( $fields, $post_type ) {
            if ( ! class_exists( __NAMESPACE__ . '\AcfFields' ) ) {
                return [];
            }

            return AcfFields::allowedFields( $fields, $post_type );
        }

        

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

        

        const ORDERBY = [ 'ID', 'author', 'title', 'name', 'date', 'modified', 'rand', 'comment_count', 'menu_order', 'none' ];

        
        static function orderby( $orderby ) {
            $orderby = is_string( $orderby ) ? trim( $orderby ) : '';

            return in_array( $orderby, self::ORDERBY, true ) ? $orderby : 'date';
        }

        

        static function metaKey( $key ) {
            $key = is_string( $key ) ? trim( $key ) : '';

            return (string) preg_replace( '/[^A-Za-z0-9_\-]/', '', $key );
        }

        

        static function isMetaOrderAllowed() {
            return function_exists( 'b_slider_is_premium' ) && b_slider_is_premium();
        }

        

        static function metaOrderArgs( $key, $numeric, $order, $require ) {
            if ( '' === $key || ! self::isMetaOrderAllowed() ) {
                return [];
            }

            

            if ( $require ) {
                return [
                    
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

            

            return [
                
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

        
        const META_COMPARE_VALUELESS = [ 'empty', 'not_empty' ];

        

        const META_COMPARE_NEGATIVE = [ 'is_not', 'not_contains', 'not_includes' ];

        
        private static function metaBlankClauses( $key ) {
            return [
                [ 'key' => $key, 'compare' => 'NOT EXISTS' ],
                [ 'key' => $key, 'value' => '', 'compare' => '=', 'type' => 'CHAR' ]
            ];
        }

        

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

            

            $serialized = ( 'includes' === $compare || 'not_includes' === $compare );

            $clause = [
                'key'     => $key,
                'value'   => $serialized ? '"' . $value . '"' : $value,
                'compare' => self::META_COMPARE[ $compare ],
                'type'    => ( $numeric && ! $serialized ) ? 'NUMERIC' : 'CHAR'
            ];

            

            if ( in_array( $compare, self::META_COMPARE_NEGATIVE, true ) ) {
                return array_merge(
                    [ 'relation' => 'OR', $clause ],
                    self::metaBlankClauses( $key )
                );
            }

            if ( ! $numeric || $serialized ) {
                return $clause;
            }

            

            return [
                'relation' => 'AND',
                [ 'key' => $key, 'value' => '', 'compare' => '!=', 'type' => 'CHAR' ],
                $clause
            ];
        }

        

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

            
            return array_merge(
                [ 'relation' => 'OR' === strtoupper( (string) $relation ) ? 'OR' : 'AND' ],
                $clauses
            );
        }

        

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

            
            
            
            
            
            $args['meta_query'] = isset( $args['meta_query'] )
                ? [ 'relation' => 'AND', $args['meta_query'], $filters ]
                : $filters;

            return $args;
        }

        
        static function order( $order ) {
            $order = is_string( $order ) ? strtoupper( trim( $order ) ) : '';

            return 'ASC' === $order ? 'ASC' : 'DESC';
        }

        static function query( $attributes ){
            $postsQuery = ( isset( $attributes['postsQuery'] ) && is_array( $attributes['postsQuery'] ) )
                ? $attributes['postsQuery']
                : [];

            
            
            $selectedTaxonomies = ( isset( $postsQuery['selectedTaxonomies'] ) && is_array( $postsQuery['selectedTaxonomies'] ) )
                ? $postsQuery['selectedTaxonomies']
                : [];
            $selectedCategories = self::asList( $postsQuery['selectedCategories'] ?? [] );
            $selectedTags       = self::asList( $postsQuery['selectedTags'] ?? [] );
            $orderby            = self::orderby( $postsQuery['orderby'] ?? '' );
            $order              = self::order( $postsQuery['order'] ?? '' );
            $include            = self::asList( $postsQuery['include'] ?? [] );
            $isExcludeCurrent   = ! empty( $postsQuery['isExcludeCurrent'] ) && 'false' !== $postsQuery['isExcludeCurrent'];
            
            
            $post_type          = $postsQuery['post_type'] ?? '';
            $post_type          = is_string( $post_type ) ? $post_type : '';

            
            
            
            
            
            if ( $post_type && ! self::isPostTypeAllowed( $post_type ) ) {
                $post_type = 'post';
            }
            
            
            
            $post_type          = $post_type ?: 'post';
            $per_page           = self::perPage( $postsQuery['per_page'] ?? 10 );
            $offset             = max( 0, (int) ( $postsQuery['offset'] ?? 0 ) );

            $termsQuery = ['relation' => 'AND'];
            foreach ( $selectedTaxonomies as $taxonomy => $terms ){
                
                
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
                
                
                
                
                
                'tax_query'			=> $termsQuery,
                'offset'			=> $offset,
                
                
                
                
                'post__not_in'		=> $isExcludeCurrent ? array_merge( [ get_the_ID() ], $postsExclude ) : $postsExclude,
                'has_password'		=> false,
                'post_status'		=> 'publish'
            ], $post__in, $defaultPostQuery, self::metaQueryArgs( $postsQuery, $order ) );

            
            if ( $per_page < 0 ) {
                $query['posts_per_page'] = -1;
                $query['nopaging']       = true;
                unset( $query['offset'] );
            }

            return $query;
        }

        

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
            
            
            $selectedAcfFields = self::acfFieldsToFetch( $postsQuery, $newArgs['post_type'] );
            
            
            $fromContent = $postsQuery['isExcerptFromContent'] ?? true;
            $fromContent = ! empty( $fromContent ) && 'false' !== $fromContent;

            
            if ( $per_page > 0 ) {
                $newArgs['offset'] = ( $per_page * ( $pageNumber - 1 ) ) + $offset;
            }
            $posts = self::arrangedPosts(
                self::run( $newArgs )->posts,
                
                
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
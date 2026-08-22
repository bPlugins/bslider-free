<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\RestQuery' ) ) {
    class RestQuery {

        
        const PARAM_KEY      = 'bsb_meta_key';
        const PARAM_NUMERIC  = 'bsb_meta_numeric';
        const PARAM_REQUIRE  = 'bsb_meta_require';
        const PARAM_FILTERS  = 'bsb_meta_filters';
        const PARAM_RELATION = 'bsb_meta_relation';

        
        const MAX_FILTERS = 20;

        public function __construct() {
            add_action( 'rest_api_init', [ $this, 'register' ] );
        }

        public function register() {
            foreach ( get_post_types( [ 'show_in_rest' => true ], 'names' ) as $post_type ) {
                add_filter( "rest_{$post_type}_collection_params", [ $this, 'params' ] );
                add_filter( "rest_{$post_type}_query", [ $this, 'args' ], 10, 2 );
            }
        }

        private static function allowed() {
            return current_user_can( 'edit_posts' );
        }

        
        public function params( $params ) {
            $params[ self::PARAM_KEY ] = [
                'description' => __( 'Custom field key to order by.', 'b-slider' ),
                'type'        => 'string',
                'default'     => ''
            ];

            $params[ self::PARAM_NUMERIC ] = [
                'description' => __( 'Compare that key\'s values as numbers rather than as text.', 'b-slider' ),
                'type'        => 'boolean',
                'default'     => false
            ];

            $params[ self::PARAM_REQUIRE ] = [
                'description' => __( 'Return only posts that have a value for that key.', 'b-slider' ),
                'type'        => 'boolean',
                'default'     => false
            ];

            $params[ self::PARAM_FILTERS ] = [
                'description' => __( 'Custom field filter rules, JSON encoded.', 'b-slider' ),
                'type'        => 'string',
                'default'     => ''
            ];

            $params[ self::PARAM_RELATION ] = [
                'description' => __( 'Whether every filter rule must match, or any of them.', 'b-slider' ),
                'type'        => 'string',
                'enum'        => [ 'AND', 'OR' ],
                'default'     => 'AND'
            ];

            return $params;
        }

        

        private static function filters( $request ) {
            $raw = $request->get_param( self::PARAM_FILTERS );

            if ( ! is_string( $raw ) || '' === $raw ) {
                return [];
            }

            $decoded = json_decode( $raw, true );

            if ( ! is_array( $decoded ) ) {
                return [];
            }

            
            
            return array_slice( $decoded, 0, self::MAX_FILTERS );
        }

        
        public function args( $args, $request ) {
            if ( ! self::allowed() ) {
                return $args;
            }

            $conf = [
                'orderByField'   => (string) $request->get_param( self::PARAM_KEY ),
                'orderByNumeric' => (bool) $request->get_param( self::PARAM_NUMERIC ),
                'orderByRequire' => (bool) $request->get_param( self::PARAM_REQUIRE ),
                'metaFilters'    => self::filters( $request ),
                'metaRelation'   => (string) $request->get_param( self::PARAM_RELATION )
            ];

            $metaArgs = Posts::metaQueryArgs( $conf, Posts::order( $args['order'] ?? '' ) );

            if ( ! $metaArgs ) {
                return $args;
            }

            
            
            if ( isset( $metaArgs['meta_query'], $args['meta_query'] ) && is_array( $args['meta_query'] ) ) {
                
                $metaArgs['meta_query'] = [
                    'relation' => 'AND',
                    $args['meta_query'],
                    $metaArgs['meta_query']
                ];
            }

            return array_merge( $args, $metaArgs );
        }
    }

    new RestQuery();
}

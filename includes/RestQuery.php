<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Custom field ordering, taught to the REST endpoints the editor reads posts from.
 *
 * The front end never comes through here — it builds its args in `Posts::query()` straight from the
 * block's attributes. The editor is the odd one out: it previews a slider with `getEntityRecords()`,
 * which is core's own posts endpoint, and that endpoint validates `orderby` against a fixed list and
 * has no idea what a meta query is. Left alone, a slider sorted on a field would not merely preview
 * in the wrong order — the request would be rejected outright and the editor would show no slides at
 * all, while the site showed them correctly.
 *
 * So the same ordering is expressed twice, in the two vocabularies. `Posts::metaOrderArgs()` is the
 * single answer both ask for, which is what keeps the preview and the page from drifting apart.
 */
if ( ! class_exists( __NAMESPACE__ . '\RestQuery' ) ) {
    class RestQuery {

        /** Query args the editor may add, and the block attribute each one carries. */
        const PARAM_KEY      = 'bsb_meta_key';
        const PARAM_NUMERIC  = 'bsb_meta_numeric';
        const PARAM_REQUIRE  = 'bsb_meta_require';
        const PARAM_FILTERS  = 'bsb_meta_filters';
        const PARAM_RELATION = 'bsb_meta_relation';

        /** A rule list is a list of objects, so it travels as JSON rather than as flattened keys. */
        const MAX_FILTERS = 20;

        public function __construct() {
            add_action( 'rest_api_init', [ $this, 'register' ] );
        }

        /**
         * Every post type the editor can query, since a slider may be pointed at any of them.
         *
         * Hooked per post type because that is the only shape core offers — there is no filter over
         * the collection as a whole.
         */
        public function register() {
            foreach ( get_post_types( [ 'show_in_rest' => true ], 'names' ) as $post_type ) {
                add_filter( "rest_{$post_type}_collection_params", [ $this, 'params' ] );
                add_filter( "rest_{$post_type}_query", [ $this, 'args' ], 10, 2 );
            }
        }

        /**
         * Whether this request may ask for a field ordering at all.
         *
         * Only the editor needs it, and only someone who can edit posts sees the editor. The check
         * is here rather than on the licence because an unlicensed *editor* must still preview what
         * its own front end will render — `Posts::metaOrderArgs()` holds that line for both.
         */
        private static function allowed() {
            return current_user_can( 'edit_posts' );
        }

        /**
         * The three parameters that carry a field ordering, added to what the endpoint accepts.
         *
         * `orderby` itself is left exactly as core registered it. Naming the field is what asks for
         * this ordering, so the value in `orderby` stays one core already allows — which is what
         * removed the need to reach into its enum, and with it a whole failure that only appeared at
         * runtime: route parameters are settled on `rest_api_init`, before a request has been
         * authenticated, so anything decided there is decided for nobody in particular.
         *
         * Registering them for everyone is safe because `args()`, which is per request and after
         * authentication, is what decides whether they do anything.
         */
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

        /**
         * The rule list as the editor sent it.
         *
         * A list of objects has no natural spelling in a query string, so it travels as JSON in one
         * parameter. Only the shape is checked here — every value inside is judged by
         * `Posts::metaFilterClause()`, which is also what the front end goes through, so a rule
         * cannot mean one thing in the preview and another on the page.
         */
        private static function filters( $request ) {
            $raw = $request->get_param( self::PARAM_FILTERS );

            if ( ! is_string( $raw ) || '' === $raw ) {
                return [];
            }

            $decoded = json_decode( $raw, true );

            if ( ! is_array( $decoded ) ) {
                return [];
            }

            // A bound on how much work one request may ask for, since this is a public endpoint even
            // though only an editor gets past the capability check.
            return array_slice( $decoded, 0, self::MAX_FILTERS );
        }

        /** The ordering and the filters, from the one place that decides both. */
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

            // A meta query the request already carries is left in place and joined with this one,
            // rather than replaced: ordering is not the only thing that may have put one there.
            if ( isset( $metaArgs['meta_query'], $args['meta_query'] ) && is_array( $args['meta_query'] ) ) {
                // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
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

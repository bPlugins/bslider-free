<?php 
if ( ! defined( 'ABSPATH' ) ) exit;

// Wrap in a function to avoid global variable scope warnings.
call_user_func( function( $attributes ) {

    $sliders = [];
    $posts_query = isset( $attributes['postsQuery'] ) ? $attributes['postsQuery'] : [];

    foreach ( ( isset( $attributes['sliders'] ) ? $attributes['sliders'] : [] ) as $index => $slider ) {
        $sliders[] = $slider;
        $sliders[ $index ]['title'] = isset( $slider['title'] ) ? wp_kses_post( $slider['title'] ) : '';
        $sliders[ $index ]['desc'] = isset( $slider['desc'] ) ? wp_kses_post( $slider['desc'] ) : '';
    }

    $attributes['sliders'] = $sliders;

    $source_type = isset( $attributes['sourceType'] ) ? $attributes['sourceType'] : '';
    $is_feed     = 'social' === $source_type;

    if ( $is_feed ) {
        /**
         * An external feed, read on the server before anything renders.
         *
         * No post query runs for one of these: its slides come off an HTTP feed, and querying anyway
         * would fetch every post on the site for a slider that shows none of them. `SocialFeed`
         * caches the fetch, so this costs one request per feed per cache window rather than one per
         * page load.
         *
         * The excerpt length lives on `postsQuery` because the caption is drawn by the same component
         * a post slider uses. It is passed through so the descriptions are cut before they are
         * printed, rather than shipped whole for the browser to cut.
         */
        $excerpt_length = isset( $posts_query['excerptLength'] ) ? $posts_query['excerptLength'] : 25;

        $posts       = \B_SLIDER\SocialFeed::items(
            isset( $attributes['socialQuery'] ) ? $attributes['socialQuery'] : [],
            $excerpt_length
        );
        $total_posts = count( $posts );

        /**
         * The account itself: its picture, name, bio and link, so the header card and the follow
         * button follow the account rather than a copy of it somebody typed into the block months
         * ago. What *was* typed in still wins — see how `Layout` reads the two together.
         *
         * Only the five values the block draws. `profileFor()` also carries the account type, the
         * post count and the website, and none of those have any business being in the page's markup
         * for everyone to read.
         */
        $profile = \B_SLIDER\SocialFeed::profileFor( isset( $attributes['socialQuery'] ) ? $attributes['socialQuery'] : [] );

        if ( $profile ) {
            $attributes['socialQuery']['profile'] = [
                'name'      => isset( $profile['name'] ) ? $profile['name'] : '',
                'bio'       => isset( $profile['bio'] ) ? $profile['bio'] : '',
                'avatar'    => isset( $profile['avatar'] ) ? $profile['avatar'] : '',
                'link'      => isset( $profile['link'] ) ? $profile['link'] : '',
                'followers' => (int) ( isset( $profile['followers'] ) ? $profile['followers'] : 0 ),
            ];
        }
    } else {
        // `query()` is what decides the post type actually queried — it turns down anything this
        // licence or the public is not entitled to — so the taxonomies and the ACF allow list are
        // both built from its answer rather than from the saved attribute.
        $query = \B_SLIDER\Posts::query( $attributes );

        $post_type = $query['post_type'];
        $fimg_size = isset( $posts_query['fImgSize'] ) ? $posts_query['fImgSize'] : 'full';
        $meta_date_format = isset( $posts_query['metaDateFormat'] ) ? $posts_query['metaDateFormat'] : 'M j, Y';
        $is_excerpt_from_content = isset( $posts_query['isExcerptFromContent'] ) ? $posts_query['isExcerptFromContent'] : true;
        $excerpt_length = isset( $posts_query['excerptLength'] ) ? $posts_query['excerptLength'] : 25;

        $selected_acf_fields = \B_SLIDER\Posts::acfFieldsToFetch( $posts_query, $post_type );

        $posts = \B_SLIDER\Posts::arrangedPosts( get_posts( $query ), $post_type, $fimg_size, $meta_date_format, $is_excerpt_from_content, $excerpt_length, $selected_acf_fields );

        // IDs only, since nothing but the count is wanted.
        $total_posts = count( get_posts( array_merge( $query, [ 'posts_per_page' => -1, 'fields' => 'ids' ] ) ) );
    }

    ?>
    <div
        <?php echo wp_kses_post( get_block_wrapper_attributes() ); ?>
        id='bsbCarousel-<?php echo esc_attr( isset( $attributes['cId'] ) ? $attributes['cId'] : '' ); ?>'
        data-attributes='<?php echo esc_attr( wp_json_encode( $attributes ) ); ?>'
        data-nonce='<?php echo esc_attr( wp_json_encode( wp_create_nonce( \B_SLIDER\PostsAjax::NONCE_ACTION ) ) ); ?>'
        data-totalposts='<?php echo esc_attr( $total_posts ); ?>'
    >
        <pre id='posts' style='display: none;'>
            <?php echo esc_html( wp_json_encode( $posts ) ); ?>
        </pre>
    </div>
    <?php
}, $attributes ); 
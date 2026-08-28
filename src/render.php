<?php
if ( ! defined( 'ABSPATH' ) ) exit;

call_user_func( function( $attributes, $content ) {

    if ( 'blocks' === ( isset( $attributes['sourceType'] ) ? $attributes['sourceType'] : '' ) ) {

        $attributes['_blocksHtml'] = $content;

        /*
         * Google Fonts for the layers that asked for one.
         *
         * Read out of the rendered markup rather than off the attributes, because the font is set
         * on a *child* block — a Heading the user placed in a slide — and this template is handed
         * the slider's own attributes plus its children already rendered to HTML. Walking the
         * block tree back to find them would mean re-parsing what WordPress has just finished
         * building; the family is right there in the inline style `buildLayerProps` wrote.
         *
         * One stylesheet per family, deduplicated, and only ever families that came from the
         * typography control's own list — the pattern accepts nothing but letters, spaces and
         * hyphens, so nothing from the page can reach the URL. It matches the quote in all four
         * forms the family can arrive in: a raw apostrophe or double quote, and either of them
         * HTML-escaped, since whether the markup has been through `esc_attr` depends on how the
         * block that carries it was saved.
         */
        if ( preg_match_all( '~font-family:\s*(?:\'|&\#039;|&quot;|")([A-Za-z][A-Za-z \-]{0,50})(?:\'|&\#039;|&quot;|")~', $content, $matches ) ) {

            foreach ( array_unique( $matches[1] ) as $family ) {
                $handle = 'bsb-font-' . sanitize_title( $family );

                if ( ! wp_style_is( $handle, 'registered' ) ) {
                    wp_register_style(
                        $handle,
                        'https://fonts.googleapis.com/css2?family=' . str_replace( ' ', '+', $family ) . '&display=swap',
                        [],
                        null
                    );
                }

                wp_enqueue_style( $handle );
            }
        }
        ?>
        <div
            <?php echo wp_kses_post( get_block_wrapper_attributes() ); ?>
            id='bsbCarousel-<?php echo esc_attr( isset( $attributes['cId'] ) ? $attributes['cId'] : '' ); ?>'
            data-attributes-b64='<?php echo esc_attr( base64_encode( wp_json_encode( $attributes ) ) ); ?>'
            data-nonce='<?php echo esc_attr( wp_json_encode( wp_create_nonce( \B_SLIDER\PostsAjax::NONCE_ACTION ) ) ); ?>'
            data-totalposts='0'
        ></div>
        <?php
        return;
    }

    $sliders = [];
    $posts_query = isset( $attributes['postsQuery'] ) ? $attributes['postsQuery'] : [];

    foreach ( ( isset( $attributes['sliders'] ) ? $attributes['sliders'] : [] ) as $index => $slider ) {
        $sliders[] = $slider;
        $sliders[ $index ]['title'] = isset( $slider['title'] ) ? wp_kses_post( $slider['title'] ) : '';
        $sliders[ $index ]['desc'] = isset( $slider['desc'] ) ? wp_kses_post( $slider['desc'] ) : '';
    }

    $attributes['sliders'] = $sliders;

    $query = \B_SLIDER\Posts::query( $attributes );

    $post_type = $query['post_type'];
    $fimg_size = isset( $posts_query['fImgSize'] ) ? $posts_query['fImgSize'] : 'full';
    $meta_date_format = isset( $posts_query['metaDateFormat'] ) ? $posts_query['metaDateFormat'] : 'M j, Y';
    $is_excerpt_from_content = isset( $posts_query['isExcerptFromContent'] ) ? $posts_query['isExcerptFromContent'] : true;
    $excerpt_length = isset( $posts_query['excerptLength'] ) ? $posts_query['excerptLength'] : 25;

    $selected_acf_fields = \B_SLIDER\Posts::acfFieldsToFetch( $posts_query, $post_type );

    $posts = \B_SLIDER\Posts::arrangedPosts( get_posts( $query ), $post_type, $fimg_size, $meta_date_format, $is_excerpt_from_content, $excerpt_length, $selected_acf_fields );

    ?>
    <div
        <?php echo wp_kses_post( get_block_wrapper_attributes() ); ?>
        id='bsbCarousel-<?php echo esc_attr( isset( $attributes['cId'] ) ? $attributes['cId'] : '' ); ?>'
        data-attributes='<?php echo esc_attr( wp_json_encode( $attributes ) ); ?>'
        data-nonce='<?php echo esc_attr( wp_json_encode( wp_create_nonce( \B_SLIDER\PostsAjax::NONCE_ACTION ) ) ); ?>'
        data-totalposts='<?php echo esc_attr( count( get_posts( array_merge( $query, [ 'posts_per_page' => -1, 'fields' => 'ids' ] ) ) ) ); ?>'
    >
        <pre id='posts' style='display: none;'>
            <?php echo esc_html( wp_json_encode( $posts ) ); ?>
        </pre>
    </div>
    <?php
}, $attributes, $content );

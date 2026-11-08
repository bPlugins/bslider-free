<?php
namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\AiSlides' ) ) {
    class AiSlides {
        const MAX_PROMPT = 500;

        const MAX_SLIDES = 10;

        const TIMEOUT = 25;

        const RATE_LIMIT = 20;

        const GEMINI_MODELS = [ 'gemini-3-flash-preview', 'gemini-flash-lite-latest' ];

        public function __construct() {
            add_action( 'rest_api_init', [ $this, 'register' ] );
        }

        public function register() {
            register_rest_route( 'bsb/v1', '/ai/status', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'status' ],
                'permission_callback' => [ __CLASS__, 'can_edit' ],
            ] );

            register_rest_route( 'bsb/v1', '/ai/slides', [
                'methods'             => 'POST',
                'callback'            => [ $this, 'slides' ],
                'permission_callback' => [ __CLASS__, 'can_use' ],
                'args'                => [
                    'prompt' => [ 'type' => 'string', 'required' => true ],
                    'count'  => [ 'type' => 'integer', 'default' => 3 ],
                ],
            ] );
        }

        public static function can_edit() {
            return current_user_can( 'edit_posts' );
        }

        public static function can_use() {
            return current_user_can( (string) apply_filters( 'b_slider_ai_capability', 'publish_posts' ) );
        }

        public function status() {
            $supported = self::supported();
            $ready     = false;

            if ( $supported ) {
                try {
                    $ready = true === wp_ai_client_prompt( 'Hi' )->is_supported_for_text_generation();
                } catch ( \Throwable $e ) {
                    $ready = false;
                }
            }

            return rest_ensure_response( [ 'supported' => $supported, 'ready' => $ready, 'allowed' => self::can_use() ] );
        }

        public function slides( $request ) {
            if ( ! self::supported() ) {
                return new \WP_Error( 'bsb_ai_unsupported', __( 'Create with AI needs WordPress 7.0 or newer.', 'b-slider' ), [ 'status' => 400 ] );
            }

            $limit = 'bsb_ai_rate_' . get_current_user_id();
            $used  = (int) get_transient( $limit );

            if ( $used >= self::RATE_LIMIT ) {
                return new \WP_Error( 'bsb_ai_rate', __( 'Too many AI requests. Try again in a few minutes.', 'b-slider' ), [ 'status' => 429 ] );
            }

            set_transient( $limit, $used + 1, 10 * MINUTE_IN_SECONDS );

            $prompt = trim( sanitize_textarea_field( (string) $request->get_param( 'prompt' ) ) );

            if ( '' === $prompt ) {
                return new \WP_Error( 'bsb_ai_empty', __( 'Describe what the slider is for first.', 'b-slider' ), [ 'status' => 400 ] );
            }

            $prompt = mb_substr( $prompt, 0, self::MAX_PROMPT );
            $count  = max( 1, min( self::MAX_SLIDES, (int) $request->get_param( 'count' ) ) );
            $error  = '';

            foreach ( self::models() as $model ) {
                try {
                    $options = new \WordPress\AiClient\Providers\Http\DTO\RequestOptions();
                    $options->setTimeout( self::TIMEOUT );

                    $builder = wp_ai_client_prompt( self::compose( $prompt, $count ) )
                        ->using_temperature( 0.4 )
                        ->using_request_options( $options )
                        ->as_json_response();

                    if ( '' !== $model ) {
                        $builder = $builder->using_model_preference( [ 'google', $model ] );
                    }

                    $text = $builder->generate_text();
                } catch ( \Throwable $e ) {
                    $text = new \WP_Error( 'bsb_ai_failed', $e->getMessage() );
                }

                if ( is_wp_error( $text ) ) {
                    $error = current_user_can( 'manage_options' ) ? strtok( (string) $text->get_error_message(), "\n" ) : '';
                    continue;
                }

                $answer = json_decode( trim( preg_replace( '#^```(?:json)?|```$#m', '', (string) $text ) ), true );

                if ( is_array( $answer ) ) {
                    return rest_ensure_response( [ 'slides' => $answer ] );
                }

                $error = __( 'The AI answer was not valid JSON.', 'b-slider' );
            }

            return new \WP_Error(
                'bsb_ai_failed',
                sprintf(
                    /* translators: %s: the AI service's own message. */
                    __( 'The WordPress AI connector could not answer: %s', 'b-slider' ),
                    $error ?: __( 'no reason given', 'b-slider' )
                ),
                [ 'status' => 502 ]
            );
        }

        private static function supported() {
            return function_exists( 'wp_ai_client_prompt' ) && function_exists( 'wp_supports_ai' ) && wp_supports_ai();
        }

        private static function models() {
            try {
                $registry = \WordPress\AiClient\AiClient::defaultRegistry();

                if ( $registry->hasProvider( 'google' ) && $registry->isProviderConfigured( 'google' ) ) {
                    return array_merge( self::GEMINI_MODELS, [ '' ] );
                }
            } catch ( \Throwable $e ) {
                return [ '' ];
            }

            return [ '' ];
        }

        private static function compose( $prompt, $count ) {
            return "You are writing the slides of a website slider. Answer with a single JSON object and nothing else — no prose, no markdown fence.\n\n"
                . 'Answer with {"theme":{"from":"#RRGGBB","to":"#RRGGBB","accent":"#RRGGBB"},"slides":[{"eyebrow":"…","heading":"…","text":"…","button":"…"}]}.' . "\n\n"
                . "- slides: exactly {$count}, each about a different point, in an order that reads well one after another.\n"
                . "- eyebrow: a small label above the heading, 1 to 4 words.\n"
                . "- heading: the headline, at most 60 characters.\n"
                . "- text: one or two short sentences, at most 140 characters.\n"
                . "- button: the button text, 2 or 3 words.\n"
                . "- theme.from and theme.to: two dark colours for the background gradient that suit the subject. White text must be easy to read on both.\n"
                . "- theme.accent: a brighter colour that suits the subject, used for the label and the button.\n\n"
                . "Rules:\n"
                . "- Write in the same language as the description below.\n"
                . "- Short, plain sentences. No exclamation marks.\n"
                . "- Never invent prices, discounts, dates, phone numbers, awards or other claims.\n\n"
                . "The slider is for: {$prompt}";
        }
    }

    new AiSlides();
}

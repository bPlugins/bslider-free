import { __ } from '@wordpress/i18n';
import arrow from './arrows';

import { carousel, grid, image, layers, post_thumbnails, slider, socialFeed, video, woo, wordpress } from './icons';



export const postsOrdersBy = [
    { label: __('Author', 'b-slider'), value: 'author' },
    { label: __('Title', 'b-slider'), value: 'title' },
    { label: __('Date', 'b-slider'), value: 'date' },
    { label: __('Last Modified', 'b-slider'), value: 'modified' },
];

export const postsOrders = [
    { label: __('Ascending', 'b-slider'), value: 'asc' },
    { label: __('Descending', 'b-slider'), value: 'desc' }
];

export const indicatorOption = [
    { label: __('Default', 'b-slider'), value: 'default' },
    { label: __('Image', 'b-slider'), value: 'image' }
];

export const indicatorOptions = [
    { label: __('Horizontal', 'b-slider'), value: 'horizontal' },
    { label: __('Vertical', 'b-slider'), value: 'vertical' },
]

export const paginationTypeOpt = [
    { label: __('None', 'b-slider'), value: 'none' },
    { label: __('Pagination', 'b-slider'), value: 'pagination' },
    { label: __('Load More', 'b-slider'), value: 'loadMore' }
]

export const selectLayoutOpt = [
    { label: 'Default', value: 'default', icon: slider(24, 24) },
    { label: 'Carousel', value: 'carousel', icon: carousel(24, 24) },
    { label: 'Grid', value: 'grid', icon: grid(24, 24) },
    { label: 'Thumbnails', value: 'thumbnails', icon: post_thumbnails(24, 24) }
]

export const contentPosition = [
    { label: __('Bottom Center', 'b-slider'), value: 'bottom center' },
    { label: __('Center Center', 'b-slider'), value: 'center center' },
]

export const sourceTypeOpt = [
    { label: 'Image', value: 'image', icon: image(24, 24) },
    { label: 'Posts', value: 'posts', icon: wordpress(24, 24) },
    { label: 'WooCommerce', value: 'woo', icon: woo(24, 24) },
    { label: 'Video', value: 'video', icon: video(24, 24) },
    { label: 'Gutenberg Blocks', value: 'blocks', icon: layers(24, 24) },
    { label: 'Social Feeds', value: 'social', icon: socialFeed(24, 24), isPro: true }
]

/**
 * The Plyr control buttons the free build can toggle, in the order they are shown.
 *
 * Keyed by the name Plyr itself uses, which is also the key stored in `videoConf.controls` — the
 * hyphenated ones are why the panel used to write each toggle out by hand.
 */
export const videoControlOpt = [
    { key: 'play-large', label: __('Play Large', 'b-slider') },
    { key: 'restart', label: __('Restart', 'b-slider') },
    { key: 'rewind', label: __('Rewind', 'b-slider') },
    { key: 'play', label: __('Play', 'b-slider') },
    { key: 'fast-forward', label: __('Fast Forward', 'b-slider') },
    { key: 'progress', label: __('Progress', 'b-slider') },
    { key: 'current-time', label: __('Current Time', 'b-slider') },
    { key: 'duration', label: __('Duration', 'b-slider') },
    { key: 'mute', label: __('Mute', 'b-slider') },
];

export const thumbnailsPositionOpt = [
    { label: __('Bottom', 'b-slider'), value: 'bottom' },
    { label: __('Top', 'b-slider'), value: 'top' },
    { label: __('Left', 'b-slider'), value: 'left' },
    { label: __('Right', 'b-slider'), value: 'right' },
]

export const caroDirectionOpt = [
    { label: __('Vertical', 'b-slider'), value: 'vertical' },
    { label: __('Horizontal', 'b-slider'), value: 'horizontal' },
]

export const carouselStyOpt = [
    { label: __('Standard', 'b-slider'), value: 'standard' },
    { label: __('Center', 'b-slider'), value: 'center' }
]

export const effectOpt = [
    { label: __('Default', 'b-slider'), value: 'none' },
    // { label: __('Fade', 'b-slider'), value: 'fade' },
    { label: __('Cards', 'b-slider'), value: 'cards' },
    // { label: __('Flip', 'b-slider'), value: 'flip' },
    { label: __('Coverflow', 'b-slider'), value: 'coverflow' },
    // { label: __('Cube', 'b-slider'), value: 'cube' },
]

export const alignBtnOpt = [
    { label: __('Left', 'b-slider'), value: 'left' },
    { label: __('Center', 'b-slider'), value: 'center' },
    { label: __('Right', 'b-slider'), value: 'right' },
]

export const arrowStyles = [
    { label: __('Style 1', 'b-slider'), value: 'style1', icon: arrow['style1'].right() }
]



export const contentAniOption = [
    { label: __('Fade In Left', 'b-slider'), value: 'fadeInLeft' },
    { label: __('Fade In Right', 'b-slider'), value: 'fadeInRight' },
    { label: __('Fade In Up', 'b-slider'), value: 'fadeInUp' },
    { label: __('Fade In Down', 'b-slider'), value: 'fadeInDown' },
    { label: __('Fade In', 'b-slider'), value: 'fadeIn' },
    { label: __('Zoom In', 'b-slider'), value: 'zoomIn' },
    { label: __('Slide In Down', 'b-slider'), value: 'slideInDown' },
    { label: __('Slide In Up', 'b-slider'), value: 'slideInUp' },
    { label: __('Slide In Left', 'b-slider'), value: 'slideInLeft' },
    { label: __('Slide In Right', 'b-slider'), value: 'slideInRight' },
]

export const animationOptions = [
    { label: __('Default', 'b-slider'), value: 'default' },
    { label: __('Fade', 'b-slider'), value: 'carousel-fade' },
    { label: __('Flip', 'b-slider'), value: 'flip' },
]

export const animationFreeOptions = [
    { label: __('Default', 'b-slider'), value: 'default' },
    { label: __('Fade', 'b-slider'), value: 'carousel-fade' }
];

export const sliderOption = [
    { label: __('Default', 'b-slider'), value: 'default' },
    { label: __('Vertical', 'b-slider'), value: 'vertical' },
]

export const tabs = [
    {
        name: 'General',
        title: __('General', 'b-slider'),
        className: 'general',
    },
    {
        name: 'style',
        title: __('Style', 'b-slider'),
        className: 'style',
    },

];

export const visibility = [
    { label: __('Show', 'b-slider'), value: 'true' },
    { label: __('Hide', 'b-slider'), value: 'false' },
]

export const styles = [
    { label: __('Default', 'b-slider'), value: '' },
    { label: __('Dot', 'b-slider'), value: 'dot' },
];

/**
 * The Layer-Based Builder's own option lists (Gutenberg Blocks source).
 *
 * Every value here is an animate.css class minus the `animate__` prefix, except `bsbFloat` — a
 * custom keyframe of this plugin's own, in style.scss.
 */
export const entryEffectOpt = [
    { label: __('None', 'b-slider'), value: '' },
    { label: __('Fade In', 'b-slider'), value: 'fadeIn' },
    { label: __('Fade In Up', 'b-slider'), value: 'fadeInUp' },
    { label: __('Fade In Down', 'b-slider'), value: 'fadeInDown' },
    { label: __('Fade In Left', 'b-slider'), value: 'fadeInLeft' },
    { label: __('Fade In Right', 'b-slider'), value: 'fadeInRight' },
    { label: __('Zoom In', 'b-slider'), value: 'zoomIn' },
    { label: __('Slide In Up', 'b-slider'), value: 'slideInUp' },
    { label: __('Slide In Down', 'b-slider'), value: 'slideInDown' },
    { label: __('Slide In Left', 'b-slider'), value: 'slideInLeft' },
    { label: __('Slide In Right', 'b-slider'), value: 'slideInRight' },
    { label: __('Bounce In', 'b-slider'), value: 'bounceIn' },
    { label: __('Flip In X', 'b-slider'), value: 'flipInX' },
];

/** The preset delays a free layer can start after — enough to put one layer after another. */
export const entryDelayOpt = [
    { label: __('Together (0s)', 'b-slider'), value: 0 },
    { label: __('0.2s', 'b-slider'), value: 0.2 },
    { label: __('0.5s', 'b-slider'), value: 0.5 },
    { label: __('1s', 'b-slider'), value: 1 },
];

/** Pulse and Bounce are free; the rest are marked "- Pro" wherever this list is shown. */
export const loopEffectOpt = [
    { label: __('None', 'b-slider'), value: '' },
    { label: __('Pulse', 'b-slider'), value: 'pulse' },
    { label: __('Bounce', 'b-slider'), value: 'bounce' },
    { label: __('Float', 'b-slider'), value: 'bsbFloat' },
    { label: __('Flash', 'b-slider'), value: 'flash' },
    { label: __('Shake', 'b-slider'), value: 'headShake' },
    { label: __('Swing', 'b-slider'), value: 'swing' },
];

export const PRO_LOOP_EFFECTS = ['bsbFloat', 'flash', 'headShake', 'swing'];

export const loopSpeedOpt = [
    { label: __('Slow', 'b-slider'), value: 3 },
    { label: __('Normal', 'b-slider'), value: 2 },
    { label: __('Fast', 'b-slider'), value: 1.2 },
];

export const hoverEffectOpt = [
    { label: __('None', 'b-slider'), value: '' },
    { label: __('Scale', 'b-slider'), value: 'scale' },
    { label: __('Lift', 'b-slider'), value: 'lift' },
    { label: __('Fade', 'b-slider'), value: 'fade' },
];

export const clickActionOpt = [
    { label: __('Nothing', 'b-slider'), value: '' },
    { label: __('Open a link', 'b-slider'), value: 'url' },
    { label: __('Scroll to', 'b-slider'), value: 'scroll' },
    { label: __('Next slide', 'b-slider'), value: 'next' },
    { label: __('Previous slide', 'b-slider'), value: 'prev' },
];

export const pxUnit = (def = 0) => ({ value: 'px', label: 'px', default: def });
export const perUnit = (def = 0) => ({ value: '%', label: '%', default: def });
export const emUnit = (def = 0) => ({ value: 'em', label: 'em', default: def });
export const remUnit = (def = 0) => ({ value: 'rem', label: 'rem', default: def });
export const vwUnit = (def = 0) => ({ value: 'vw', label: 'vw', default: def });
export const vhUnit = (def = 0) => ({ value: 'vh', label: 'vh', default: def });

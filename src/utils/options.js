import { __ } from '@wordpress/i18n';
import arrow from './arrows';

import { carousel, grid, image, listLayout, post_thumbnails, slider, socialFeed, video, woo, wordpress } from './icons';



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
    { label: 'Thumbnails', value: 'thumbnails', icon: post_thumbnails(24, 24) },
    /**
     * A YouTube channel's own layout, and offered nowhere else.
     *
     * `feedOnly` is read by both pickers — the sidebar tiles in `General` and the wizard cards in
     * `SelectLayout` — so the condition lives with the layout it belongs to instead of being written
     * out twice and drifting. A single video is not a channel and an RSS feed is not videos, so
     * neither gets it; `Layout` also falls back at render time for a slider whose feed changed after
     * the fact.
     */
    { label: 'List', value: 'list', icon: listLayout(24, 24), feedOnly: 'youtube' }
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
    { label: 'Social Feeds', value: 'social', icon: socialFeed(24, 24) }
]

/** The layouts a slider may pick, given what it is reading. See `feedOnly` above. */
export const layoutsFor = (sourceType, feedType) => selectLayoutOpt.filter(opt =>
    !opt.feedOnly || ('social' === sourceType && opt.feedOnly === feedType)
)

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

export const pxUnit = (def = 0) => ({ value: 'px', label: 'px', default: def });
export const perUnit = (def = 0) => ({ value: '%', label: '%', default: def });
export const emUnit = (def = 0) => ({ value: 'em', label: 'em', default: def });
export const remUnit = (def = 0) => ({ value: 'rem', label: 'rem', default: def });
export const vwUnit = (def = 0) => ({ value: 'vw', label: 'vw', default: def });
export const vhUnit = (def = 0) => ({ value: 'vh', label: 'vh', default: def });

/**
 * One of the orderings above, or the default — the editor's answer to `Posts::orderby()`.
 *
 * The preview is fetched through core's own posts endpoint, which validates `orderby` against a
 * fixed list and rejects the whole request over an unrecognised one. So a slider carrying a value
 * this build no longer offers — saved by a newer version, written into the markup by hand, or left
 * behind when an option was withdrawn — would not merely sort oddly: the editor would show no
 * slides at all while the site rendered them fine, since the front end quietly falls back.
 *
 * It falls back here too, so the two agree and one stale value cannot empty the preview.
 */
export const safeOrderBy = orderby =>
    postsOrdersBy.some(option => option.value === orderby) ? orderby : 'date';

export const titleTag = [
    { label: __('H1', 'b-slider'), value: 'h1' },
    { label: __('H2', 'b-slider'), value: 'h2' },
    { label: __('H3', 'b-slider'), value: 'h3' },
    { label: __('H4', 'b-slider'), value: 'h4' },
    { label: __('H5', 'b-slider'), value: 'h5' },
    { label: __('H6', 'b-slider'), value: 'h6' },
    { label: __('P', 'b-slider'), value: 'p' },
    { label: __('Div', 'b-slider'), value: 'div' }
]

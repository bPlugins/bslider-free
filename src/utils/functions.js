
import { produce } from 'immer';

const $ = jQuery;

export const adminUrl = () => {
    return window.location.origin + '/wp-admin/edit.php?post_type=bsb&page=b-slider#/pricing';
}

/** Whether the Pro code is licensed. */
export const isProActive = () => typeof bsbpipecheck !== 'undefined' && Boolean(bsbpipecheck);

/** The post types a slider can query without a Pro licence. */
export const FREE_POST_TYPES = ['post', 'page', 'product'];

/** Whether this post type is Pro-only for the current licence. */
export const isPostTypeLocked = slug => !isProActive() && !FREE_POST_TYPES.includes(slug);

/** Where every `Premium` card sends people to see the feature working. */
export const DEMO_URL = 'https://bplugins.com/products/b-slider/#demos';

export const getBoxValue = object => Object.values(object).join(" ");

/** Sources that draw their slides from a query rather than from the `Slides` panel. */
export const isPostSource = sourceType => 'posts' === sourceType || 'woo' === sourceType;

/** The plain one-slide-at-a-time slider — everything the grid, carousel and thumbnails layouts are not. */
export const isDefaultLayout = layoutType => !['carousel', 'grid', 'thumbnails'].includes(layoutType);

/**
 * The post type a slider queries and the taxonomies that go with it.
 *
 * `post_type` is what the query really runs against; `sourceType` only says whether the result is
 * rendered as products or as posts, and a slider saved before the post type dropdown existed has
 * nothing but that. Products keep their terms in `product_cat`/`product_tag`, so the pair has to
 * follow the post type rather than the source tile.
 */
export const postTypeTaxonomies = (postType, sourceType) => {
    const targetPostType = postType || ('woo' === sourceType ? 'product' : 'post');

    return {
        targetPostType,
        catTaxSlug: 'product' === targetPostType ? 'product_cat' : 'category',
        tagTaxSlug: 'product' === targetPostType ? 'product_tag' : 'post_tag',
    };
};

/**
 * One item of an attribute array with a single key replaced, leaving the rest untouched.
 *
 * `childType` reaches one level further in, for the items that keep a value inside an object of
 * their own.
 */
export const updateArrayItem = (list, index, type, val, childType = false) => produce(list, draft => {
    if (childType) {
        draft[index][type][childType] = val;
    } else {
        draft[index][type] = val;
    }
});


export const strToIntArr = str => str?.trim().split(',').map(id => id ? parseInt(id) : id);
export const filterSelected = (taxonomy, selected) => taxonomy?.map(tax => tax.id)?.filter(tax => selected.indexOf(tax) !== -1);

export const checkDirection = (val) => {

    if (val === 'center center') {
        return { moveFromEdge: '0px' }
    } else {
        return { moveFromEdge: "50%" }
    }
}

export const tabController = () => {
    setTimeout(() => {
        const panelBodies = document.querySelectorAll('.components-panel__body-title button');
        panelBodies.forEach(item => {
            item.addEventListener('click', clickEveryItem);
        });

        function clickEveryItem() {
            this.removeEventListener('click', clickEveryItem);
            panelBodies.forEach(item => {
                if (item.getAttribute('aria-expanded') === 'true' && !item.isEqualNode(this)) {
                    item.click();
                }
            });
            setTimeout(() => {
                this.addEventListener('click', clickEveryItem);
            }, 500);
        }
    }, 500);
};

// slide on mouse wheel
export function whileEvent(e) {
    if (e.originalEvent.wheelDelta / 120 > 0) {
        $(this).carousel('next');
    }
    else {
        $(this).carousel('prev');
    }
}

// Mouse Drag slide 
var oldx = 0;
export function slideStart(event) {
    oldx = event.pageX;
}

export function slideEnd(event) {
    if (event.pageX < oldx) {
        jQuery(this).carousel('next');
    }
    else if (event.pageX > oldx) {
        jQuery(this).carousel('prev');
    }
}



export const filterNaN = array => array?.filter(id => id && !isNaN(id));
export const filterObject = (obj, callback) => Object.fromEntries(Object.entries(obj).filter(([key, val]) => callback(key, val)));
export const wordCount = content => content ? (content?.replace(/(<([^>]+)>)/gi, '').split(/\s+/) || [])?.length : 0;

export const filterPassword = (posts = [], has_password) => {
    if (!Array.isArray(posts)) {
        return [];
    }
    switch (has_password) {
        case 'true':
            return posts?.filter(p => p.password)
        case 'false':
            return posts?.filter(p => !p.password)
        default:
            return posts
    }
}


export const wp_post_truncateText = (text, wordLimit = 20) => {
    let words = text.split(" ");
    return words?.length > wordLimit ? words.slice(0, wordLimit).join(" ") + "..." : text;
}

export const truncate = (str, nu_words) => {
    if (!str) return '';

    const words = str.split(/\s+/);
    const truncatedWords = words.slice(0, nu_words);
    return truncatedWords.join(' ');
};

export const strLength = (str) => str ? str.split(' ')?.length : 0;


export const getEmbedUrl = (video) => {
    if (!video?.url) return null;

    const url = video.url;

    // Check for YouTube URL
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("youtu.be")
            ? url.split("/").pop()
            : new URLSearchParams(new URL(url).search).get("v");
        return `https://www.youtube.com/embed/${videoId}`;
    }

    // Check for Vimeo URL
    if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop();
        return `https://player.vimeo.com/video/${videoId}`;
    }

    return null;
};

/**
 * Ensures exactly one `.carousel-item` under `rootEl` carries `.active`.
 *
 * Every other sourceType bakes `active` onto the first `sliders` entry at attribute-default time,
 * but a `blocks` slider's slides are independent child blocks that can't know their position
 * among their siblings — so nothing sets `.active` for them at all unless this does. "Exactly
 * one", not "at least one": two can end up active at once when the same markup is mounted twice
 * (a slider nested inside another slider's slide), which would leave Bootstrap moving off one
 * slide while the other stays stranded on screen.
 */
export const ensureActiveCarouselItem = (rootEl) => {
    if (!rootEl) return;

    const items = ownCarouselItems(rootEl);
    const active = items.filter(el => el.classList.contains('active'));

    if (1 === active.length) return;

    active.slice(1).forEach(el => el.classList.remove('active'));

    if (0 === active.length && items[0]) {
        items[0].classList.add('active');
    }
};

/**
 * The `.carousel-item`s this slider is responsible for.
 *
 * A slide can hold another bSlider, whose slides must not be counted or touched by the outer
 * one — so ownership is by nearest `.bsbCarousel` ancestor, not by DOM depth. Depth alone would
 * miscount: the front end nests a `blocks` slide's items straight under `.carousel-inner`, while
 * the editor's own wrapper elements sit an extra level or two deeper.
 */
export const ownCarouselItems = (rootEl) => [...rootEl.querySelectorAll('.carousel-item')]
    .filter(el => el.closest('.bsbCarousel') === rootEl);

export const sanitizeHref = (url) => {
    if (!url) return '#';

    const raw = String(url).trim();

    // Block obvious XSS protocols
    const lowered = raw.toLowerCase();
    if (
        lowered.startsWith('javascript:') ||
        lowered.startsWith('data:') ||
        lowered.startsWith('vbscript:')
    ) {
        return '#';
    }

    // Allow common safe protocols + relative URLs
    if (
        lowered.startsWith('http://') ||
        lowered.startsWith('https://') ||
        lowered.startsWith('mailto:') ||
        lowered.startsWith('tel:') ||
        raw.startsWith('/') ||
        raw.startsWith('#')
    ) {
        return raw;
    }

    // Anything else -> block
    return '#';
};

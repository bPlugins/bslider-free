
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

export const formatPHPDate = (dateVal, formatStr, lang = document.documentElement.lang || undefined) => {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return '';

    let result = '';
    for (let i = 0; i < formatStr.length; i++) {
        const char = formatStr[i];
        switch (char) {
            case 'F':
                result += date.toLocaleDateString(lang, { month: 'long' });
                break;
            case 'M':
                result += date.toLocaleDateString(lang, { month: 'short' });
                break;
            case 'm':
                result += String(date.getMonth() + 1).padStart(2, '0');
                break;
            case 'n':
                result += String(date.getMonth() + 1);
                break;
            case 'j':
                result += String(date.getDate());
                break;
            case 'd':
                result += String(date.getDate()).padStart(2, '0');
                break;
            case 'Y':
                result += String(date.getFullYear());
                break;
            case 'y':
                result += String(date.getFullYear()).slice(-2);
                break;
            case 'g': {
                const hours = date.getHours() % 12;
                result += String(hours === 0 ? 12 : hours);
                break;
            }
            case 'h': {
                const hours = date.getHours() % 12;
                result += String(hours === 0 ? 12 : hours).padStart(2, '0');
                break;
            }
            case 'G':
                result += String(date.getHours());
                break;
            case 'H':
                result += String(date.getHours()).padStart(2, '0');
                break;
            case 'i':
                result += String(date.getMinutes()).padStart(2, '0');
                break;
            case 's':
                result += String(date.getSeconds()).padStart(2, '0');
                break;
            case 'a':
                result += date.getHours() >= 12 ? 'pm' : 'am';
                break;
            case 'A':
                result += date.getHours() >= 12 ? 'PM' : 'AM';
                break;
            case 'l':
                result += date.toLocaleDateString(lang, { weekday: 'long' });
                break;
            case 'D':
                result += date.toLocaleDateString(lang, { weekday: 'short' });
                break;
            case '\\':
                if (i + 1 < formatStr.length) {
                    result += formatStr[++i];
                }
                break;
            default:
                result += char;
                break;
        }
    }
    return result;
};

export const translateDateStr = (dateStr, translationSettings) => {
    if (!translationSettings || !dateStr) {
        return dateStr;
    }
    const pairs = translationSettings.split('||');
    let result = dateStr;
    pairs.forEach(pair => {
        const parts = pair.split('->');
        if (parts.length === 2) {
            const key = parts[0].trim();
            const val = parts[1].trim();
            if (key) {
                result = result.split(key).join(val);
            }
        }
    });
    return result;
};

export const getLocalizedDate = (post, socialQuery) => {
    const { 
        rssLocalTimezone = false, 
        metaDateFormat = 'M j, Y', 
        rssTranslateDate = ''
    } = socialQuery || {};
    
    if (rssLocalTimezone && post?.dateISO) {
        const localFormatted = formatPHPDate(post.dateISO, metaDateFormat || 'M j, Y', 'en-US');
        return translateDateStr(localFormatted, rssTranslateDate);
    }
    return translateDateStr(post?.date || '', rssTranslateDate);
};

export const getProvider = (url) => {
    if (!url) return 'html5';
    const cleanUrl = String(url).trim();
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return 'youtube';
    if (cleanUrl.includes('vimeo.com')) return 'vimeo';
    return 'html5';
};

export const getYouTubeId = (url) => {
    if (!url) return '';
    const cleanUrl = String(url).trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = cleanUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
};

export const getVimeoId = (url) => {
    if (!url) return '';
    const cleanUrl = String(url).trim();
    const match = cleanUrl.match(/(?:vimeo\.com\/)(?:channels\/[A-z]+\/|groups\/[A-z]+\/videos\/|album\/[0-9]+\/video\/)?([0-9]+)/);
    return match ? match[1] : '';
};

/** What `block.json` gives `height`, and so what "nobody has chosen one" looks like on that key. */
const HEIGHT_UNSET = '450px';

/**
 * Whether a grid sizes its cards to their pictures rather than to a height somebody set.
 *
 * A grid column already fixes a card's width, so the picture's own proportions can settle its height —
 * every card exactly as tall as it needs to be, whatever shape the feed sends, with nothing cropped and
 * no bars. That is the default for a grid now. The other layouts show one slide at a time in a frame,
 * and there a height is the only thing that can say how tall the frame is, so they are untouched.
 *
 * **Only where no height was chosen**, which needed no new attribute to answer. `sliderHeight` defaults
 * to `{}`, so anything under a device key was put there by the height control. `height` is the older
 * single-value key that control no longer writes to; a slider carrying anything but the default on it
 * was set in a version that did, and that is just as much a choice.
 *
 * So an existing grid keeps the height it has, and setting Item Height is how anybody opts out —
 * clearing it again puts the automatic sizing back.
 *
 * Read in two places that must agree: `Style` writes the CSS from it, and `DefaultGeneral` uses it to
 * stop the height field claiming a value that is not in force.
 */
export const isAutoGridHeight = (attributes = {}) => {
    const { layoutType, sliderHeight = {}, height = '' } = attributes;

    const hasChosenHeight = !!(sliderHeight?.desktop || sliderHeight?.tablet || sliderHeight?.mobile)
        || (!!height && HEIGHT_UNSET !== height);

    return 'grid' === layoutType && !hasChosenHeight;
};

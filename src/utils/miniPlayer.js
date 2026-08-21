import { __ } from '@wordpress/i18n';
import { plyrConfig, playerVars, finishPlyr } from './config';

/**
 * The player that docks in a corner and keeps playing while the page is used.
 *
 * **Why this is a hand-built dock and not the lightbox with different CSS.** The whole point is that
 * the video survives being made small, and moving an `<iframe>` from one parent to another *reloads*
 * it — the video restarts from zero, which is the one thing a minimise button must not do. So the
 * player is mounted once, directly under the document's `body`, and every state after that is a class
 * on the same element: docked in a corner, or expanded over the middle of the page. Nothing is ever
 * reparented, so nothing ever reloads.
 *
 * That also settles why the lightbox cannot grow this feature: Fancybox owns its pane and throws it
 * away when it closes, and the player inside it goes with it.
 *
 * One dock per page, held at module scope. A second video is a new *source* for the player that is
 * already there — `player.source = …` — so clicking through a feed swaps what is playing without the
 * dock so much as blinking, and there is never a second one to trip over.
 */
let dock = null;

/**
 * Two glyphs and a cross, as markup rather than as React — the dock is built with the DOM API.
 *
 * **Four corners each, reaching the edges of the box.** The first pair drawn here had two corners with
 * short legs sitting near the middle of a 24-unit box, which at the 17px these are rendered at came out
 * as a pair of faint ticks — legible in the source and invisible on screen beside the cross next to it.
 * Corner brackets at the edges are the shape every player uses for this, and they survive being small
 * because the eye reads the rectangle they imply rather than the strokes themselves.
 *
 * `stroke-linejoin` as well as `linecap`: each bracket is one corner, and without it the turn is a
 * mitre that thins to nothing at this size.
 */
const CORNERS = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
    // Brackets opening outwards — the player is about to take more room.
    expand: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6M15 3h6v6M15 21h6v-6M9 21H3v-6" ${CORNERS}/></svg>`,
    // The same four, turned inwards.
    collapse: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9h6V3M21 9h-6V3M21 15h-6v6M3 15h6v6" ${CORNERS}/></svg>`,
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
};

/** The four corners the panel offers, as the class the stylesheet is written against. */
const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

const positionClass = value => `is-pos-${POSITIONS.includes(value) ? value : POSITIONS[0]}`;

/**
 * What Plyr should play, from what a feed reader gave us.
 *
 * A YouTube item carries an id and no file, so it is handed to Plyr as an embed — the same route the
 * lightbox uses, which is why one Player panel governs both. Instagram carries the file itself, and a
 * file is an ordinary `<video>` source with the thumbnail as its poster.
 *
 * `title` travels with the source because Plyr puts it on the player for assistive technology.
 */
const sourceOf = item => {
    const id = String(item?.videoId || '').replace(/[^A-Za-z0-9_-]/g, '');

    if (id) {
        return {
            type: 'video',
            title: item?.title || '',
            sources: [{ src: id, provider: 'vimeo' === item?.feedType ? 'vimeo' : 'youtube' }]
        };
    }

    if (!item?.videoUrl) {
        return null;
    }

    return {
        type: 'video',
        title: item?.title || '',
        sources: [{ src: item.videoUrl, type: 'video/mp4' }],
        poster: item?.poster || ''
    };
};

/** Whether this document holds a dock that is still in it — a canvas rebuild can take one away. */
const alive = () => !!dock && !!dock.root?.isConnected;

/**
 * Take the dock down.
 *
 * The Plyr instance first and the element second: destroying the player stops the video and unhooks
 * its listeners, and removing the element before that would leave a player pointed at nodes that are
 * no longer in the document.
 */
export const closeMiniPlayer = () => {
    if (!dock) {
        return;
    }

    const { root, backdrop, player, doc, onKey } = dock;

    try {
        player?.destroy();
    } catch (e) {
        // A player already gone with its document — nothing left to stop.
    }

    doc?.removeEventListener('keydown', onKey);
    backdrop?.remove();
    root?.remove();

    dock = null;
};

/**
 * Build the dock, once.
 *
 * The document comes from the slide that was clicked rather than from `window`: in the editor the
 * slides live in the canvas iframe, and a dock appended to the outer document would be a player
 * floating over the editor chrome, outside the canvas it belongs to.
 */
const build = (doc, attributes) => {
    const backdrop = doc.createElement('div');
    backdrop.className = 'bsbMiniBackdrop';

    const root = doc.createElement('div');
    root.className = 'bsbMiniPlayer';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', __('Video player', 'b-slider'));

    const stage = doc.createElement('div');
    stage.className = 'bsbMiniStage';

    const bar = doc.createElement('div');
    bar.className = 'bsbMiniBar';

    const title = doc.createElement('a');
    title.className = 'bsbMiniTitle';
    title.target = '_blank';
    title.rel = 'noopener noreferrer';

    const expand = doc.createElement('button');
    expand.type = 'button';
    expand.className = 'bsbMiniBtn is-expand';

    const close = doc.createElement('button');
    close.type = 'button';
    close.className = 'bsbMiniBtn is-close';
    close.innerHTML = ICONS.close;
    close.setAttribute('aria-label', __('Close player', 'b-slider'));

    bar.append(title, expand, close);
    root.append(stage, bar);

    /**
     * The player's colours, on the dock itself.
     *
     * `Style.js` cannot reach in here — everything it writes is scoped to `#bsbCarousel-<id>` and this
     * hangs off `body` — so the two custom properties Plyr's stylesheet reads are set where they will
     * inherit down to the player. The same thing `paintPlayer` does for the lightbox, for the same
     * reason.
     */
    Object.entries(playerVars(attributes?.videoConf)).forEach(([prop, value]) => {
        if (value) {
            root.style.setProperty(prop, value);
        }
    });

    doc.body.append(backdrop, root);

    /**
     * The essentials again, inline, for a document the stylesheet never reached.
     *
     * The dock is normally styled by `view.css` — see `.bsbMiniPlayer`. But it is also built in the
     * *editor's* admin page now, which is how a video plays at all in the editor: the canvas is a `blob:`
     * document that YouTube refuses to play in, while the admin page around it is an ordinary URL that it
     * will. WordPress prints a block's stylesheet into the canvas, and whether it also reaches the page
     * around it is not something to bet a floating player on.
     *
     * So the question is asked of the browser rather than assumed: if the root did not come out `fixed`,
     * the stylesheet is not here, and this puts in the handful of rules without which the dock would be a
     * video in the page flow. Anything cosmetic is left to the stylesheet where it exists.
     */
    if ('fixed' !== doc.defaultView?.getComputedStyle(root).position) {
        const patch = doc.createElement('style');

        patch.textContent = `
.bsbMiniPlayer{position:fixed;z-index:99998;width:min(400px,calc(100vw - 32px));background:#101010;border-radius:10px;overflow:hidden;box-shadow:0 12px 32px rgba(0,0,0,.45)}
.bsbMiniPlayer.is-pos-bottom-right{inset:auto 16px 16px auto}
.bsbMiniPlayer.is-pos-bottom-left{inset:auto auto 16px 16px}
.bsbMiniPlayer.is-pos-top-right{inset:16px 16px auto auto}
.bsbMiniPlayer.is-pos-top-left{inset:16px auto auto 16px}
.bsbMiniPlayer.is-expanded{inset:0;width:min(1000px,calc(100vw - 48px),calc((100vh - 100px) * 16 / 9));height:fit-content;margin:auto}
.bsbMiniStage{position:relative;aspect-ratio:16/9;background:#000}
.bsbMiniStage .plyr{width:100%;height:100%}
.bsbMiniBar{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#101010}
.bsbMiniTitle{flex:1 1 auto;min-width:0;color:#fff;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none}
.bsbMiniBtn{flex:0 0 auto;display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:50%;background:transparent;color:#fff;cursor:pointer}
.bsbMiniBtn svg{width:17px;height:17px}
.bsbMiniBackdrop{position:fixed;inset:0;z-index:99997;background:rgba(0,0,0,.72);opacity:0;visibility:hidden}
.bsbMiniBackdrop.is-shown{opacity:1;visibility:visible}`;

        doc.head.append(patch);
    }

    /**
     * Bigger and smaller, and the label saying which it will be next.
     *
     * Only a class and a backdrop — see the note at the top of this file for why this cannot be a move
     * from one container to another.
     */
    const setExpanded = on => {
        root.classList.toggle('is-expanded', on);
        backdrop.classList.toggle('is-shown', on);
        expand.innerHTML = on ? ICONS.collapse : ICONS.expand;
        expand.setAttribute('aria-label', on ? __('Shrink to the corner', 'b-slider') : __('Expand player', 'b-slider'));
        expand.setAttribute('aria-pressed', String(on));
    };

    setExpanded(false);

    expand.addEventListener('click', () => setExpanded(!root.classList.contains('is-expanded')));
    close.addEventListener('click', closeMiniPlayer);
    backdrop.addEventListener('click', () => setExpanded(false));

    /**
     * Escape steps back one state at a time: expanded to docked, docked to gone.
     *
     * Which is what a visitor means by it — an expanded player is covering the page, and the first
     * press should give the page back rather than throw away what they were watching.
     */
    const onKey = event => {
        if ('Escape' !== event.key) {
            return;
        }

        if (root.classList.contains('is-expanded')) {
            setExpanded(false);
            return;
        }

        closeMiniPlayer();
    };

    doc.addEventListener('keydown', onKey);

    return { root, backdrop, stage, title, doc, onKey, setExpanded };
};

/**
 * Play this item in the corner, building the dock if there is not one already.
 *
 * `item` is what the slide knows: `videoId` or `videoUrl`, a title, the address of the original, and
 * the thumbnail to stand in while a file loads.
 *
 * **The player is created with `autoplay` on regardless of the Player panel's own setting.** That
 * setting is about a slide that plays where it sits, which is a different question from a player the
 * visitor has just clicked to open — one that opened paused would need a second click to do the thing
 * that was asked for. Sound comes with it: the click is the gesture every browser wants before audio,
 * so unlike the hover preview this has no reason to start muted.
 */
export const openMiniPlayer = (attributes, item, trigger) => {
    const source = sourceOf(item);

    if (!source) {
        return;
    }

    const doc = trigger?.ownerDocument || document;

    // A canvas that rebuilt itself takes the old dock's document with it; anything left is stale.
    if (dock && (!alive() || dock.doc !== doc)) {
        closeMiniPlayer();
    }

    if (!dock) {
        dock = build(doc, attributes);
    }

    dock.root.className = `bsbMiniPlayer ${positionClass(item?.position)}${dock.root.classList.contains('is-expanded') ? ' is-expanded' : ''}`;

    dock.title.textContent = item?.title || __('Watch', 'b-slider');
    dock.title.href = item?.link || '#';

    if (dock.player) {
        // The documented way to change what a live player is playing. It rebuilds the media inside the
        // stage and leaves the dock — and its position, and whether it is expanded — exactly as it was.
        dock.player.source = source;
        dock.player.play()?.catch(() => { });

        return;
    }

    /**
     * The element Plyr adopts.
     *
     * A bare `<video>` even for an embed: handed a `<video>` and a `source` naming a provider, Plyr
     * builds the provider's iframe itself. That is what lets one code path serve a YouTube id and an
     * Instagram file, and it is why nothing here has to know which it is holding.
     */
    const media = doc.createElement('video');
    media.className = 'bsbMiniVideo';
    media.playsInline = true;
    dock.stage.appendChild(media);

    const conf = { ...plyrConfig(attributes), autoplay: true };

    dock.player = new Plyr(media, conf);
    dock.player.source = source;

    finishPlyr(dock.player, conf);
};

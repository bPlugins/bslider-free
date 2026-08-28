import { ownCarouselItems, sanitizeHref } from './functions';

const ANIMATED = 'animate__animated';
const PENDING = 'bsb-anim-pending';
const READY = 'bsb-anim-ready';

/** Takes off every animate.css class, so the next one starts from nothing. */
const removeAnimationClasses = (el) => {
	[...el.classList]
		.filter(name => ANIMATED === name || name.startsWith('animate__'))
		.forEach(name => el.classList.remove(name));
};

/**
 * Runs one layer's entry animation, and hands over to its loop when that finishes.
 *
 * The reflow in the middle is not optional: taking a keyframe class off and putting it back in
 * the same frame is no change at all as far as the browser is concerned, so the animation would
 * not replay when the visitor comes back to a slide. Reading `offsetWidth` forces the removal to
 * be applied before the class goes back on.
 */
const playEntry = (el, index, offset) => {
	const effect = el.dataset.bsbEntry;
	if (!effect) return;

	removeAnimationClasses(el);
	void el.offsetWidth;

	// An explicit delay wins; otherwise the layer takes its turn in the order it appears.
	if (!el.style.getPropertyValue('--bsb-anim-delay') && offset) {
		el.style.setProperty('--bsb-anim-delay', `${(index * offset).toFixed(3)}s`);
	}

	el.classList.remove(PENDING);

	el.classList.add(ANIMATED, `animate__${effect}`);

	const onEnd = () => {
		el.removeEventListener('animationend', onEnd);
		removeAnimationClasses(el);

		const loop = el.dataset.bsbLoop;
		if (loop) {
			// Held back until now because both animations want `animation-name` on this one
			// element — see the note in layerProps.js.
			const duration = el.style.getPropertyValue('--bsb-loop-duration');
			if (duration) {
				el.style.setProperty('--animate-duration', duration);
			}
			el.classList.add(ANIMATED, 'animate__infinite', `animate__${loop}`);
		}
	};

	el.addEventListener('animationend', onEnd);
};

/**
 * The layers on this slide that this slider is responsible for.
 *
 * A slide can hold another bSlider, whose own slides carry layers of their own. Those belong to
 * the inner slider — it arms and plays them as its slides come and go — so anything sitting
 * under a nested `.bsbCarousel` is skipped here rather than being animated twice, on two
 * unrelated schedules.
 */
const ownLayers = (item, selector) => [...item.querySelectorAll(selector)]
	.filter(el => el.closest('.bsbCarousel') === item.closest('.bsbCarousel'));

/** Puts a slide's layers back to their starting state, ready to animate in again. */
const arm = (item, isBackend) => {
	ownLayers(item, '[data-bsb-entry]').forEach(el => {
		removeAnimationClasses(el);
		// Never in the editor: an invisible block cannot be clicked into or typed in.
		if (!isBackend) {
			el.classList.add(PENDING);
		}
	});
};

/**
 * Wires a slider's layer animations, hover-independent click actions included.
 *
 * Framework-free on purpose. On the front end the slide markup arrives as a string and is put
 * into the page with `dangerouslySetInnerHTML`, so there are no React components behind those
 * nodes to hang effects on — everything here works through the DOM and Bootstrap's own carousel
 * events, which is also what makes the same code work unchanged in the editor.
 *
 * Returns its own teardown. `Sliders.js` disposes and rebuilds the carousel whenever the
 * slider's options change, and a listener left behind from the last one would fire twice.
 */
export const initLayerAnimations = (root, { isBackend = false } = {}) => {
	if (!root) return () => { };

	root.classList.add(READY);

	const staggerOffset = (item) => parseFloat(item?.dataset?.bsbStagger || 0) || 0;

	const enter = (item) => {
		if (!item) return;
		const offset = staggerOffset(item);
		ownLayers(item, '[data-bsb-entry]').forEach((el, index) => playEntry(el, index, offset));
	};

	// This slider's own slides only — a slide can hold another bSlider, whose slides belong to
	// that one and must not be armed, hidden or animated from out here.
	const slides = ownCarouselItems(root);

	// Bootstrap announces every slide change but says nothing about the one already on screen
	// when the page loads, so the first slide is started by hand.
	const first = slides.find(item => item.classList.contains('active')) || slides[0];
	slides.forEach(item => {
		if (item !== first) arm(item, isBackend);
	});
	const raf = requestAnimationFrame(() => enter(first));

	// Bootstrap's carousel events bubble, so a slider nested in one of these slides announces
	// every one of its own slide changes to this handler too. Only the ones this element fired
	// are this slider's to act on.
	const isOwnEvent = (e) => e.target === root;

	// `slid`, not `slide`: by then Bootstrap has finished moving the slide, so a layer animating
	// on its own axis is not also being carried sideways by the carousel underneath it.
	const onSlid = (e) => {
		if (!isOwnEvent(e)) return;
		enter(e.relatedTarget);
	};

	const onSlide = (e) => {
		if (!isOwnEvent(e)) return;
		if (e.relatedTarget) arm(e.relatedTarget, isBackend);
	};

	root.addEventListener('slid.bs.carousel', onSlid);
	root.addEventListener('slide.bs.carousel', onSlide);

	// One listener for every click action in the slider, so slides added later are covered
	// without rebinding anything.
	const onClick = (e) => {
		const el = e.target.closest('[data-bsb-click]');
		// The second test is what keeps a nested slider's clicks its own: this listener sits on
		// an ancestor of that slider too, so without it a "next slide" action inside would move
		// the outer slider as well as the one it was set on.
		if (!el || el.closest('.bsbCarousel') !== root) return;

		const action = el.dataset.bsbClick;

		if ('url' === action && el.dataset.bsbClickUrl) {
			const href = sanitizeHref(el.dataset.bsbClickUrl);
			if ('#' === href) return;
			if ('true' === el.dataset.bsbClickNewtab) {
				window.open(href, '_blank', 'noopener,noreferrer');
			} else {
				window.location.href = href;
			}
			return;
		}

		if ('scroll' === action && el.dataset.bsbClickSelector) {
			try {
				// A hand-typed selector can be anything at all, and an invalid one throws —
				// which would take the whole handler down with it, click actions included.
				document.querySelector(el.dataset.bsbClickSelector)
					?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} catch (err) {
				return;
			}
			return;
		}

		if ('next' === action || 'prev' === action) {
			// eslint-disable-next-line no-undef
			bootstrap?.Carousel?.getInstance(root)?.[action]();
		}
	};

	// Keyboard reach is added here rather than baked into the saved markup: a visitor whose
	// scripts never ran should not be offered a button that cannot do anything.
	const clickables = [...root.querySelectorAll('[data-bsb-click]')];
	if (!isBackend) {
		clickables.forEach(el => {
			el.setAttribute('role', 'button');
			el.setAttribute('tabindex', '0');
		});
		root.addEventListener('click', onClick);
	}

	const onKey = (e) => {
		if (('Enter' === e.key || ' ' === e.key) && e.target.closest('[data-bsb-click]')) {
			e.preventDefault();
			onClick(e);
		}
	};
	if (!isBackend) root.addEventListener('keydown', onKey);

	return () => {
		cancelAnimationFrame(raf);
		root.removeEventListener('slid.bs.carousel', onSlid);
		root.removeEventListener('slide.bs.carousel', onSlide);
		root.removeEventListener('click', onClick);
		root.removeEventListener('keydown', onKey);
		root.classList.remove(READY);
		root.querySelectorAll(`.${PENDING}`).forEach(el => el.classList.remove(PENDING));
	};
};

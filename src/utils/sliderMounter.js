/**
 * A way for a slider to ask that sliders inside its slides be started, without importing the
 * file that knows how.
 *
 * `view.js` owns the mounting — it holds the React root and the whole front-end tree — and it
 * imports `Sliders.js` on the way there. `Sliders.js` is where a slider-in-a-slider is first
 * seen, so it is the one that needs to ask. Importing back the other way would close that
 * circle, and the two modules would each be half-initialised when the other first read from it.
 *
 * So `view.js` leaves its function here on the way past, and `Sliders.js` picks it up. Anything
 * that runs before that has happened simply finds nothing to call, which is correct: there are
 * no slides on the page yet either.
 */
let mount = null;

/** Called once by view.js, with the function that mounts every unmounted slider under a scope. */
export const setSliderMounter = (fn) => {
	mount = fn;
};

/** Starts any slider inside `scope` that is not already running. */
export const mountSlidersIn = (scope) => {
	mount?.(scope);
};

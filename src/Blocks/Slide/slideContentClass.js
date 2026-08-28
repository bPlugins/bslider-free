/**
 * The class list for a slide's content wrapper.
 *
 * Shared by `edit.js` and `save.js` for the same reason `slideStyles` is: a slide is a static
 * block, so what `save` writes has to come back identical on every reload or WordPress calls the
 * block invalid. Two hand-written class lists drift; one function cannot.
 *
 * Wrapping is the default and emits no class of its own, so every slide saved before this
 * setting existed keeps producing byte-identical markup — `wordWrap` defaults to `true` and a
 * block whose attribute was never written reads as `true` too.
 */
export const slideContentClass = ({ wordWrap = true }) =>
	['bsb-slide-content', false === wordWrap && 'bsb-nowrap'].filter(Boolean).join(' ');

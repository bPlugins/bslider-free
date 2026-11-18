/** Arrow entrance (style.scss): arrows hidden once armed, shown the first time the slider is in view. */
export const armArrowReveal = (el) => {
	if (!el?.dataset.bsbArrowAnim || 'hover' === el.dataset.bsbArrowOn || el.classList.contains('bsb-arrows-in')) {
		return;
	}

	if (!('IntersectionObserver' in window)) {
		return;
	}

	el.classList.add('bsb-arrows-armed');

	const observer = new IntersectionObserver((entries) => {
		if (entries.some(entry => entry.isIntersecting)) {
			observer.disconnect();
			// Delay so the slider's own first paint does not swallow the transition.
			setTimeout(() => el.classList.add('bsb-arrows-in'), 150);
		}
	}, { threshold: 0.3 });

	observer.observe(el);
};

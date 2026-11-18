/** First-view reveal for the whole slider: armed at mount, played once when it scrolls into view (style.scss). */
export const armFirstReveal = (el) => {
	if (!el?.dataset.bsbReveal || el.classList.contains('bsb-revealed')) {
		return;
	}

	if (!('IntersectionObserver' in window)) {
		el.classList.add('bsb-revealed');
		return;
	}

	el.classList.add('bsb-reveal-armed');

	const observer = new IntersectionObserver((entries) => {
		if (entries.some(entry => entry.isIntersecting)) {
			observer.disconnect();
			el.classList.add('bsb-revealed');
		}
	}, { threshold: 0.15 });

	observer.observe(el);
};

import { __ } from '@wordpress/i18n';

/** Cover block background videos in a slide: play on their slide only, sound and play/pause buttons (CoverVideoPanel). */

const svg = (path) => `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="${path}"/></svg>`;

const ICONS = {
	muted: 'M3 9v6h4l5 5V4L7 9H3zm13.59 3 2.7-2.7-1.06-1.06-2.7 2.7-2.7-2.7-1.06 1.06 2.7 2.7-2.7 2.7 1.06 1.06 2.7-2.7 2.7 2.7 1.06-1.06-2.7-2.7z',
	sound: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.47 4.47 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z',
	play: 'M8 5v14l11-7z',
	pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
};

const videoOf = (cover) => cover?.querySelector(':scope > video.wp-block-cover__video-background');

const paint = (bar, video) => {
	const sound = bar.querySelector('.bsbCvSound');
	const play = bar.querySelector('.bsbCvPlay');

	if (sound) {
		const on = !video.muted;

		sound.innerHTML = svg(on ? ICONS.sound : ICONS.muted);
		sound.setAttribute('aria-label', on ? __('Mute video', 'b-slider') : __('Unmute video', 'b-slider'));
		sound.setAttribute('aria-pressed', String(on));
	}

	if (play) {
		const playing = !video.paused;

		play.innerHTML = svg(playing ? ICONS.pause : ICONS.play);
		play.setAttribute('aria-label', playing ? __('Pause video', 'b-slider') : __('Play video', 'b-slider'));
	}
};

/** Adds the buttons to each cover that asks for them; returns a teardown. */
export const setupCoverVideos = (covers) => {
	const undo = [];

	covers.forEach(cover => {
		const video = videoOf(cover);

		if (!video || !cover.matches('.bsb-cv-sound, .bsb-cv-play') || cover.querySelector(':scope > .bsbCvBar')) {
			return;
		}

		const doc = cover.ownerDocument;
		const bar = doc.createElement('div');
		bar.className = 'bsbCvBar swiper-no-swiping';

		[['bsb-cv-sound', 'bsbCvSound'], ['bsb-cv-play', 'bsbCvPlay']].forEach(([flag, name]) => {
			if (cover.classList.contains(flag)) {
				const button = doc.createElement('button');
				button.type = 'button';
				button.className = name;
				bar.appendChild(button);
			}
		});

		// Its own clicks only: a slide link, lightbox or swipe must not fire as well.
		const onClick = (e) => {
			const button = e.target.closest('button');

			e.preventDefault();
			e.stopPropagation();

			if (button?.classList.contains('bsbCvSound')) {
				video.muted = !video.muted;

				if (!video.muted && video.paused) {
					video.play()?.catch(() => { });
				}
			} else if (button?.classList.contains('bsbCvPlay')) {
				if (video.paused) {
					video.play()?.catch(() => { });
				} else {
					video.pause();
				}
			}
		};
		const stop = (e) => e.stopPropagation();
		const repaint = () => paint(bar, video);

		bar.addEventListener('click', onClick);
		bar.addEventListener('pointerdown', stop);
		bar.addEventListener('mousedown', stop);
		['play', 'pause', 'volumechange'].forEach(type => video.addEventListener(type, repaint));

		video.after(bar);
		repaint();

		undo.push(() => {
			['play', 'pause', 'volumechange'].forEach(type => video.removeEventListener(type, repaint));
			bar.remove();
		});
	});

	return () => undo.forEach(fn => fn());
};

/** A slide leaving (or waiting): its "slide only" videos stop at the start, unmuted ones go quiet. */
export const resetCoverVideos = (covers) => {
	covers.forEach(cover => {
		const video = videoOf(cover);

		if (!video) return;

		if (cover.classList.contains('bsb-cv-slide')) {
			video.pause();

			try {
				video.currentTime = 0;
			} catch (e) {
				// Not loaded yet: it is at the start anyway.
			}
		}

		if (cover.classList.contains('bsb-cv-sound')) {
			video.muted = true;
		}
	});
};

/** A slide showing: its "slide only" videos play. */
export const playCoverVideos = (covers) => {
	covers.forEach(cover => {
		const video = videoOf(cover);

		if (video && cover.classList.contains('bsb-cv-slide') && video.paused) {
			video.play()?.catch(() => { });
		}
	});
};

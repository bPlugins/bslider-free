import { useState } from '@wordpress/element';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import apiFetch from '@wordpress/api-fetch';
import { sanitizeSlides, buildSlides } from '../utils/aiSlides';

/** Whether any slide already holds blocks somebody added. */
const hasOwnContent = slides => slides.some(slide => (slide?.innerBlocks || []).length > 0);

/** Writes whole slides with AI into a Blocks slider; asks before touching slides with content. */
const useAiSlides = ({ clientId, onPlaced }) => {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');
	const [pending, setPending] = useState(null);

	const slides = useSelect(select => select(blockEditorStore).getBlocks(clientId), [clientId]);
	const { replaceInnerBlocks, insertBlocks } = useDispatch(blockEditorStore);

	const place = (blocks, mode) => {
		if ('add' === mode) {
			insertBlocks(blocks, slides.length, clientId, false);
		} else {
			replaceInnerBlocks(clientId, blocks, false);
		}

		setPending(null);
		onPlaced?.(blocks.length);
		setMessage(sprintf(
			/* translators: %d: how many slides were made. */
			_n('Made %d slide. Edit the text right on the slide, or undo with Ctrl+Z.', 'Made %d slides. Edit the text right on the slide, or undo with Ctrl+Z.', blocks.length, 'b-slider'),
			blocks.length
		));
	};

	const create = async (prompt, count) => {
		const brief = (prompt || '').trim();

		if (busy) {
			return;
		}

		if (!brief) {
			setError(__('Describe what the slider is for first.', 'b-slider'));
			return;
		}

		setBusy(true);
		setError('');
		setMessage('');
		setPending(null);

		try {
			const res = await apiFetch({ path: '/bsb/v1/ai/slides', method: 'POST', data: { prompt: brief, count } });
			const clean = sanitizeSlides(res?.slides, count);

			if (!clean.slides.length) {
				setError(__('The AI did not return anything usable. Try describing the slider in a little more detail.', 'b-slider'));
				return;
			}

			const blocks = buildSlides(clean);

			// Empty slides are replaced; slides with content wait for the user's choice.
			if (hasOwnContent(slides)) {
				setPending(blocks);
			} else {
				place(blocks, 'replace');
			}
		} catch (err) {
			setError(err?.message || __('Could not reach the AI service.', 'b-slider'));
		} finally {
			setBusy(false);
		}
	};

	return {
		create,
		busy,
		error,
		message,
		pending,
		replace: () => pending && place(pending, 'replace'),
		append: () => pending && place(pending, 'add'),
		cancel: () => setPending(null),
		clear: () => { setError(''); setMessage(''); },
	};
};

export default useAiSlides;

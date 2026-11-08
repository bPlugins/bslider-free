import { __, sprintf, _n } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button, TextareaControl, Spinner, Notice } from '@wordpress/components';
import HelpTip from '../../../Panel/HelpTip';
import { linksIn, isLoadable, isUntouched, slideFrom, MAX_LINKS } from '../../../../utils/imageLinks';

/** Many slides at once, from a Media Library pick or pasted links (Image source only). */
const ImageLinksPanel = ({ attributes, setAttributes }) => {
	const [text, setText] = useState('');
	const [checking, setChecking] = useState(false);
	const [report, setReport] = useState(null);

	const found = linksIn(text);

	// Sample slides are replaced; a slider with any slide of the user's own is added to.
	const addSlides = pictures => {
		const current = attributes?.sliders || [];
		const next = [...(isUntouched(current) ? [] : current), ...pictures.map(slideFrom)];

		setAttributes({ sliders: next });
	};

	const pick = media => {
		const items = (Array.isArray(media) ? media : [media]).filter(item => item?.url);

		if (checking || !items.length) {
			return;
		}

		setReport({ added: items.length, broken: [], cut: 0 });
		addSlides(items);
	};

	// `wp.media` directly: `<MediaUpload multiple>` opens single-select here; 'add' makes each click add to the pick.
	const openLibrary = () => {
		const media = window.wp?.media;

		if (checking || !media) {
			return;
		}

		const frame = media({
			title: __('Choose images for the slides', 'b-slider'),
			button: { text: __('Create slides', 'b-slider') },
			library: { type: 'image' },
			multiple: 'add',
		});

		frame.on('select', () => pick(frame.state().get('selection').toJSON()));
		frame.open();
	};

	// Each link is loaded first; one that does not load is left out and named.
	const create = async () => {
		if (checking || !found.length) {
			return;
		}

		const links = found.slice(0, MAX_LINKS);

		setChecking(true);
		setReport(null);

		const loads = await Promise.all(links.map(isLoadable));
		const good = links.filter((_, i) => loads[i]);
		const broken = links.filter((_, i) => !loads[i]);

		setChecking(false);
		setReport({ added: good.length, broken, cut: found.length - links.length });

		if (!good.length) {
			return;
		}

		setText('');
		addSlides(good);
	};

	if ('image' !== (attributes?.sourceType || 'image')) {
		return null;
	}

	return <div className='bsbAiCopy'>
		{window.wp?.media && <Button variant='primary' onClick={openLibrary} disabled={checking} className='bsbPickMedia'>
			{__('Choose images from Media Library', 'b-slider')}
		</Button>}

		<TextareaControl
			label={<>
				{__('Or paste image links', 'b-slider')}
				<HelpTip label={__('About image links', 'b-slider')}>
					{__('Each picture becomes a slide. Links that do not load as images are left out.', 'b-slider')}
				</HelpTip>
			</>}
			value={text}
			onChange={val => { setText(val); setReport(null); }}
			placeholder={__('Paste image links, one per line', 'b-slider')}
			rows={4}
			disabled={checking}
		/>

		<Button variant='secondary' className='mt10' onClick={create} disabled={checking || !found.length}>
			{checking && <><Spinner /> {__('Checking links…', 'b-slider')}</>}
			{!checking && (found.length
				? sprintf(
					/* translators: %d: how many image links were found in the box. */
					_n('Create %d slide', 'Create %d slides', Math.min(found.length, MAX_LINKS), 'b-slider'),
					Math.min(found.length, MAX_LINKS)
				)
				: __('Create slides', 'b-slider'))}
		</Button>

		{report && report.added > 0 && <Notice status='success' isDismissible={false} className='mt10'>
			{sprintf(
				/* translators: %d: how many slides were made. */
				_n('Created %d slide.', 'Created %d slides.', report.added, 'b-slider'),
				report.added
			)}
		</Notice>}

		{report && report.broken.length > 0 && <Notice status='warning' isDismissible={false} className='mt10'>
			{sprintf(
				/* translators: %d: how many links could not be loaded as images. */
				_n('%d link did not load as an image and was left out:', '%d links did not load as images and were left out:', report.broken.length, 'b-slider'),
				report.broken.length
			)}
			<ul className='bsbLinkList'>{report.broken.map(url => <li key={url}>{url}</li>)}</ul>
		</Notice>}

		{report && report.cut > 0 && <Notice status='warning' isDismissible={false} className='mt10'>
			{sprintf(
				/* translators: 1: the most links one paste takes, 2: how many were not used. */
				__('Only the first %1$d links were used; %2$d more were left out.', 'b-slider'),
				MAX_LINKS,
				report.cut
			)}
		</Notice>}
	</div>;
};

export default ImageLinksPanel;

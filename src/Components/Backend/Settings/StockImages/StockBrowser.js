import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button, ExternalLink, Notice, SearchControl, SelectControl, Spinner } from '@wordpress/components';
import useStockSearch from '../../../../hooks/useStockSearch';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import './style.scss';

const PIXABAY = 'https://pixabay.com/';

const LICENSES = {
	openverse: { url: 'https://creativecommons.org/publicdomain/zero/1.0/', label: 'CC0 / Public Domain' },
	pixabay: { url: 'https://pixabay.com/service/license-summary/', label: 'Pixabay Content License' },
};

const SOURCES = [
	{ value: 'openverse', label: 'Openverse' },
	{ value: 'unsplash', label: 'Unsplash', pro: true },
	{ value: 'pixabay', label: 'Pixabay' },
];

const ORIENTATIONS = [
	{ value: '', label: __('Any orientation', 'b-slider') },
	{ value: 'landscape', label: __('Landscape', 'b-slider') },
	{ value: 'portrait', label: __('Portrait', 'b-slider') },
	{ value: 'square', label: __('Square', 'b-slider') },
];

const COLORS = [
	{ value: '', label: __('Any colour', 'b-slider') },
	{ value: 'grayscale', label: __('Black and white', 'b-slider') },
	{ value: 'black', label: __('Black', 'b-slider') },
	{ value: 'white', label: __('White', 'b-slider') },
	{ value: 'gray', label: __('Grey', 'b-slider') },
	{ value: 'red', label: __('Red', 'b-slider') },
	{ value: 'orange', label: __('Orange', 'b-slider') },
	{ value: 'yellow', label: __('Yellow', 'b-slider') },
	{ value: 'green', label: __('Green', 'b-slider') },
	{ value: 'teal', label: __('Teal', 'b-slider') },
	{ value: 'blue', label: __('Blue', 'b-slider') },
	{ value: 'purple', label: __('Purple', 'b-slider') },
	{ value: 'pink', label: __('Pink', 'b-slider') },
	{ value: 'brown', label: __('Brown', 'b-slider') },
];

const StockBrowser = ({ onImported, multiple = false }) => {
	const [query, setQuery] = useState('');
	const [from, setFrom] = useState('openverse');
	const [importing, setImporting] = useState('');
	const [importError, setImportError] = useState('');
	const [added, setAdded] = useState([]);
	const { items, loading, error, term, search, loadMore, hasMore } = useStockSearch();

	const locked = 'unsplash' === from;

	useEffect(() => {
		if (locked) {
			search('', from);
			return;
		}
		const timer = setTimeout(() => search(query, from), 500);
		return () => clearTimeout(timer);
	}, [query, from]);

	const pick = async item => {
		if (importing) {
			return;
		}

		setImporting(item.id);
		setImportError('');

		try {
			const media = await apiFetch({ path: '/bsb/v1/stock/import', method: 'POST', data: { id: item.id, source: from } });
			await onImported(media);
			setAdded(prev => [...prev, `${from}:${item.id}`]);
		} catch (e) {
			setImportError(e?.message || __('The image could not be added to the Media Library.', 'b-slider'));
		}

		setImporting('');
	};

	// translators: %s: search term.
	const noResults = sprintf(__('No photos found for “%s”. Try another word.', 'b-slider'), term);

	return <div className='bsbStockBrowser'>
		<div className='bsbStockTop'>
			<div className='bsbStockBar'>
				<div className='bsbStockSources' role='group' aria-label={__('Photo source', 'b-slider')}>
					{SOURCES.map(source => <Button
						key={source.value}
						size='compact'
						variant={from === source.value ? 'primary' : 'secondary'}
						aria-pressed={from === source.value}
						onClick={() => setFrom(source.value)}
						disabled={!!importing}
					>
						{source.label}
						{source.pro && <span className='bsbStockPro'>{__('Pro', 'b-slider')}</span>}
					</Button>)}
				</div>

				<div className='bsbStockFilters'>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize={false}
						size='compact'
						label={__('Orientation', 'b-slider')}
						hideLabelFromVision
						value=''
						options={ORIENTATIONS}
						onChange={() => {}}
						disabled
					/>
					<SelectControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize={false}
						size='compact'
						label={__('Colour', 'b-slider')}
						hideLabelFromVision
						value=''
						options={COLORS}
						onChange={() => {}}
						disabled
					/>
					<span className='bsbStockPro'>{__('Pro', 'b-slider')}</span>
				</div>
			</div>

			<SearchControl
				__nextHasNoMarginBottom
				value={query}
				onChange={setQuery}
				placeholder={__('Search free photos, e.g. mountain, coffee, office', 'b-slider')}
			/>
		</div>

		{locked && <ProNotice className='bsbStockNotice' features={PRO_FEATURES.stockUnsplash} />}

		{error && <Notice status='error' isDismissible={false} className='bsbStockNotice'>{error}</Notice>}
		{importError && <Notice status='error' isDismissible={false} className='bsbStockNotice'>{importError}</Notice>}

		{!locked && !term && !loading && <p className='bsbStockEmpty'>{__('Type a word to find free photos you can use anywhere.', 'b-slider')}</p>}

		{term && !loading && !error && !items.length && <p className='bsbStockEmpty'>{noResults}</p>}

		{!!items.length && <div className='bsbStockGrid'>
			{items.map(item => {
				const isImporting = importing === item.id;
				const isAdded = added.includes(`${from}:${item.id}`);
				// translators: %1$s: photo title, %2$s: photographer name.
				const label = item.creator ? sprintf(__('%1$s by %2$s', 'b-slider'), item.title || __('Photo', 'b-slider'), item.creator) : (item.title || __('Photo', 'b-slider'));
				// translators: %s: photo title and photographer.
				const useLabel = sprintf(__('Use %s', 'b-slider'), label);

				return <div key={item.id} className='bsbStockCell'>
					<button
						type='button'
						className={`bsbStockItem${isImporting ? ' isImporting' : ''}${isAdded ? ' isAdded' : ''}`}
						onClick={() => pick(item)}
						disabled={!!importing || (multiple && isAdded)}
						title={label}
						aria-label={useLabel}
					>
						<img src={item.thumbnail} alt='' loading='lazy' />
						{isImporting && <span className='bsbStockBusy'><Spinner /> {__('Adding…', 'b-slider')}</span>}
						{multiple && isAdded && <span className='bsbStockBusy'>✓ {__('Added', 'b-slider')}</span>}
					</button>

					{item.creator && <span className='bsbStockBy'>
						{item.creatorUrl ? <a href={item.creatorUrl} target='_blank' rel='noopener noreferrer'>{item.creator}</a> : item.creator}
					</span>}
				</div>;
			})}
		</div>}

		{loading && <div className='bsbStockLoading'><Spinner /></div>}

		{hasMore && !loading && !!items.length && <div className='bsbStockMore'>
			<Button variant='secondary' onClick={loadMore} disabled={!!importing}>{__('Load more', 'b-slider')}</Button>
		</div>}

		{!locked && <p className='bsbStockCredit'>
			{'pixabay' === from
				? <>{__('Images from', 'b-slider')} <ExternalLink href={PIXABAY}>Pixabay</ExternalLink>.</>
				: <>{__('Public domain photos (CC0 / PDM) from', 'b-slider')} <ExternalLink href='https://openverse.org/'>Openverse</ExternalLink>.</>}
			{' '}{multiple ? __('Click photos to add them to your Media Library and to this pick.', 'b-slider') : __('Clicking a photo adds it to your Media Library and selects it.', 'b-slider')}
		</p>}

		{!locked && <p className='bsbStockLicense'>
			{__('Free to use, also for commercial work. No credit needed.', 'b-slider')} <ExternalLink href={LICENSES[from].url}>{LICENSES[from].label}</ExternalLink>
		</p>}
	</div>;
};

export default StockBrowser;

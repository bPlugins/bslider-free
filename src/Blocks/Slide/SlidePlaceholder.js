import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { Inserter, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { heading, image, button as buttonIcon, columns, plus } from '@wordpress/icons';

/**
 * What an empty slide offers instead of a bare `+`.
 *
 * The `+` was honest but silent: it opened the whole block picker, which is a long list to read
 * when the answer is nearly always one of four things. A slide is opened with a headline, a
 * picture, a call to action, or a two-column split — so those four are one click each, and the
 * picker is still there behind "Browse all" for everything else.
 *
 * Shown only while the slide is empty. The moment anything is in it, this gets out of the way and
 * the ordinary inserter takes over, which is what an author expects once they are working.
 */

/** The four openings a slide is nearly always built from, and what each inserts. */
const STARTERS = [
	{
		key: 'heading',
		icon: heading,
		label: __('Heading', 'b-slider'),
		blocks: () => [createBlock('core/heading', { level: 2, placeholder: __('Your headline', 'b-slider') })],
	},
	{
		key: 'image',
		icon: image,
		label: __('Image', 'b-slider'),
		blocks: () => [createBlock('core/image')],
	},
	{
		key: 'button',
		icon: buttonIcon,
		label: __('Button', 'b-slider'),
		// A button lives inside a Buttons wrapper — inserting the inner one alone leaves a block
		// that cannot be aligned or given a second button beside it.
		blocks: () => [createBlock('core/buttons', {}, [createBlock('core/button')])],
	},
	{
		key: 'columns',
		icon: columns,
		label: __('Two columns', 'b-slider'),
		blocks: () => [createBlock('core/columns', {}, [
			createBlock('core/column'),
			createBlock('core/column'),
		])],
	},
];

const SlidePlaceholder = ({ clientId }) => {
	const { insertBlocks, selectBlock } = useDispatch(blockEditorStore);

	const hasInner = useSelect(
		select => (select(blockEditorStore).getBlocks(clientId) || []).length > 0,
		[clientId]
	);

	if (hasInner) {
		return null;
	}

	const start = (starter) => {
		const blocks = starter.blocks();

		insertBlocks(blocks, undefined, clientId);

		// Land the caret in what was just inserted, so a heading can be typed into straight away
		// rather than needing a second click to find it.
		if (blocks[0]) {
			selectBlock(blocks[0].clientId);
		}
	};

	return <div className="bsbSlideStart">
		<p className="bsbSlideStartTitle">{__('Start building this slide', 'b-slider')}</p>
		<p className="bsbSlideStartHint">{__('Pick something to begin with, or browse every block.', 'b-slider')}</p>

		<div className="bsbSlideStartRow">
			{STARTERS.map(starter => <Button
				key={starter.key}
				className="bsbSlideStartBtn"
				icon={starter.icon}
				onClick={() => start(starter)}
			>
				{starter.label}
			</Button>)}

			{/* The way to everything else. `Inserter` is the editor's own, so the panel it opens
			    is the full block list with its search, its categories and its patterns — the four
			    above are a shortcut past it, not a replacement for it. `isAppender` with a
			    `rootClientId` is what tells it to insert into this slide rather than beside it. */}
			<Inserter
				rootClientId={clientId}
				isAppender
				renderToggle={({ onToggle, disabled }) => <Button
					className="bsbSlideStartBtn isBrowse"
					icon={plus}
					onClick={onToggle}
					disabled={disabled}
					label={__('Browse all blocks', 'b-slider')}
				>
					{__('Browse all', 'b-slider')}
				</Button>}
			/>
		</div>
	</div>;
};

export default SlidePlaceholder;

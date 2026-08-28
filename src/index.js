import { registerBlockType } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import metadata from './block.json';
import './editor.scss';
import Edit from './Components/Backend/Edit';
import { blockIcon } from './utils/icons';

// block register
registerBlockType(metadata, {
	icon: {
		src: blockIcon,
	},
	edit: Edit,
	// The block is fully PHP-rendered for every other sourceType, but a `blocks` slider's
	// `bsb/slide` InnerBlocks have to be serialised into post_content to persist at all.
	save: (props) => props.attributes.sourceType === 'blocks' ? <InnerBlocks.Content /> : null
});
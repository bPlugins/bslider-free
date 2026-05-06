import { registerBlockType } from '@wordpress/blocks';
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
	save: () => null
});
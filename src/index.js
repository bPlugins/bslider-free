import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import './editor.scss';
import Edit from './Components/Backend/Edit';
import { registerGlobalSidebar } from './Components/Backend/GlobalSidebar';
import { blockIcon } from './utils/icons';

// block register 
registerBlockType(metadata, {
	icon: {
		src: blockIcon,
	},
	edit: Edit,
	save: () => null
});

// The site-wide settings panel, reached by bSlider's icon in the editor's top toolbar. Registered
// after the block and guarded inside, so an editor without a plugin sidebar cannot stop the block
// itself from registering.
registerGlobalSidebar();
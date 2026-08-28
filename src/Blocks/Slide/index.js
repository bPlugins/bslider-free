import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import Edit from './edit';
import save from './save';
// Installs the animation/hover/click controls onto the blocks a slide can hold.
import './extensions';

registerBlockType(metadata, {
	edit: Edit,
	save,
});

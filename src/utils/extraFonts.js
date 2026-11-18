import fontLists from '../../../bpl-tools/Components/Typography/fontLists';

/** Google fonts the shared list lacks, added in alphabetical place; bpl-tools stays untouched. */
const EXTRA_FONTS = [
	{
		family: 'Be Vietnam Pro',
		variants: [100, '100i', 200, '200i', 300, '300i', 400, '400i', 500, '500i', 600, '600i', 700, '700i', 800, '800i', 900, '900i'],
		category: 'sans-serif'
	},
	{
		family: 'Kaisei Tokumin',
		variants: [400, 500, 700, 800],
		category: 'serif'
	},
];

EXTRA_FONTS.forEach(font => {
	if (fontLists.some(({ family }) => family === font.family)) {
		return;
	}

	const at = fontLists.findIndex(({ family }) => 'Default' !== family && family.localeCompare(font.family) > 0);
	fontLists.splice(-1 === at ? fontLists.length : at, 0, font);
});

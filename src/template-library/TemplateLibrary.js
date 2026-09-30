import { __ } from '@wordpress/i18n';
import { useState, useRef, useLayoutEffect } from '@wordpress/element';

import BPLTemplateLibrary from '../../../bpl-tools/TemplateLibrary';

import { blockIcon } from '../utils/icons';

/**
 * bSlider's Template Library — the modal behind the editor toolbar's button.
 *
 * Everything inside the modal is `bpl-tools/TemplateLibrary`, shared with the other bPlugins block
 * plugins. This file is the wiring: branding, the endpoint names, and the licence it gates Pro
 * cards with. The endpoints themselves are in includes/Templates/Templates.php, which proxies
 * templates.bplugins.com.
 *
 * `prefix` drives the Favorites feature on the shared side — it builds both the option name
 * (`bsbFavoritesTemplates`) and the AJAX action (`bsb_template_favorites`) from it, so it has to
 * match what Templates.php registers.
 *
 * Both globals below are printed by `enqueueTemplateLibrary()` in b-slider.php.
 */

/**
 * The button on its own, until somebody asks for the library.
 *
 * The shared component starts fetching the moment it mounts: `useTemplates` passes `true` as
 * `useWPAjax`'s third argument, and `useTemplatesMain` and `useAccessCounts` follow, so three or
 * four requests go out whether or not the modal is ever opened. Each is proxied by this plugin to
 * templates.bplugins.com, each occupies a PHP worker while it waits, and a slow or unreachable
 * catalog server therefore costs every editor load — which is what "the editor got slow" turned out
 * to be. Nothing is fetched now until the button is pressed.
 *
 * Rendering it here rather than inside the shared component keeps that component untouched for the
 * plugins already using it. The markup and class are copied from it so the two are
 * indistinguishable: this button is replaced by the real one the moment it is clicked, and a change
 * of shape at that instant would read as a glitch.
 */
const TemplateLibrary = () => {
	const [opened, setOpened] = useState(false);

	if (!opened) {
		return <button className='bPlTemplatesButton' onClick={() => setOpened(true)}>
			{blockIcon}
			{__('Template Library', 'b-slider')}
		</button>;
	}

	return <Library />;
};

/**
 * The real thing, mounted only once it has been asked for.
 *
 * The shared component owns its own `show` state and starts closed, and it takes no prop to open
 * it, so the first press would otherwise mount the modal and leave it shut — the reader would have
 * to click the same button twice. The effect presses the real button for them, once, as soon as it
 * exists. A layout effect rather than a plain one, so it runs before the browser paints and the
 * placeholder is never seen to be replaced.
 */
const Library = () => {
	const nonce = typeof bsbtemplatenonce !== 'undefined' ? bsbtemplatenonce : '';
	const isPremium = typeof bsbpipecheck !== 'undefined' ? Boolean(bsbpipecheck) : false;
	const ref = useRef();

	useLayoutEffect(() => {
		ref.current?.querySelector('.bPlTemplatesButton')?.click();
	}, []);

	return <div ref={ref} style={{ display: 'contents' }}><BPLTemplateLibrary
		prefix='bsb'
		logo={blockIcon}
		buttonLabel={__('Template Library', 'b-slider')}
		modalTitle={__('Templates Library', 'b-slider')}

		// One tab. A bSlider template is always a single slider block, never a whole page, and the
		// shared Modal hides the tab strip when it is given one type.
		types={['patterns']}
		perPage={9}

		pricingUrl='https://bplugins.com/products/b-slider/pricing'

		ajaxActionMain='bsb_templates_main'
		ajaxActionTemplates='bsb_templates'
		ajaxActionImport='bsb_template_import'
		ajaxActionCounts='bsb_template_counts'

		nonce={nonce}
		isPremium={isPremium}
	/></div>;
};

export default TemplateLibrary;

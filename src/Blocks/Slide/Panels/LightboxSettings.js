import { __ } from '@wordpress/i18n';
import { RangeControl, SelectControl, ToggleControl, __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { ColorControl } from '../../../../../bpl-tools/Components/ColorControl/ColorControl';
import Label from '../../../../../bpl-tools/Components/Label/Label';
import Typography from '../../../../../bpl-tools/Components/Typography/Typography';
/**
 * Everything the lightbox looks like, as a body that two panels can host.
 *
 * **Why it is its own component.** These controls have one home per source type. For every source
 * but `blocks` that is the slider's own Lightbox panel, where the picture being clicked is the
 * slider's. A `blocks` slider has no picture of its own — its lightbox exists only because some
 * layer was given "On click → Open Lightbox" — so the settings belong beside that dropdown, in
 * the layer's Hover & Click panel, and the slider-level panel is hidden for that source.
 *
 * Both hosts write the same place: `bsb/slider`'s `lightbox` attribute. See `useSliderLightbox`
 * for why the storage stays up there even when the controls are down here.
 *
 * `value`/`onChange` rather than `attributes`/`setAttributes`, because the layer host reaches the
 * slider through a dispatch rather than its own setter. `sourceType` only words the caption
 * options.
 *
 * The Premium half of this panel — glass, button styling, max width/height and gallery loop — is
 * absent rather than locked, which is how the rest of this build handles a Pro control.
 * `PRO_FEATURES.lightbox` is what names them, and the host renders that notice.
 */
const LightboxSettings = ({ lightbox = {}, setLightbox, sourceType, showCaptionCustom = true, captionTitleLabel: titleLabelProp }) => {
	/* Worked out here rather than as a destructuring default, which cannot see `sourceType`.
	   `undefined` means "the caller did not say", and the wording follows the source as it always
	   has; `null` is the caller deliberately dropping the option. */
	const captionTitleLabel = undefined === titleLabelProp
		? ('posts' === sourceType
			? __('Post title', 'b-slider')
			: 'woo' === sourceType
				? __('Product title', 'b-slider')
				: __('Slide title', 'b-slider'))
		: titleLabelProp;

	return <>
	<ToggleControl
		className='mt10'
		label={__('Counter', 'b-slider')}
		checked={lightbox?.counter !== false}
		onChange={val => setLightbox({ counter: val })}
	/>
	<ToggleControl
		className='mt10'
		label={__('Thumbnail strip', 'b-slider')}
		checked={lightbox?.thumbs !== false}
		onChange={val => setLightbox({ thumbs: val })}
	/>
	<ToggleControl
		className='mt10'
		label={__('Zoom', 'b-slider')}
		checked={lightbox?.zoom !== false}
		onChange={val => setLightbox({ zoom: val })}
	/>
	<ToggleControl
		className='mt10'
		label={__('Slideshow', 'b-slider')}
		checked={lightbox?.slideshow !== false}
		onChange={val => setLightbox({ slideshow: val })}
	/>
	<ToggleControl
		className='mt10'
		label={__('Fullscreen', 'b-slider')}
		checked={lightbox?.fullscreen !== false}
		onChange={val => setLightbox({ fullscreen: val })}
	/>

	{/* These two default off, where the five above default on — the others were already showing
	    before they became switches, so defaulting them off would take something away; these have
	    never shown, so defaulting them on would add buttons to every lightbox. */}
	<ToggleControl
		className='mt10'
		label={__('Rotate & Flip', 'b-slider')}
		checked={!!lightbox?.rotate}
		onChange={val => setLightbox({ rotate: val })}
	/>
	<ToggleControl
		className='mt10'
		label={__('Download', 'b-slider')}
		checked={!!lightbox?.download}
		onChange={val => setLightbox({ download: val })}
	/>

	{/**
	  * The line under the picture, and where it comes from.
	  *
	  * `none` by default, so no existing lightbox gains a caption on update — and the off state is
	  * the `data-caption` attribute being absent rather than empty, since Fancybox renders the
	  * caption element for an empty one too.
	  *
	  * Named for what the slide actually is: a post slide's title is the post's, a product slide's
	  * is the product's. Same `title` value either way — only the wording changes.
	  */}
	<SelectControl
		className='mt10'
		label={__('Caption', 'b-slider')}
		value={lightbox?.caption || 'none'}
		options={[
			{ label: __('None', 'b-slider'), value: 'none' },
			{ label: __('Image caption', 'b-slider'), value: 'image' },
			/* Named for what the slide actually is: a post slide's title is the post's, a product
			   slide's is the product's. Same `title` value either way — the renderers already
			   resolve it per source — only the wording changes.

			   Left out where the caller passes `null`: a `blocks` slide is a block tree and has no
			   title string of its own, so there would be nothing for `title` to resolve to. */
			...(null === captionTitleLabel ? [] : [{ label: captionTitleLabel, value: 'title' }])
		]}
		onChange={val => setLightbox({ caption: val })}
	/>

	{/* Only where there is a caption to design. Shown with `None` selected these would be styling
	    something the visitor never sees. */}
	{'none' !== (lightbox?.caption || 'none') && <>
		<ColorControl
			className='mt10 mb20'
			label={__('Caption Color', 'b-slider')}
			value={lightbox?.captionColor}
			onChange={val => setLightbox({ captionColor: val })}
		/>

		<ToggleControl
			className='mt10'
			label={__('Caption Background', 'b-slider')}
			checked={!!lightbox?.hasCaptionBg}
			onChange={val => setLightbox({ hasCaptionBg: val })}
		/>

		{lightbox?.hasCaptionBg && <ColorControl
			className='mt10 mb20'
			label={__('Background Color', 'b-slider')}
			value={lightbox?.captionBg}
			onChange={val => setLightbox({ captionBg: val })}
		/>}

		{/**
		  * The caption's own typography — family, weight, size per device, style, transform,
		  * decoration, line height and letter spacing.
		  *
		  * It does not go through `Style.js`: that scopes everything to `#bsbCarousel-<id>` and the
		  * lightbox overlay is appended to a `body`, out of its reach. The rules are written into a
		  * stylesheet of the overlay's own instead — see `paintCaptionTypo`.
		  *
		  * No `defaults`, deliberately. An empty value is what leaves Fancybox's own caption sizing
		  * alone, and naming a default size here would set one on every slider that never opened
		  * this panel.
		  */}
		<Typography
			className='mt20 mb20'
			label={__('Caption Typography', 'b-slider')}
			value={lightbox?.captionTypo || {}}
			onChange={val => setLightbox({ captionTypo: val })}
		/>

		<SelectControl
			className='mt10'
			label={__('Caption Alignment', 'b-slider')}
			value={lightbox?.captionAlign || ''}
			options={[
				{ label: __('Default (center)', 'b-slider'), value: '' },
				{ label: __('Left', 'b-slider'), value: 'left' },
				{ label: __('Center', 'b-slider'), value: 'center' },
				{ label: __('Right', 'b-slider'), value: 'right' }
			]}
			onChange={val => setLightbox({ captionAlign: val })}
		/>

		{/* Whether the box hugs its text or spans the picture. On by default, so a slider saved
		    before this switch existed keeps the hugging box it already had. */}
		<ToggleControl
			className='mt10'
			label={__('Fit to Content', 'b-slider')}
			help={lightbox?.captionFitContent !== false ? __('Caption fits to content size', 'b-slider') : __('Caption takes full width', 'b-slider')}
			checked={lightbox?.captionFitContent !== false}
			onChange={val => setLightbox({ captionFitContent: val })}
		/>

		{/* Margin and not padding: the padding belongs to the surface — it is what gives a coloured
		    pane room around its text — while this moves the box relative to the picture. Sides left
		    blank write nothing at all. */}
		{/* Wrapped rather than given a `className`: `BoxControl` does not accept one — its props
		    list has no `className` at all, so the class was silently dropped and the gap never
		    appeared. The wrapper is what carries the spacing. */}
		<div className='mt10'>
			<BoxControl
				label={__('Caption Margin', 'b-slider')}
				values={lightbox?.captionMargin}
				onChange={val => setLightbox({ captionMargin: val })}
				resetValues={{ top: '', right: '', bottom: '', left: '' }}
			/>
		</div>
	</>}

	<Label className='mt15'>{__('Backdrop', 'b-slider')}</Label>

	{/* Empty leaves Fancybox's own near-black in place — `paintLightbox` only writes a variable
	    that was actually set. */}
	<ColorControl
		className='mt10 mb20'
		label={__('Color', 'b-slider')}
		value={lightbox?.backdrop}
		onChange={val => setLightbox({ backdrop: val })}
	/>

	<RangeControl
		className='mt10'
		label={__('Opacity (%)', 'b-slider')}
		value={undefined === lightbox?.backdropOpacity ? 100 : lightbox.backdropOpacity}
		min={0}
		max={100}
		onChange={val => setLightbox({ backdropOpacity: val })}
	/>
	</>;
};

export default LightboxSettings;

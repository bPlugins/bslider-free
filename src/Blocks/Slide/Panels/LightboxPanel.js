import LightboxSettings from './LightboxSettings';
import useSliderLightbox from '../extensions/useSliderLightbox';
import ProNotice from '../../../Components/Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';
import { VideoHelpLink, videoLabels } from '../../../utils/videos';

/**
 * How the lightbox looks, for a slider built from blocks.
 *
 * **Why it is a panel of its own rather than a section of Hover & Click.** These settings sat
 * under the "On click" dropdown to begin with, on the reasoning that an author meets them just
 * after asking for a lightbox. But there are a couple of dozen of them — toolbar switches, the
 * caption, the backdrop — and a panel that begins with two dropdowns and then runs on that long
 * stops reading as one question. Hover & Click answers *what this layer does*; this answers *how
 * the thing it opens is dressed*.
 *
 * `LayerControls` decides whether to render it at all — the panel is offered only on a `blocks`
 * slider, since every other source keeps these in the slider's own Lightbox panel. It is the
 * ancestor slider's `lightbox` attribute either way: see `useSliderLightbox` for why the storage
 * stays up there even when the controls are down here.
 */
const LightboxPanel = ({ clientId }) => {
	const { lightbox, setLightbox, sourceType } = useSliderLightbox(clientId);

	return <>
		{/* At the head of the panel, since the video covers the whole of it rather than any one
		    toggle in it. */}
		<VideoHelpLink video='lightbox' label={videoLabels.lightbox()} />

		<LightboxSettings
			lightbox={lightbox}
			setLightbox={setLightbox}
			sourceType={sourceType}
			/* No title on this source: a `blocks` slide is a block tree, not a record with a title
			   field, so there would be nothing for `title` to resolve to and the option would sit
			   in the list doing nothing. */
			captionTitleLabel={null}
		/>

		<ProNotice features={PRO_FEATURES.lightbox} />
	</>;
};

export default LightboxPanel;

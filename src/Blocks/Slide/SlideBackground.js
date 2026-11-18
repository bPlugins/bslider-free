/** Animated background (e.g. Ken Burns), behind content so scaling never scales the text. */
const SlideBackground = ({ attributes }) => {
	const { background = {}, kenBurns, kenBurnsDirection = 'in', kenBurnsDuration = 8 } = attributes || {};
	const { type = 'solid', image, position, size, repeat } = background;

	if (!kenBurns || 'image' !== type || !image?.url) {
		return null;
	}

	const style = {
		position: 'absolute',
		inset: 0,
		backgroundImage: `url(${image.url})`,
		backgroundPosition: position || 'center',
		backgroundSize: size || 'cover',
		backgroundRepeat: repeat || 'no-repeat',
		borderRadius: 'inherit',
		pointerEvents: 'none',
		zIndex: 0,
		'--bsb-kb-duration': `${kenBurnsDuration}s`,
	};

	return (
		<div
			className={`bsb-slide-bg bsb-ken-burns bsb-ken-burns--${kenBurnsDirection}`}
			aria-hidden="true"
			style={style}
		/>
	);
};

export default SlideBackground;

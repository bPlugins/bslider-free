import { getBoxValue } from '../../../../bpl-tools/utils/functions';
import { getTypoCSS, getColorsCSS } from '../../../../bpl-tools/utils/getCSS';
import arrows from '../../utils/arrows';

const Style = ({ attributes, clientId, postsCount, products }) => {
	const { sliders, slideInnerGap, slideInnerGapDevice, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, arrow, arrowStyle, indicator, SliderOverly, height, sliderHeight, borderRadius, arrowWidth, deviceArrowWidth, arrowHeight, deviceArrowHeight, arrowRadius, btnColors, btnHovColors, btnPadding, btnBorder, btnRadius, direction, columnGap, rowGap, grid, arrowBorder, thumbnails, sourceType, carousel } = attributes;
	const { loadMoreBtn } = grid;
	const { overly, height: thumbnailsHeight, width: thumbnailsWidth, active } = thumbnails;
	const { carouselStyle } = carousel;
	const isVertical = 'vertical' === indicator?.direction;


	const leftCursor = encodeURIComponent(arrows[arrowStyle].left(arrow?.size, arrow?.color, direction))
		.replace(/'/g, '%27')
		.replace(/"/g, '%22');

	const rightCursor = encodeURIComponent(arrows[arrowStyle].right(arrow?.size, arrow?.color, direction))
		.replace(/'/g, '%27')
		.replace(/"/g, '%22');

	return <style dangerouslySetInnerHTML={{
		__html: `
	${getTypoCSS('', loadMoreBtn?.typo)?.googleFontLink}
	${getTypoCSS('', titleTypo)?.googleFontLink}
	${getTypoCSS('', descTypo)?.googleFontLink}
	 
	${getTypoCSS(`#bsbCarousel-${clientId} .grid-wrapper .load-more button`, loadMoreBtn?.typo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsbTitle`, titleTypo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} p`, descTypo)?.styles}
	 

	#bsbCarousel-${clientId} .grid {
		grid-gap: ${rowGap} ${columnGap};
	}

	#bsbCarousel-${clientId} .bsbTitle{
		color: ${titleColor};
		margin: ${getBoxValue(titleMargin)};
		animation-delay: 0s;
		animation-duration: 0.7s;
	}

	#bsbCarousel-${clientId} p {
		color: ${descColor};
		margin: ${getBoxValue(descMargin)};
		animation-delay: 0.7s;
		animation-duration: 0.7s;
	}

	#bsbCarousel-${clientId} .carousel-button {
		animation-delay: 1.4s;
		animation-duration: 0.7s;
	}

	#bsbCarousel-${clientId} .carousel-button a {
		${getColorsCSS(btnColors)};
		padding: ${getBoxValue(btnPadding || {})};
		border: ${getBoxValue(btnBorder || {})};
		border-radius: ${btnRadius};
		transition:0.3s;
	}

	#bsbCarousel-${clientId} .carousel-button a:hover {
		${getColorsCSS(btnHovColors)};
		transition:0.3s;
	}

	#bsbCarousel-${clientId} .item, 
	#bsbCarousel-${clientId} .videoItem,
	#bsbCarousel-${clientId} .thumbnails .side-by-side .bsb-slider-thumbnail{
		position:relative;
		height: ${sliderHeight?.desktop || height};
		border-radius: ${getBoxValue(borderRadius)};
		box-sizing: border-box;
		overflow: hidden;
	}

	#bsbCarousel-${clientId} .thumbnails .side-by-side .bsb-slider-thumbnail{
		width:100%;
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail {
		height: ${thumbnailsHeight?.desktop};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide .single_thumbnails .img {
		border-radius: ${getBoxValue(borderRadius)};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide .single_thumbnails .img::after{
		background: ${overly?.color};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide.swiper-slide-thumb-active .img::after{
		background: ${active?.color};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide.swiper-slide-thumb-active .img{
		border: ${getBoxValue(active?.border || {})};
	}

	#bsbCarousel-${clientId} .swiper .swiper-wrapper .swiper-slide .item {
		height:100%;
	}

	#bsbCarousel-${clientId} .swiper .swiper-wrapper .swiper-slide .item img{
		width:100%;
		height:100%;
		object-fit:cover;
	}

	#bsbCarousel-${clientId} .item, 
	#bsbCarousel-${clientId} .videoItem,
	#bsbCarousel-${clientId} .carousel .swiper,
	#bsbCarousel-${clientId} .thumbnails .bsb-main-carousel-wrapper .bsb-main-slider{
		height: ${sliderHeight?.desktop || height};
	}

	#bsbCarousel-${clientId} .bsbButtonDesign .bsbArrowButton {
		${getColorsCSS(arrow)};
		font-size:${arrow?.size}px;
		width:${deviceArrowWidth?.desktop || arrowWidth};
		height:${deviceArrowHeight?.desktop || arrowHeight};
		border-radius:${getBoxValue(arrowRadius)};
		border: ${getBoxValue(arrowBorder)}
	}	

	@media (max-width: 768px) {
		#bsbCarousel-${clientId} .bsbButtonDesign .bsbArrowButton {
			width:${deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth};
			height:${deviceArrowHeight?.tablet || deviceArrowHeight?.desktop || arrowHeight};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper .carousel .swiper,
		#bsbCarousel-${clientId} .carousel .bsb-main-carousel-wrapper .bsb-main-slider {
			width:calc(100% - (${deviceArrowWidth?.tablet} + ${deviceArrowWidth?.tablet} + 10px));
		}

		#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail {
			height: ${thumbnailsHeight?.tablet};
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .bsbButtonDesign .bsbArrowButton { 
			width:${deviceArrowWidth?.mobile || deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth};
			height:${deviceArrowHeight?.mobile || deviceArrowHeight?.tablet || deviceArrowHeight?.desktop || arrowHeight};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper .carousel .swiper,
		#bsbCarousel-${clientId} .carousel .bsb-main-carousel-wrapper .bsb-main-slider {
			width:calc(100% - (${deviceArrowWidth?.mobile} + ${deviceArrowWidth?.mobile} + 10px));
		}

		#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail {
			height: ${thumbnailsHeight?.mobile};
		}
	}

	#bsbCarousel-${clientId} .default .bsbButtonDesign button{
		width:calc(40px + ${deviceArrowWidth?.desktop || arrowWidth});
	}

	@media (max-width: 768px) {
		#bsbCarousel-${clientId} .default .bsbButtonDesign button {
			width:calc(40px + ${deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth});	 
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .default .bsbButtonDesign button { 
			width:calc(40px + ${deviceArrowWidth?.mobile || deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth});
		}
	}

	#bsbCarousel-${clientId} .item:after{
		content: '';
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		background: ${SliderOverly};
	}

	#bsbCarousel-${clientId} .mainLayout .lightboxArea .contentArea .img .play{
		background:${SliderOverly};
	}

	#bsbCarousel-${clientId} .video .item:after {
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: 0;
	}

	#bsbCarousel-${clientId} .carousel-indicators {
    	grid-template-${isVertical ? 'rows' : 'columns'}: repeat(${sourceType === "posts" ? postsCount : sourceType === "woo" ? products?.length : sliders?.length}, minmax(auto, ${isVertical ? indicator?.height : indicator?.width}));
		padding: ${isVertical ? '5% 0' : '0 5%'};
	}

	#bsbCarousel-${clientId} .carousel-indicators {
		flex-direction: ${"vertical" === indicator?.direction ? 'column' : 'row'};
	}

	#bsbCarousel-${clientId} .carousel-indicators button{
		max-width: ${indicator?.width} !important;
		max-height: ${indicator?.height} !important;
		background-color:${indicator.color};
		border: ${indicator?.border?.width || '0px'} solid transparent;
		border-radius: ${indicator?.radius};
		padding:0;
	}

	#bsbCarousel-${clientId} .carousel-indicators .bsb-bullet{
		width: ${indicator?.width} !important;
		height: ${indicator?.height} !important;
	}

	#bsbCarousel-${clientId} .carousel-indicators button.active{
		background-color:${indicator?.activeColor};
		border: ${getBoxValue(indicator?.activeBorder || {})};
	}

	#bsbCarousel-${clientId} .arrowMouseEffect .carousel-control-prev:hover {
		cursor: url("data:image/svg+xml,${leftCursor}"), default;
	}

	#bsbCarousel-${clientId} .arrowMouseEffect .carousel-control-next:hover {
		cursor: url("data:image/svg+xml,${rightCursor}"), default;
	}

	@media (max-width: 768px) {
		#bsbCarousel-${clientId} .item, #bsbCarousel-${clientId} .videoItem {
			height: ${sliderHeight?.tablet || sliderHeight?.desktop || height};
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .item, #bsbCarousel-${clientId} .videoItem { 
			height: ${sliderHeight?.mobile || sliderHeight?.tablet || sliderHeight?.desktop || height};
		}
	}

	#bsbCarousel-${clientId} .item .carousel-caption {
		width:calc(100% - ${slideInnerGapDevice?.desktop || slideInnerGap});
	}

	@media (max-width: 768px) { 
		#bsbCarousel-${clientId} .item .carousel-caption {
			width:calc(100% - ${slideInnerGapDevice?.tablet || slideInnerGapDevice?.desktop || slideInnerGap});
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .bsb-thumbnail-left{
			width: ${thumbnailsWidth?.tablet};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .carousel-wrapper{
			width: calc( 100% - ${thumbnailsWidth?.tablet} );
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .item .carousel-caption {
			width:calc(100% - ${slideInnerGapDevice?.mobile || slideInnerGapDevice?.tablet || slideInnerGapDevice?.desktop || slideInnerGap});
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .bsb-thumbnail-left{
			width: ${thumbnailsWidth?.mobile};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .carousel-wrapper{
			width: calc( 100% - ${thumbnailsWidth?.mobile} );
		}
	}

	#bsbCarousel-${clientId} .carousel .bsb-main-carousel-wrapper .swiper {
		${(arrow?.visibility && carouselStyle !== "ticker") ? `width:calc(100% - (${deviceArrowWidth?.desktop} + ${deviceArrowWidth?.desktop} + 10px));` : ''}
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button, #bsbCarousel-${clientId} .grid-wrapper .load-more button{
 		${getColorsCSS(loadMoreBtn?.colors)};
		padding: ${getBoxValue(loadMoreBtn?.padding || {})};
		border: ${getBoxValue(loadMoreBtn?.border || {})};
		border-radius:${getBoxValue(loadMoreBtn?.radius)};
	}

	#bsbCarousel-${clientId} .grid-wrapper .button_area{
		text-align: ${loadMoreBtn?.align};
		justify-content: ${loadMoreBtn?.align};
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button:hover, #bsbCarousel-${clientId} .grid-wrapper .load-more button:hover{
		${getColorsCSS(loadMoreBtn?.hovColors)};
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button.active {
		${getColorsCSS(loadMoreBtn?.hovColors)};
	}

	#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .bsb-thumbnail-left{
		width: ${thumbnailsWidth?.desktop};
	}

	#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .carousel-wrapper{
		width: calc( 100% - ${thumbnailsWidth?.desktop} );
	}

	`.replace(/\s+/g, ' ')
	}} />
}
export default Style;
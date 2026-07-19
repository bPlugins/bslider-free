import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from "@wordpress/compose"
const { dateI18n } = wp.date;
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';

import { produce } from 'immer';
import Settings from './Settings/Settings';

import Style from '../Common/Style';
import Layout from '../Common/Layouts/Layout';
import PostsGridBack from './PostsGridBack';
import { filterNaN, filterObject, filterPassword, wordCount } from '../../utils/functions';
import SelectSource from './Source/SelectSource';
import Default from '../Common/Layouts/Default';
import ClipBoard from './ClipBoard';
import useIframeAssetSync from '../../../../bpl-tools/hooks/useIframeAssetSync';

const Edit = (props) => {

	const { attributes, setAttributes, clientId, totalPosts, posts, allCategories, selectBlock, CPTType, currentPostId } = props;

	useIframeAssetSync(['bsb-slider-style-css', 'bootstrap-css', 'bsb-slider-editor-style-css', 'bsb-slider-editor-script-js', 'bootstrap-js']);
	useEffect(() => { clientId && setAttributes({ cId: clientId.substring(0, 10) }); }, [clientId]);
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		setAttributes({ postsQuery: { ...attributes.postsQuery, paginationCurrentPage: 1 } });
	}, [attributes.grid.paginationType]);

	const [carousel, setCarousel] = useState(null);
	const { sliders, layoutType } = attributes;

	const updateSlider = (type, index, val, childType = false) => {
		const newSlider = produce(sliders, draft => {
			if (childType) {
				draft[index][type][childType] = val;
			} else {
				draft[index][type] = val;
			}
		});
		setAttributes({ sliders: newSlider });
	}

	//  Add Slider
	const addSlider = () => {
		setAttributes({
			sliders: [
				...sliders,
				{
					img: { url: 'https://templates.bplugins.com/wp-content/uploads/2025/02/n-37.jpg' },
					video: "",
					title: null,
					desc: `This is description here-${sliders?.length + 1}`,
					altText: null
				}
			]
		})
	}

	//   Remove Slider
	const removeSlider = (index) => {
		const removeSlider = [...sliders];
		removeSlider.splice(index, 1);
		setAttributes({ sliders: removeSlider });

		carousel?.to(index === 0 ? index : index - 1);
		setActiveIndex(index === 0 ? index : index - 1);
	}

	//  Card Duplicate 
	const duplicateSlider = (index) => {
		const newSliders = [...sliders.slice(0, index), { ...sliders[index] }, ...sliders.slice(index)];
		setAttributes({ sliders: newSliders });

		carousel?.to(index + 1);
		setActiveIndex(index + 1);
	}

	const updateObject = (attr, key, val) => {
		const newAttr = { ...attributes[attr] };
		newAttr[key] = val;
		setAttributes({ [attr]: newAttr })
	}

	const multipleAttrChange = (parentAttr, childAttr, key, value) => {
		setAttributes({
			[parentAttr]: {
				...(attributes[parentAttr] || {}),
				[childAttr]: {
					...(attributes[parentAttr]?.[childAttr] || {}),
					[key]: value,
				},
			},
		});
	};

	// Slide To ActiveIndex 
	useEffect(() => {
		carousel?.to(activeIndex || 0);
	}, [activeIndex]);

	const commonDeProps = { clientId, activeIndex, carousel, setCarousel, updateSlider, isBackEnd: true };
	const settingsProps = { clientId, attributes, setAttributes, updateSlider, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, allCategories, multipleAttrChange, updateObject };

	const isOld = !layoutType && sliders[0]?.img?.url !== 'https://templates.bplugins.com/wp-content/uploads/2025/02/n-39.jpg';
	const LayoutEl = <Layout {...{ attributes, firstPosts: posts, products: posts, totalPosts, setAttributes, commonDeProps, PostsGrid: PostsGridBack, updateObject }} />;

	const shortcode = `[bsb-slider id=${currentPostId}]`;


	return (
		<div {...useBlockProps()}>  {CPTType === "bsb" && <ClipBoard shortcode={shortcode} />}
			<div id={`bsbCarousel-${clientId}`} onClick={() => selectBlock(clientId)}>
				<div className={`mainLayout ${layoutType}`}>

					{isOld ? <>
						<Settings {...settingsProps} />
						<Style {...{ attributes, clientId, postsCount: posts?.length, products: posts }} />
						<Default {...{ attributes, firstPosts: posts, commonDeProps, products: posts }} />
					</> : <>
						{!layoutType ?
							<SelectSource {...{ attributes, setAttributes, updateObject }} /> : <>
								<Settings {...settingsProps} />
								<Style {...{ attributes, clientId, postsCount: posts?.length, products: posts }} />
								{LayoutEl}
							</>}
					</>}
				</div>
			</div></div>
	);
};

export default compose(
	withSelect((select, { attributes }) => {

		const currentPostId = select('core/editor').getCurrentPostId();
		const CPTType = select('core/editor').getCurrentPostType?.();

		if (["", "image"].includes(attributes.sourceType)) {

			return {
				totalPosts: 5 || '',
				posts: [],
				taxOfPostType: [],
				media: 10,
				currentPostId,
				CPTType
			}
		}

		const { getUsers, getEntityRecords, getTaxonomies, getMedia, getComments } = select('core');
		const { postsQuery, grid } = attributes;
		const { post_type, selectedTaxonomies = {}, selectedCategories = [], selectedTags = [], per_page, orderby, order, offset, include, exclude, isExcludeCurrent, paginationCurrentPage, fImgSize = 'full', metaDateFormat = 'M j, Y' } = postsQuery;
		const { paginationType } = grid;

		// Query Filter
		const catsFilter = 'post' === post_type ? { categories: selectedCategories } : {};
		const tagsFilter = 'post' === post_type ? { tags: selectedTags } : {};

		const filterTaxonomies = Object.assign({},
			selectedTaxonomies?.category ? { categories: selectedTaxonomies['category'] } : {},
			selectedTaxonomies?.post_tag ? { tags: selectedTaxonomies['post_tag'] } : {},
			filterObject(selectedTaxonomies, key => key !== 'category' && key !== 'post_tag')
		);

		const includes = Array.isArray(include) ? filterNaN(include)?.length ? { include: filterNaN(include) } : {} : {};
		const verifiedExclude = Array.isArray(exclude) ? filterNaN(exclude) : []
		// Post Query
		const query = {
			...filterTaxonomies,
			...catsFilter,
			...tagsFilter,
			per_page,
			orderby,
			order,
			offset,
			...includes,
			exclude: isExcludeCurrent ? [select('core/editor').getCurrentPostId(), ...verifiedExclude] : verifiedExclude,
			status: 'publish'
		}

		const filteredPosts = filterPassword(getEntityRecords('postType', post_type, { ...query, per_page: -1, _embed: true }), 'false');
		const allPosts = Array.isArray(filteredPosts) ? filteredPosts : []

		const paginationShowStart = per_page * (paginationCurrentPage - 1);
		const paginationShowEnd = paginationShowStart + per_page;
		const paginationPosts = allPosts?.slice(paginationShowStart, paginationShowEnd);
		const loadMorePosts = allPosts?.slice(0, paginationShowEnd)

		// Arranged Posts
		const getTaxonomy = slug => getEntityRecords('taxonomy', slug, { per_page: -1 });
		const imageBySize = (id, size) => {
			const media = getMedia(id);
			const mediaUrl = media?.media_details?.sizes?.[size]?.source_url || media?.source_url;
			return { url: mediaUrl?.replace(/<[^>]+>/g, ''), alt: media?.alt_text }
		};

		const commentsById = id => getComments({ per_page: -1 })?.filter(({ post }) => id === post);
		const taxOfPostType = getTaxonomies({ per_page: -1 })?.filter(tax => tax.types.includes(post_type) && tax.slug !== 'category')?.map(({ name, slug, rest_base }) => ({ name, slug, rest_base }));

		const arrangedPosts = (posts) => {
			return posts?.map(post => {
				const { id, link, slug: name, featured_media, title, excerpt, author, categories, content, date, date_gmt, modified, modified_gmt, comment_status, status } = post;
				const thumbnail = imageBySize(featured_media, fImgSize);
				const taxonomies = {};
				taxOfPostType?.map(t => {
					const links = getTaxonomy(t.slug)
						?.filter(tf => post[t.rest_base]
							?.includes(tf.id))
						?.map(td => `<a href='${td.link}' rel='${t.slug}'>${td.name}</a>`);

					taxonomies[t.slug] = links?.join('')
				});

				const plainContent = content?.raw?.replace(/(<([^>]+)>)/gi, '')?.trim();
				const categoriesLink = Array.isArray(categories) && categories?.length ? getTaxonomy('category')?.filter(c => categories?.includes(c.id))?.map(c => `<a href='${c.link}' rel='category tag'>${c.name}</a>`) : [];

				const authorInfo = getUsers({ who: 'authors' })?.map(({ id, name, link }) => ({ id, name, link }))?.find(a => a.id === author);

				const comments = commentsById(id);

				return {
					id,
					link,
					name,
					thumbnail,
					title: title?.rendered,
					excerpt: excerpt?.raw?.replace(/(<([^>]+)>)/gi, '')?.trim(),
					content: plainContent,
					author: authorInfo,
					date: dateI18n(metaDateFormat, new Date(date)),
					dateGMT: date_gmt,
					modifiedDate: modified,
					modifiedDateGMT: modified_gmt,
					commentCount: Array.isArray(comments) ? comments.length : 0,
					commentStatus: comment_status,
					categories: {
						coma: categoriesLink?.join(', '),
						space: categoriesLink?.join(' ')
					},
					taxonomies,
					readTime: {
						min: Math.floor(wordCount(plainContent) / 200),
						sec: Math.floor((wordCount(plainContent) % 200) / (200 / 60))
					},
					status
				};
			})
		}

		const posts = per_page > 0 || 'none' !== paginationType ? ('pagination' === paginationType ? paginationPosts : loadMorePosts) : filterPassword(getEntityRecords('postType', post_type, query), 'false') || [];

		return {
			totalPosts: Array.isArray(allPosts) ? allPosts?.length : 0,
			posts: Array.isArray(posts) ? arrangedPosts(posts) : [],
			taxOfPostType: taxOfPostType || [],
			media: id => getMedia(id),
			currentPostId,
			CPTType
		};
	}),
	withDispatch((dispatch, ownProps) => {
		return {
			selectBlock: () => {
				dispatch('core/block-editor').selectBlock(ownProps.clientId);
			},
		};
	})
)(Edit);
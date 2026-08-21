import { withSelect, withDispatch, dispatch as wpDispatch } from '@wordpress/data';
import { compose } from "@wordpress/compose"
const { dateI18n } = wp.date;
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect, useState } from '@wordpress/element';

import apiFetch from '@wordpress/api-fetch';
import Settings from './Settings/Settings';

import Style from '../Common/Style';
import Layout from '../Common/Layouts/Layout';
import PostsGridBack from './PostsGridBack';
import { filterNaN, filterObject, filterPassword, filterSelected, postTypeTaxonomies, updateArrayItem, wordCount } from '../../utils/functions';
import { allowedAcfFields, FIELD_ROLES } from '../Common/single-item/AcfFields';
import SelectSource from './Source/SelectSource';
import Default from '../Common/Layouts/Default';
import ClipBoard from './ClipBoard';
import useSocialFeed from '../../hooks/useSocialFeed';
import { GLOBAL_SIDEBAR } from './GlobalSidebar';
import useIframeAssetSync from '../../../../bpl-tools/hooks/useIframeAssetSync';
// The sidebar markup leans on bpl-tools' `mt*`/`mb*` spacing classes, which live here.
import '../../../../bpl-tools/Components/style.scss';

/** The `rest_base` of the two core taxonomies, which does not match their slug. */
const CORE_TAX_REST_BASE = { category: 'categories', post_tag: 'tags' };

const Edit = (props) => {

	// `isSelected` comes from WordPress, and a linked slide picture waits for it: the first click on an
	// unselected slider is how the block is selected, so the link must not take it — see the hook.
	const { attributes, setAttributes, clientId, isSelected, totalPosts, posts, allCategories, selectBlock, CPTType, currentPostId } = props;

	useIframeAssetSync(['bsb-slider-style-css', 'bootstrap-css', 'bsb-slider-editor-style-css', 'bsb-slider-editor-script-js', 'bootstrap-js']);
	useEffect(() => { clientId && setAttributes({ cId: clientId.substring(0, 10) }); }, [clientId]);
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		setAttributes({ postsQuery: { ...attributes.postsQuery, paginationCurrentPage: 1 } });
	}, [attributes.grid.paginationType]);

	const [carousel, setCarousel] = useState(null);
	const [acfValuesMap, setAcfValuesMap] = useState({});
	const { sliders, layoutType, postsQuery } = attributes;

	// Filtered the same way Posts::acfFieldsToFetch filters it, so the preview shows what the site shows.
	const selectedAcfFields = allowedAcfFields(postsQuery?.selectedAcfFields || []);

	// Mirrors Posts::acfFieldsToFetch — slot fields are pulled even when not displayed. Read off
	// FIELD_ROLES rather than written out, so a slot added there cannot be missed here.
	const acfFieldsToFetch = Object.values(FIELD_ROLES)
		.map(role => postsQuery?.[role.field])
		.filter(name => name && !selectedAcfFields.includes(name))
		.reduce((list, name) => list.includes(name) ? list : [...list, name], [...selectedAcfFields]);

	/**
	 * ACF values are resolved server-side rather than read off the REST payload: that payload
	 * carries no field types, so formatting it here could not match what the front end prints.
	 */
	useEffect(() => {
		if (acfFieldsToFetch.length > 0 && Array.isArray(posts) && posts.length > 0) {
			apiFetch({ path: `/bsb/v1/post-acf-values?post_ids=${posts.map(p => p.id).join(',')}&fields=${acfFieldsToFetch.join(',')}` })
				.then(res => {
					if (res && typeof res === 'object') {
						setAcfValuesMap(res);
					}
				})
				.catch(() => { });
		} else {
			setAcfValuesMap({});
		}
	}, [JSON.stringify(acfFieldsToFetch), JSON.stringify(posts?.map(p => p.id))]);

	const formattedPosts = posts?.map(p => ({
		...p,
		acf_fields: (acfValuesMap && acfValuesMap[p.id]) ? acfValuesMap[p.id] : p.acf_fields
	}));

	const updateSlider = (type, index, val, childType = false) => {
		setAttributes({ sliders: updateArrayItem(sliders, index, type, val, childType) });
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

	const commonDeProps = { clientId, activeIndex, carousel, setCarousel, updateSlider, isBackEnd: true, isSelected };
	/**
	 * An external feed has no entity records to select from, so it is fetched rather than queried.
	 * What comes back is shaped like an arranged post, which is what lets the same layouts render it
	 * — see the note in useSocialFeed.
	 */
	const socialFeed = useSocialFeed(attributes);
	const isSocialSource = 'social' === attributes.sourceType;

	/**
	 * Bring a named inspector panel up, from something in the canvas.
	 *
	 * The empty state tells the user which panel to go to; this is what lets it take them there. Two
	 * steps, because either can already be true: the sidebar may be closed altogether, and the panel
	 * may be in a tab that is not showing. The nonce makes each click a fresh request, so asking for
	 * the same panel twice — with something else opened in between — works both times.
	 */
	const [panelRequest, setPanelRequest] = useState(null);

	const openPanel = id => {
		selectBlock(clientId);

		// `core/edit-post` in the post editor, `core/edit-site` in the site editor. Neither is
		// guaranteed to be there, so both are asked and whichever answers wins.
		['core/edit-post', 'core/edit-site'].forEach(store => {
			try {
				wpDispatch(store)?.openGeneralSidebar?.('edit-post/block');
			} catch (e) {
				// That editor is not the one running; the other call covers it.
			}
		});

		setPanelRequest({ id, nonce: Date.now() });
	};

	/**
	 * Bring up bSlider's own panel — the saved channels and the API key.
	 *
	 * A plugin sidebar is addressed by `plugin/sidebar`, which `GLOBAL_SIDEBAR` builds from the same
	 * two halves the registration uses, so this cannot end up naming a sidebar that does not exist.
	 */
	const openGlobalSettings = () => {
		['core/edit-post', 'core/edit-site'].forEach(store => {
			try {
				wpDispatch(store)?.openGeneralSidebar?.(GLOBAL_SIDEBAR);
			} catch (e) {
				// That editor is not the one running; the other call covers it.
			}
		});
	};

	const displayPosts = isSocialSource ? socialFeed.items : formattedPosts;
	const displayTotal = isSocialSource ? (socialFeed.items?.length || 0) : totalPosts;

	const settingsProps = { clientId, attributes, setAttributes, updateSlider, addSlider, removeSlider, duplicateSlider, activeIndex, setActiveIndex, allCategories, multipleAttrChange, updateObject, queriedPosts: displayPosts, socialFeed, panelRequest };

	const isOld = !layoutType && sliders[0]?.img?.url !== 'https://templates.bplugins.com/wp-content/uploads/2025/02/n-39.jpg';
	const LayoutEl = <Layout {...{ attributes, firstPosts: displayPosts, products: displayPosts, totalPosts: displayTotal, setAttributes, commonDeProps, PostsGrid: PostsGridBack, updateObject, feedError: isSocialSource ? socialFeed.error : '', feedProfile: isSocialSource ? socialFeed.profile : null, feedLoading: isSocialSource && socialFeed.loading, onOpenPanel: openPanel, onOpenGlobal: openGlobalSettings }} />;

	const shortcode = `[bsb-slider id=${currentPostId}]`;


	return (
		<div {...useBlockProps()}>  {CPTType === "bsb" && <ClipBoard shortcode={shortcode} />}
			<div id={`bsbCarousel-${clientId}`} onClick={() => selectBlock(clientId)}>
				<div className={`mainLayout ${layoutType}`}>

					{isOld ? <>
						<Settings {...settingsProps} />
						<Style {...{ attributes, clientId, postsCount: displayPosts?.length, products: displayPosts }} />
						<Default {...{ attributes, firstPosts: formattedPosts, commonDeProps, products: formattedPosts }} />
					</> : <>
						{(!layoutType || (attributes.sourceType === 'social' && !attributes.socialQuery?.feedType)) ?
							<SelectSource {...{ attributes, setAttributes, updateObject }} /> : <>
								<Settings {...settingsProps} />
								<Style {...{ attributes, clientId, postsCount: formattedPosts?.length, products: formattedPosts }} />
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

		// `social` joins these: its items come off an HTTP feed through useSocialFeed, so there is no
		// post query to run and running one anyway would fetch every post on the site for a slider
		// that shows none of them.
		if (["", "image", "social"].includes(attributes.sourceType)) {

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

		const { targetPostType, catTaxSlug, tagTaxSlug } = postTypeTaxonomies(post_type, attributes.sourceType);

		const allTaxonomies = getTaxonomies({ per_page: -1 });
		const getTaxonomy = slug => getEntityRecords('taxonomy', slug, { per_page: -1 });

		/**
		 * The REST parameter a taxonomy filter goes under.
		 *
		 * A taxonomy answers to its `rest_base`, which for the core two is `categories` and `tags`
		 * rather than `category` and `post_tag`. REST drops parameters it does not recognise without
		 * complaining, so naming one wrong does not fail — it quietly returns every post, and the
		 * editor ends up showing more than the front end does.
		 *
		 * The core two are also written out above, so the very first render — before the taxonomy
		 * list has arrived — already filters instead of briefly showing everything.
		 */
		const restKeyOf = slug => allTaxonomies?.find(tax => tax.slug === slug)?.rest_base
			|| CORE_TAX_REST_BASE[slug]
			|| slug;

		/**
		 * The terms a filter is built from, mirroring Posts::termsOfTaxonomy on the front end.
		 *
		 * A `post` slider passes its terms straight through, the way it always has. Anything else
		 * keeps only the terms the taxonomy really holds: `selectedCategories` and `selectedTags` are
		 * one pair of keys shared by every post type, so a slider moved over to products or a CPT
		 * still carries what was picked for the old one, and querying with those matches nothing. A
		 * slider saved without a post type filters by nothing, as the front end has always done.
		 */
		const termsFor = (slug, selected = []) => {
			if ('post' === post_type) {
				return selected;
			}

			return post_type ? filterSelected(getTaxonomy(slug), selected) || [] : [];
		};

		// Query Filter
		const catTerms = termsFor(catTaxSlug, selectedCategories);
		const tagTerms = termsFor(tagTaxSlug, selectedTags);

		const catsFilter = catTerms?.length ? { [restKeyOf(catTaxSlug)]: catTerms } : {};
		const tagsFilter = tagTerms?.length ? { [restKeyOf(tagTaxSlug)]: tagTerms } : {};

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

		const filteredPosts = filterPassword(getEntityRecords('postType', targetPostType, { ...query, per_page: -1, _embed: true }), 'false');
		const allPosts = Array.isArray(filteredPosts) ? filteredPosts : []

		// `-1` (or anything below 1) means show every post, so the page size becomes the full set.
		const pageSize = parseInt(per_page) > 0 ? parseInt(per_page) : allPosts?.length;
		const paginationShowStart = pageSize * (paginationCurrentPage - 1);
		const paginationShowEnd = paginationShowStart + pageSize;
		const paginationPosts = allPosts?.slice(paginationShowStart, paginationShowEnd);
		const loadMorePosts = allPosts?.slice(0, paginationShowEnd)

		// Arranged Posts
		const imageBySize = (id, size) => {
			const media = getMedia(id);
			const mediaUrl = media?.media_details?.sizes?.[size]?.source_url || media?.source_url;
			return { url: mediaUrl?.replace(/<[^>]+>/g, ''), alt: media?.alt_text }
		};

		const commentsById = id => getComments({ per_page: -1 })?.filter(({ post }) => id === post);
		const taxOfPostType = allTaxonomies?.filter(tax => tax.types.includes(post_type) && tax.slug !== 'category')?.map(({ name, slug, rest_base }) => ({ name, slug, rest_base }));

		const arrangedPosts = (posts) => {
			return posts?.map(post => {
				const { id, link, slug: name, featured_media, title, excerpt, author, categories, content, date, date_gmt, modified, modified_gmt, comment_status, status, price, sale, sale_percent } = post;
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
					status,
					price,
					sale,
					sale_percent
				};
			})
		}

		const posts = per_page > 0 || 'none' !== paginationType ? ('pagination' === paginationType ? paginationPosts : loadMorePosts) : filterPassword(getEntityRecords('postType', targetPostType, query), 'false') || [];

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
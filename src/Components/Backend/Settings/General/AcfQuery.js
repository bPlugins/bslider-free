import { __, sprintf } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { Label } from '../../../../../../bpl-tools/Components';
import { isProActive } from '../../../../utils/functions';
import ProCard from '../../../Panel/ProCard';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';
import { postsOrders } from '../../../../utils/options';
import useAcfFields from '../../../../hooks/useAcfFields';
import HelpTip from '../../../Panel/HelpTip';
import { TipToggle } from '../../../Panel/TipField';
import FieldGroup from '../../../Panel/FieldGroup';
import AcfFilterRules from './AcfFilterRules';

// Panel for sorting and filtering posts using ACF fields.

// Field types compared as numbers.
const NUMERIC_ACF_TYPES = ['number', 'range'];

// Field types allowed for sorting.
const SORTABLE_ACF_TYPES = [
    'text', 'number', 'range', 'email', 'url',
    'date_picker', 'date_time_picker', 'time_picker',
    'true_false', 'select', 'radio', 'button_group'
];

const AcfQuery = ({ attributes, setAttributes, updateObject, premiumProps, queriedPosts = [] }) => {
    const { postsQuery, sourceType } = attributes;
    const { post_type = 'post', order, orderByField = '', orderByNumeric = false, orderByRequire = false, metaFilters = [], metaRelation = 'AND' } = postsQuery;
    const { isPremium, setIsProModalOpen } = premiumProps || {};
    const isPro = isPremium ?? isProActive();

    const targetPostType = post_type || ('woo' === sourceType ? 'product' : 'post');
    const acfFields = useAcfFields(targetPostType);

    const noun = 'posts' === sourceType ? __('Post', 'b-slider') : __('Product', 'b-slider');

    const sortableFields = acfFields.filter(field => SORTABLE_ACF_TYPES.includes(field.type));
    const filterableFields = acfFields;

    const options = orderByField && !sortableFields.some(field => field.value === orderByField)
        ? [...sortableFields, { label: orderByField, value: orderByField }]
        : sortableFields;

    const setFilters = (rules, relation) => {
        if (rules.length && !isPremium) {
            setIsProModalOpen?.(true);
            return;
        }

        setAttributes({
            postsQuery: {
                ...postsQuery,
                metaFilters: rules,
                metaRelation: undefined === relation ? metaRelation : relation
            }
        });
    };

    const setOrderByField = name => {
        if (name && !isPremium) {
            setIsProModalOpen?.(true);
            return;
        }

        const type = acfFields.find(field => field.value === name)?.type;

        setAttributes({
            postsQuery: {
                ...postsQuery,
                orderByField: name,
                orderByNumeric: NUMERIC_ACF_TYPES.includes(type)
            }
        });
    };

    return (
        <PanelBody className='bPlPanelBody' title={__('ACF Query', 'b-slider')} initialOpen={false} {...(!isPro ? { badge: <PremiumBadge /> } : { badge: __('New', 'b-slider') })}>
            {isPro ? (
                <>
                    <div className="mb20">
                        <Label className='mb10'>{__('Sort By Field:', 'b-slider')}</Label>
                        <SelectControl
                            value={orderByField}
                            onChange={setOrderByField}
                            options={[
                                { label: __('Don\u2019t sort by a field', 'b-slider'), value: '' },
                                ...options.map(field => ({ label: field.label, value: field.value }))
                            ]}
                        />
                        {!sortableFields.length && (
                            <small className="bsb_field_hint">
                                {acfFields.length
                                    ? __('None of the ACF fields here can be sorted on \u2014 images, galleries and linked posts have nothing to put in order.', 'b-slider')
                                    : __('No ACF fields reach this post type. See the ACF Integration panel.', 'b-slider')}
                            </small>
                        )}
                    </div>

                    {!!orderByField && (
                        <div className="mb20">
                            <Label className='mb10'>{__('This Field Holds:', 'b-slider')}</Label>
                            <SelectControl
                                value={orderByNumeric ? 'number' : 'text'}
                                onChange={val => updateObject("postsQuery", "orderByNumeric", 'number' === val)}
                                options={[
                                    { label: __('Words or dates', 'b-slider'), value: 'text' },
                                    { label: __('Numbers', 'b-slider'), value: 'number' }
                                ]}
                            />
                            <small className="bsb_field_hint">
                                {__('Choose Numbers for prices, quantities or ratings \u2014 otherwise 1000 comes before 500.', 'b-slider')}
                            </small>
                        </div>
                    )}

                    {!!orderByField && (
                        <div className="mb20">
                            <Label className='mb10'>
                                {__('Order:', 'b-slider')}
                                <HelpTip label={__('About the order setting', 'b-slider')}>
                                    {__('Same as Post Query order.', 'b-slider')}
                                </HelpTip>
                            </Label>
                            <SelectControl
                                value={order}
                                onChange={val => updateObject("postsQuery", "order", val)}
                                options={postsOrders}
                            />
                        </div>
                    )}

                    {!!orderByField && (
                        <div className="mb20">
                            <TipToggle
                                label={sprintf(
                                    // translators: %s is post type name
                                    __('Hide %s With No Value', 'b-slider'), noun)}
                                checked={orderByRequire}
                                onChange={val => updateObject("postsQuery", "orderByRequire", val)}
                                tip={__('Leaves out posts where you left this field blank. Off, they still show, grouped at one end.', 'b-slider')}
                                tipLabel={__('About hiding posts with no value', 'b-slider')}
                            />
                        </div>
                    )}

                    <FieldGroup title={__('Filter', 'b-slider')} />

                    {filterableFields.length ? <>
                        <AcfFilterRules
                            fields={filterableFields}
                            rules={metaFilters}
                            relation={metaRelation}
                            onChange={setFilters}
                        />

                        {!!metaFilters.length && (
                            <small className="bsb_field_hint">
                                {queriedPosts.length
                                    ? sprintf(
                                        // translators: %1$d is count, %2$s is post type name
                                        __('%1$d %2$s matches these rules.', 'b-slider'),
                                        queriedPosts.length, noun)
                                    : __('Nothing matches these rules yet, so the slider is empty. Try loosening one.', 'b-slider')}
                            </small>
                        )}
                    </> : (
                        <small className="bsb_field_hint">
                            {acfFields.length
                                ? __('None of this post type\u2019s ACF fields can be filtered on.', 'b-slider')
                                : __('No ACF fields reach this post type. See the ACF Integration panel.', 'b-slider')}
                        </small>
                    )}
                </>
            ) : (
                <ProCard
                    title={__('ACF Query', 'b-slider')}
                    description={__('Sort and filter your slider posts by ACF field values. Set custom ordering, numeric or text sorting, and build advanced filter rules.', 'b-slider')}
                />
            )}
        </PanelBody>
    );
};

export default AcfQuery;

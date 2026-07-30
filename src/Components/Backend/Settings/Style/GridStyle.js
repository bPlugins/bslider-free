import { __ } from '@wordpress/i18n';
import { __experimentalBoxControl as BoxControl, __experimentalBorderControl as BorderControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { ColorsControl, Typography } from '../../../../../../bpl-tools/Components';
import { emUnit, pxUnit } from '../../../../utils/options';


const GridStyle = ({ attributes, multipleAttrChange }) => {
    const { grid } = attributes;
    const { loadMoreBtn, paginationType } = grid;
    const { typo, colors, hovColors, border, padding, radius } = loadMoreBtn;

    return (
        paginationType !== 'none' && <PanelBody className='bPlPanelBody' title={`${paginationType === 'pagination' ? 'Pagination' : 'Load More'} Button`} initialOpen={false}>
            <Typography className="mt20" label={__('Typography:', 'b-slider')} value={typo} onChange={(val) => multipleAttrChange('grid', 'loadMoreBtn', 'typo', val)} defaults={{ fontSize: 14 }} />

            <ColorsControl className='' label={__('Colors', 'b-slider')} value={colors} onChange={(val) => multipleAttrChange('grid', 'loadMoreBtn', 'colors', val)} defaults={{ color: '#fff', bg: '#ff3b5c' }} />

            <ColorsControl className='' label={__('Hover Colors', 'b-slider')} value={hovColors} onChange={(val) => multipleAttrChange('grid', 'loadMoreBtn', 'hovColors', val)} defaults={{ color: '#000', bg: '#fff' }} />

            <BoxControl label={__('Padding', 'b-slider')} values={padding} onChange={(val) => multipleAttrChange('grid', 'loadMoreBtn', 'padding', val)} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            <BorderControl className='mt10' label={__('Border', 'b-slider')} value={border} onChange={(val) => multipleAttrChange('grid', 'loadMoreBtn', 'border', val)} />

            <BoxControl className='mt20' label={__('Border Radius', 'b-slider')} values={radius} onChange={(val) => multipleAttrChange('grid', 'loadMoreBtn', 'radius', val)} resetValues={{ top: '0px', right: '0px', bottom: '0px', left: '0px' }} units={[pxUnit(3), emUnit(2)]} />
        </PanelBody>
    );
};
export default GridStyle;


import { Button, ButtonGroup, Tooltip } from '@wordpress/components';
import { Label } from '../../../../../bpl-tools/Components';



/**
 * @props className (optional): 'mt20' (String)
 * @props value (String)
 * @props onChange: (Function)
 * @return Value (String)
 */

const ButtonGroupController = ({ options, value, tooltipPosition = 'top', label, onChange, ...restProps }) => {
    return <>
        <Label>{label}</Label>

        <ButtonGroup className='bPlBtnGroup'>
            {Object.values(options).map(obj => <Tooltip key={obj.value} text={obj.label} position={tooltipPosition}>
                <Button
                    icon={<span dangerouslySetInnerHTML={{ __html: obj?.icon }} />}
                    isPrimary={value === obj.value}
                    aria-pressed={value === obj.value}
                    isMedium={true}
                    onClick={() => onChange(obj.value)}
                    {...restProps}
                />
            </Tooltip>)}
        </ButtonGroup>
    </>
}

export default ButtonGroupController
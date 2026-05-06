
const arrows = {
    style1: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' fillRule='evenodd' clipRule='evenodd' d='M14.5303 18.5303C14.2374 18.8232 13.7626 18.8232 13.4697 18.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L13.4697 5.46967C13.7626 5.17678 14.2374 5.17678 14.5303 5.46967C14.8232 5.76256 14.8232 6.23744 14.5303 6.53033L9.06066 12L14.5303 17.4697C14.8232 17.7626 14.8232 18.2374 14.5303 18.5303Z' />
        </svg>`,
        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' fillRule='evenodd' clipRule='evenodd' d='M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z' />
        </svg>`
    }
}
export default arrows;
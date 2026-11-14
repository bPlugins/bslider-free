
// Size and colour land inside quoted SVG attributes, so only a number and a plain colour get through.
const safeSize = size => {
    const num = parseFloat(size);

    return Number.isFinite(num) && num > 0 ? num : 24;
};

const COLOR_RE = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\([\d\s.,%/]+\)|var\(--[\w-]+\)|[a-z]+)$/i;

const safeColor = color => COLOR_RE.test(String(color ?? '').trim()) ? String(color).trim() : 'rgba(255, 255, 255, 100)';

const arrows = {
    style1: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' fill-rule='evenodd' clip-rule='evenodd' d='M14.5303 18.5303C14.2374 18.8232 13.7626 18.8232 13.4697 18.5303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L13.4697 5.46967C13.7626 5.17678 14.2374 5.17678 14.5303 5.46967C14.8232 5.76256 14.8232 6.23744 14.5303 6.53033L9.06066 12L14.5303 17.4697C14.8232 17.7626 14.8232 18.2374 14.5303 18.5303Z' />
        </svg>`,
        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' fill-rule='evenodd' clip-rule='evenodd' d='M9.46967 5.46967C9.76256 5.17678 10.2374 5.17678 10.5303 5.46967L16.5303 11.4697C16.8232 11.7626 16.8232 12.2374 16.5303 12.5303L10.5303 18.5303C10.2374 18.8232 9.76256 18.8232 9.46967 18.5303C9.17678 18.2374 9.17678 17.7626 9.46967 17.4697L14.9393 12L9.46967 6.53033C9.17678 6.23744 9.17678 5.76256 9.46967 5.46967Z' />
        </svg>`
    },
    style2: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' fill-rule='evenodd' clip-rule='evenodd' d='M11.4939 20.5644C11.1821 20.8372 10.7083 20.8056 10.4356 20.4939L3.43557 12.4939C3.18814 12.2111 3.18814 11.7889 3.43557 11.5061L10.4356 3.50613C10.7083 3.1944 11.1822 3.16281 11.4939 3.43557C11.8056 3.70834 11.8372 4.18216 11.5644 4.49388L5.65283 11.25L20 11.25C20.4142 11.25 20.75 11.5858 20.75 12C20.75 12.4142 20.4142 12.75 20 12.75L5.65283 12.75L11.5644 19.5061C11.8372 19.8179 11.8056 20.2917 11.4939 20.5644Z' />
        </svg>`,
        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' fill-rule='evenodd' clip-rule='evenodd' d='M12.5061 3.43557C12.8178 3.16281 13.2917 3.19439 13.5644 3.50612L20.5644 11.5061C20.8119 11.7889 20.8119 12.2111 20.5644 12.4939L13.5644 20.4939C13.2917 20.8056 12.8178 20.8372 12.5061 20.5644C12.1944 20.2917 12.1628 19.8178 12.4356 19.5061L18.3472 12.75H4C3.58579 12.75 3.25 12.4142 3.25 12C3.25 11.5858 3.58579 11.25 4 11.25H18.3472L12.4356 4.49388C12.1628 4.18215 12.1944 3.70833 12.5061 3.43557Z' />
        </svg>`
    },
    style3: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M11 20.74C10.9012 20.7423 10.803 20.7238 10.7118 20.686C10.6205 20.6481 10.5382 20.5916 10.47 20.52L2.47 12.52C2.32955 12.3794 2.25066 12.1888 2.25066 11.99C2.25066 11.7913 2.32955 11.6007 2.47 11.46L10.47 3.46003C10.576 3.35806 10.7096 3.2895 10.8542 3.26288C10.9989 3.23626 11.1481 3.25274 11.2835 3.31029C11.4188 3.36783 11.5342 3.4639 11.6154 3.58653C11.6966 3.70917 11.7399 3.85296 11.74 4.00003V7.30003H21C21.1981 7.30262 21.3874 7.38247 21.5275 7.52256C21.6676 7.66265 21.7474 7.85192 21.75 8.05003V16.05C21.7474 16.2481 21.6676 16.4374 21.5275 16.5775C21.3874 16.7176 21.1981 16.7974 21 16.8H11.74V19.99C11.7402 20.139 11.6954 20.2845 11.6116 20.4076C11.5277 20.5307 11.4087 20.6257 11.27 20.68C11.1848 20.7175 11.0931 20.7379 11 20.74ZM4.07 12L10.25 18.18V16.05C10.25 15.8511 10.329 15.6603 10.4697 15.5197C10.6103 15.379 10.8011 15.3 11 15.3H20.25V8.80003H11C10.8019 8.79744 10.6126 8.71759 10.4725 8.57749C10.3324 8.4374 10.2526 8.24813 10.25 8.05003V5.82003L4.07 12Z' />
        </svg>`,
        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}' >
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M13 20.74C12.9039 20.7541 12.8062 20.7541 12.71 20.74C12.5724 20.6823 12.4551 20.5849 12.3732 20.4602C12.2912 20.3355 12.2484 20.1892 12.25 20.04V16.7H3.00001C2.81189 16.6956 2.63208 16.6216 2.49538 16.4923C2.35868 16.363 2.27481 16.1876 2.26001 16V8.00002C2.25463 7.89856 2.26965 7.79706 2.30417 7.7015C2.3387 7.60595 2.39204 7.51829 2.46103 7.44371C2.53002 7.36913 2.61326 7.30913 2.70584 7.26727C2.79841 7.22542 2.89844 7.20255 3.00001 7.20002H12.25V4.01002C12.2498 3.86106 12.2946 3.71551 12.3784 3.59241C12.4623 3.4693 12.5813 3.37436 12.72 3.32002C12.8551 3.26039 13.0053 3.24376 13.1502 3.27238C13.2951 3.301 13.4277 3.37349 13.53 3.48002L21.53 11.48C21.6705 11.6206 21.7493 11.8113 21.7493 12.01C21.7493 12.2088 21.6705 12.3994 21.53 12.54L13.53 20.54C13.4601 20.6079 13.377 20.6608 13.2858 20.6952C13.1946 20.7296 13.0973 20.7448 13 20.74ZM3.76001 15.2H13C13.1981 15.2026 13.3874 15.2825 13.5275 15.4226C13.6676 15.5626 13.7474 15.7519 13.75 15.95V18.18L19.93 12L13.75 5.83002V8.00002C13.7477 8.19843 13.6689 8.3883 13.53 8.53002C13.3817 8.65257 13.1919 8.71343 13 8.70002H3.76001V15.2Z' />
        </svg>`
    },
    style4: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'><path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}'
            d='M1.02698 11.9929L5.26242 16.2426L6.67902 14.8308L4.85766 13.0033L22.9731 13.0012L22.9728 11.0012L4.85309 11.0033L6.6886 9.17398L5.27677 7.75739L1.02698 11.9929Z' />
        </svg>`,
        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'><path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M23.0677 11.9929L18.818 7.75739L17.4061 9.17398L19.2415 11.0032L0.932469 11.0012L0.932251 13.0012L19.2369 13.0032L17.4155 14.8308L18.8321 16.2426L23.0677 11.9929Z' /></svg>`
    },

    style5: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}'><path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='m4.431 12.822 13 9A1 1 0 0 0 19 21V3a1 1 0 0 0-1.569-.823l-13 9a1.003 1.003 0 0 0 0 1.645z' /></svg>`,

        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg width='${size}' height='${size}' viewBox='0 0 24 24' fill='${color}' xmlns='http://www.w3.org/2000/svg'><path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886z' /></svg>`
    },
    style6: {
        left: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M16.5 8L13 11.5L16.5 15' stroke='${color}' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M10.5 8L7 11.5L10.5 15' stroke='${color}' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>`,
        right: (size = 24, color = 'rgba(255, 255, 255, 100)', direction = '') => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 24 24' fill='none'>
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M7 8L10.5 11.5L7 15' stroke='${color}' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            <path transform='${direction === 'vertical' ? 'rotate(90, 13, 12)' : ''}' d='M13 8L16.5 11.5L13 15' stroke='${color}' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
        </svg>`
    }

}

const safeArrows = Object.fromEntries(Object.entries(arrows).map(([style, { left, right }]) => [style, {
    left: (size, color, direction) => left(safeSize(size), safeColor(color), direction),
    right: (size, color, direction) => right(safeSize(size), safeColor(color), direction)
}]));

export default safeArrows;
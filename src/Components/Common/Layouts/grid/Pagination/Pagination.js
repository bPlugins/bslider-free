import { useEffect, useState } from 'react';

import { usePagination, DOTS } from './usePagination';
import { loaderIcon } from '../../../../../utils/icons';

const Pagination = ({ attributes, totalCount, onChange, isLoading }) => {
    const { postsQuery, grid } = attributes;
    const { per_page } = postsQuery;
    const [currentPage, setCurrentPage] = useState(1);
    const { paginationType } = grid;

    const paginationRange = usePagination({
        currentPage,
        totalCount,
        pageSize: per_page,
        siblingCount: 1
    });

    if (currentPage === 0 || paginationRange?.length < 2) {
        return null;
    }

    let lastPage = paginationRange[paginationRange?.length - 1];
    const setPageNumber = pageNumber => {
        onChange(pageNumber);
        setCurrentPage(pageNumber);
    }

    // Load More option change 
    useEffect(() => {
        setCurrentPage(1);
    }, [paginationType]);

    return paginationType === 'pagination' ? <div className={`pagination button_area`}>
        <button className={`pagination__button ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => setPageNumber(currentPage - 1)}>Prev</button>

        {paginationRange.map((pageNumber, index) => {
            if (pageNumber === DOTS) {
                return <button className='pagination__button dots' key={index}>&#183;&#183;&#183;&#183;&#183;</button>;
            }

            return <button key={index} className={`pagination__button ${pageNumber === currentPage ? 'active' : ''}`} onClick={() => setPageNumber(pageNumber)} > {pageNumber}</button>;
        })}

        <button className={`pagination__button ${currentPage === lastPage ? 'disabled' : ''}`}
            onClick={() => setPageNumber(currentPage + 1)}
        >Next</button>
    </div> : (paginationType === 'loadMore' && (currentPage * per_page < totalCount)) ? <div className="load-more button_area">
        <button className="load_more_btn" onClick={() => setPageNumber(currentPage + 1)}>
            {isLoading ? <span className="loader" aria-label="Loading">
                {loaderIcon}
            </span> : <>
                Load More ({totalCount - currentPage * per_page})
            </>}
        </button>
    </div> : null;
};
export default Pagination;
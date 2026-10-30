import { useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import "../styles/pagination.css";

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 9,
  pageSizeOptions = [6, 9, 12, 24],
  onPageChange,
  onPageSizeChange,
  itemLabel = "papers",
  scrollToElementId,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Generate page numbers with smart ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [currentPage, totalPages]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  function handlePageClick(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange?.(page);

    if (scrollToElementId) {
      const el = document.getElementById(scrollToElementId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else {
      window.scrollTo({ top: 180, behavior: "smooth" });
    }
  }

  function handleSizeChange(e) {
    const newSize = Number(e.target.value);
    onPageSizeChange?.(newSize);
    onPageChange?.(1);
  }

  if (totalItems === 0) return null;

  return (
    <nav className="rn-pagination-bar" aria-label="Papers pagination">
      {/* Items range display */}
      <div className="rn-pagination-info">
        <span>
          Showing <strong>{startItem}</strong> – <strong>{endItem}</strong> of{" "}
          <strong>{totalItems}</strong> {itemLabel}
        </span>
      </div>

      {/* Page navigation controls */}
      <div className="rn-pagination-controls">
        {/* First Page */}
        <button
          type="button"
          className="rn-page-btn"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          className="rn-page-btn"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          title="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Numbered Page Buttons with Ellipsis */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${index}`} className="rn-page-ellipsis">
                •••
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              className={`rn-page-btn ${isActive ? "active" : ""}`}
              onClick={() => handlePageClick(page)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          className="rn-page-btn"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          title="Next page"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          className="rn-page-btn"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Page size selector */}
      {pageSizeOptions && pageSizeOptions.length > 0 && onPageSizeChange && (
        <div className="rn-pagination-size-wrap">
          <label htmlFor="rn-page-size-select">Per page:</label>
          <select
            id="rn-page-size-select"
            className="rn-page-size-select"
            value={pageSize}
            onChange={handleSizeChange}
            aria-label="Number of papers per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}

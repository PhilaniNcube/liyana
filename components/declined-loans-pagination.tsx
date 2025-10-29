"use client";

import React from "react";
import { useQueryStates, parseAsInteger } from "nuqs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// Query state configuration for pagination (must mirror server parsing keys)
const paginationQueryConfig = {
  page: parseAsInteger.withDefault(1),
};

interface DeclinedLoansPaginationProps {
  currentPage: number;
  totalPages: number;
  className?: string;
}

export function DeclinedLoansPagination({
  currentPage,
  totalPages,
  className,
}: DeclinedLoansPaginationProps) {
  const [values, setValues] = useQueryStates(paginationQueryConfig, {
    shallow: false, // full navigation so server refetch occurs
  });

  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setValues({ page: newPage });
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const minVisiblePages = 4;
    const maxVisiblePages = 5;

    // If total pages is less than or equal to max, show all pages
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // For more than maxVisiblePages, ensure we show at least minVisiblePages
      const pagesToShow = maxVisiblePages;
      
      if (currentPage <= 3) {
        // Show first 4-5 pages when near the beginning
        for (let i = 1; i <= Math.min(pagesToShow, totalPages); i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // Show last 4-5 pages when near the end
        for (let i = Math.max(1, totalPages - pagesToShow + 1); i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show pages centered around current page
        const halfPages = Math.floor(pagesToShow / 2);
        for (let i = currentPage - halfPages; i <= currentPage + halfPages; i++) {
          if (i >= 1 && i <= totalPages) {
            pages.push(i);
          }
        }
      }
    }

    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className={cn("flex justify-center pt-6", className)}>
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage - 1);
                }}
                className="cursor-pointer"
              />
            </PaginationItem>
          )}

          {/* Show page 1 and ellipsis only if we're not already showing it in pageNumbers */}
          {pageNumbers[0] > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(1);
                  }}
                  className="cursor-pointer"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {pageNumbers[0] > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {/* Always show the generated page numbers */}
          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(pageNumber);
                }}
                isActive={pageNumber === currentPage}
                className="cursor-pointer"
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* Show ellipsis and last page only if we're not already showing it in pageNumbers */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(totalPages);
                  }}
                  className="cursor-pointer"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(currentPage + 1);
                }}
                className="cursor-pointer"
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}

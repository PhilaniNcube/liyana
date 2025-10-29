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

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Ensure we show at least 4 pages when we have 4 or more total pages
      const pagesToShow = Math.max(minVisiblePages, Math.min(maxVisiblePages, totalPages));
      
      if (currentPage <= 3) {
        for (let i = 1; i <= pagesToShow; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - pagesToShow + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        const halfPages = Math.floor(pagesToShow / 2);
        for (let i = currentPage - halfPages; i <= currentPage + halfPages; i++) {
          pages.push(i);
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

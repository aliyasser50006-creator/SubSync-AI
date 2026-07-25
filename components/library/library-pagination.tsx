'use client';

import { MouseEvent } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface LibraryPaginationProps {
  currentPage: number;
  totalPages: number;
  getPageHref: (page: number) => string;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages: Array<number | 'start-ellipsis' | 'end-ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push('start-ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('end-ellipsis');
  pages.push(totalPages);
  return pages;
}

export function LibraryPagination({
  currentPage,
  totalPages,
  getPageHref,
  onPageChange,
  disabled = false,
}: LibraryPaginationProps) {
  const previousDisabled = currentPage <= 1 || disabled;
  const nextDisabled = currentPage >= totalPages || disabled;
  const navigate = (event: MouseEvent<HTMLAnchorElement>, page: number, isDisabled: boolean) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!isDisabled && page !== currentPage) onPageChange(page);
  };

  return (
    <Pagination className="pt-4 pb-8" aria-busy={disabled}>
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <PaginationPrevious
            href={previousDisabled ? undefined : getPageHref(currentPage - 1)}
            aria-disabled={previousDisabled}
            tabIndex={previousDisabled ? -1 : undefined}
            className={cn(previousDisabled && 'pointer-events-none opacity-50')}
            onClick={(event) => navigate(event, currentPage - 1, previousDisabled)}
          />
        </PaginationItem>
        {getVisiblePages(currentPage, totalPages).map((item) => (
          <PaginationItem key={item}>
            {typeof item === 'number' ? (
              <PaginationLink
                href={getPageHref(item)}
                isActive={item === currentPage}
                aria-label={`Go to page ${item}`}
                onClick={(event) => navigate(event, item, disabled)}
              >
                {item}
              </PaginationLink>
            ) : (
              <PaginationEllipsis />
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            href={nextDisabled ? undefined : getPageHref(currentPage + 1)}
            aria-disabled={nextDisabled}
            tabIndex={nextDisabled ? -1 : undefined}
            className={cn(nextDisabled && 'pointer-events-none opacity-50')}
            onClick={(event) => navigate(event, currentPage + 1, nextDisabled)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

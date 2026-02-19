import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  siblingCount?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages = [];
    const totalPageNumbers = siblingCount + 5;

    if (totalPages <= totalPageNumbers) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      for (let i = 1; i <= leftItemCount; i++) {
        pages.push(i);
      }
      pages.push("dots");
      pages.push(totalPages);
      return pages;
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      pages.push(1);
      pages.push("dots");
      
      for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    if (shouldShowLeftDots) pages.push("dots");
    
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      pages.push(i);
    }
    
    if (shouldShowRightDots) pages.push("dots");
    pages.push(totalPages);
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  const getDisplayedItemsInfo = () => {
    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalItems);
    return { from, to };
  };

  const { from, to } = getDisplayedItemsInfo();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
        Menampilkan {from} - {to} dari {totalItems} data
      </p>
      
      <div className="flex items-center gap-2">
        {/* Button Sebelumnya - Style diubah seperti button Lihat Semua di dashboard */}
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
        </Button>
        
        <div className="flex items-center gap-1">
          {pageNumbers.map((pageNumber, index) => {
            if (pageNumber === "dots") {
              return (
                <span 
                  key={`dots-${index}`} 
                  className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }
            
            return (
              <Button
                key={pageNumber}
                variant={currentPage === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(Number(pageNumber))}
                disabled={loading}
                className={`w-10 h-10 ${
                  currentPage === pageNumber
                    ? "bg-[#005EB8] hover:bg-[#004A93] text-white" // Style aktif (seperti button Lanjut Belajar)
                    : "border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]" // Style tidak aktif (seperti button Lihat Semua)
                }`}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>
        
        {/* Button Selanjutnya - Style diubah seperti button Lihat Semua di dashboard */}
        <Button
          variant="outline"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="border-[#005EB8] text-[#005EB8] hover:bg-[#005EB8]/10 dark:border-[#005EB8] dark:text-[#005EB8]"
        >
          Selanjutnya <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
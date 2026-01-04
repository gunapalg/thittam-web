import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, LayoutGrid, List } from 'lucide-react';
import { ServiceFilters } from './ServiceFilters';
import { ServiceCard } from './ServiceCard';
import { ServiceCardSkeleton } from './ServiceCardSkeleton';
import { BookingRequestModal } from './BookingRequestModal';
import { Toggle } from '@/components/ui/toggle';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  budgetRange?: {
    min: number;
    max: number;
  };
  verifiedOnly: boolean;
  sortBy: 'relevance' | 'price' | 'rating' | 'distance';
}

export interface ServiceListingData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number | null;
  pricing_type: string;
  price_unit: string | null;
  service_areas: string[] | null;
  inclusions: string[] | null;
  media_urls: string[] | null;
  tags: string[] | null;
  vendor: {
    id: string;
    business_name: string;
    verification_status: string | null;
    city: string | null;
    state: string | null;
  };
}

interface ServiceDiscoveryUIProps {
  eventId?: string;
}

const ServiceDiscoveryUI: React.FC<ServiceDiscoveryUIProps> = ({ eventId }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    verifiedOnly: true,
    sortBy: 'relevance'
  });
  const [selectedService, setSelectedService] = useState<ServiceListingData | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [useInfiniteScroll, setUseInfiniteScroll] = useState(false);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch services from Supabase
  const fetchServices = async (page: number) => {
    let query = supabase
      .from('vendor_services')
      .select(`
        id,
        name,
        description,
        category,
        base_price,
        pricing_type,
        price_unit,
        service_areas,
        inclusions,
        media_urls,
        tags,
        vendor:vendors!vendor_services_vendor_fk (
          id,
          business_name,
          verification_status,
          city,
          state
        )
      `, { count: 'exact' })
      .eq('status', 'ACTIVE');

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    }

    if (filters.budgetRange?.min) {
      query = query.gte('base_price', filters.budgetRange.min);
    }

    if (filters.budgetRange?.max) {
      query = query.lte('base_price', filters.budgetRange.max);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price':
        query = query.order('base_price', { ascending: true, nullsFirst: false });
        break;
      case 'relevance':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Pagination
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Filter by verified vendors if required (post-query since we can't filter nested)
    let filteredData = data || [];
    if (filters.verifiedOnly) {
      filteredData = filteredData.filter(
        (service: any) => service.vendor?.verification_status === 'VERIFIED'
      );
    }

    // Filter by location if specified
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filteredData = filteredData.filter((service: any) => {
        const city = service.vendor?.city?.toLowerCase() || '';
        const state = service.vendor?.state?.toLowerCase() || '';
        const serviceAreas = service.service_areas || [];
        return (
          city.includes(locationLower) ||
          state.includes(locationLower) ||
          serviceAreas.some((area: string) => area.toLowerCase().includes(locationLower))
        );
      });
    }

    return {
      services: filteredData as ServiceListingData[],
      totalCount: count || 0,
    };
  };

  // Paginated query
  const paginatedQuery = useQuery({
    queryKey: ['marketplace-services', filters, currentPage],
    queryFn: () => fetchServices(currentPage),
    enabled: !useInfiniteScroll,
  });

  // Infinite scroll query
  const infiniteQuery = useInfiniteQuery({
    queryKey: ['marketplace-services-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await fetchServices(pageParam);
      return {
        ...result,
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((acc, page) => acc + page.services.length, 0);
      return totalLoaded < lastPage.totalCount ? lastPage.nextPage : undefined;
    },
    initialPageParam: 1,
    enabled: useInfiniteScroll,
  });

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!useInfiniteScroll) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && infiniteQuery.hasNextPage && !infiniteQuery.isFetchingNextPage) {
          infiniteQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [useInfiniteScroll, infiniteQuery.hasNextPage, infiniteQuery.isFetchingNextPage, infiniteQuery.fetchNextPage]);

  // Derived state
  const isLoading = useInfiniteScroll ? infiniteQuery.isLoading : paginatedQuery.isLoading;
  const services = useInfiniteScroll
    ? infiniteQuery.data?.pages.flatMap(page => page.services) || []
    : paginatedQuery.data?.services || [];
  const totalCount = useInfiniteScroll
    ? infiniteQuery.data?.pages[0]?.totalCount || 0
    : paginatedQuery.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);

  const handleBookService = (service: ServiceListingData) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleToggleScrollMode = () => {
    setUseInfiniteScroll(prev => !prev);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  const renderSkeletons = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ServiceCardSkeleton key={`skeleton-${i}`} />
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <ServiceFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* View mode toggle and results count */}
      <div className="flex items-center justify-between">
        {!isLoading && totalCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {useInfiniteScroll
              ? `Showing ${services.length} of ${totalCount} services`
              : `Showing ${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount} services`}
          </p>
        )}
        {isLoading && <div />}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Toggle
            pressed={!useInfiniteScroll}
            onPressedChange={() => !useInfiniteScroll || handleToggleScrollMode()}
            size="sm"
            aria-label="Paginated view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={useInfiniteScroll}
            onPressedChange={() => useInfiniteScroll || handleToggleScrollMode()}
            size="sm"
            aria-label="Infinite scroll view"
          >
            <List className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* Service Listings */}
      <div className="space-y-4">
        {isLoading ? (
          renderSkeletons(3)
        ) : services && services.length > 0 ? (
          <>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onBookService={handleBookService}
              />
            ))}
            
            {/* Infinite scroll loading indicator */}
            {useInfiniteScroll && (
              <div ref={loadMoreRef} className="py-4">
                {infiniteQuery.isFetchingNextPage && renderSkeletons(2)}
                {!infiniteQuery.hasNextPage && services.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    You've reached the end of the list
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or browse all categories.</p>
          </div>
        )}
      </div>

      {/* Pagination (only for paginated mode) */}
      {!useInfiniteScroll && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {getPageNumbers().map((page, idx) =>
              page === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Booking Modal */}
      {selectedService && (
        <BookingRequestModal
          service={selectedService}
          eventId={eventId}
          open={showBookingModal}
          onOpenChange={(open) => {
            setShowBookingModal(open);
            if (!open) setSelectedService(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceDiscoveryUI;

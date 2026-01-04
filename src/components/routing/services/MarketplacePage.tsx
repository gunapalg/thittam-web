import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../PageHeader';
import { useAuth } from '../../../hooks/useAuth';
import { UserRole } from '../../../types';
import { Button } from '@/components/ui/button';

// Import existing marketplace components
import ServiceDiscoveryUI from '../../marketplace/ServiceDiscoveryUI';
import BookingManagementUI from '../../marketplace/BookingManagementUI';
import ReviewRatingUI from '../../marketplace/ReviewRatingUI';
import VendorCoordination from '../../marketplace/VendorCoordination';
import EventMarketplaceIntegration from '../../marketplace/EventMarketplaceIntegration';

/**
 * MarketplacePage provides a customer-facing marketplace interface for browsing and booking services.
 * 
 * Features:
 * - Service discovery with advanced filtering
 * - Booking management
 * - Event-specific marketplace integration
 * - Review and rating system
 * - Role-based interface customization
 */
export const MarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'discover' | 'bookings' | 'vendors' | 'reviews' | 'integration'>('discover');

  // Extract eventId from URL params if present
  const urlParams = new URLSearchParams(location.search);
  const eventId = urlParams.get('eventId');
  const eventName = urlParams.get('eventName');

  const isOrganizer = user?.role === UserRole.ORGANIZER;


  const pageActions = [
    {
      label: 'Browse Services',
      action: () => setActiveView('discover'),
      variant: 'primary' as const,
    },
    {
      label: 'My Bookings',
      action: () => setActiveView('bookings'),
      variant: 'secondary' as const,
    },
  ];

  const tabs = [
    { id: 'discover', label: 'Discover Services' },
    { id: 'bookings', label: 'My Bookings' },
    { id: 'reviews', label: 'Reviews & Ratings' },
    ...(eventId ? [{ id: 'integration', label: 'Event Planning' }] : []),
    ...(isOrganizer ? [{ id: 'vendors', label: 'Vendor Coordination' }] : []),
  ];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Marketplace', href: '/marketplace' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'discover':
        return (
          <div className="space-y-6">
            {/* Hero CTA Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Organizer CTA */}
              <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">Find Services for Your Event</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Discover verified vendors offering venues, catering, photography, and more for your next event.
                    </p>
                    <Button 
                      onClick={() => setActiveView('discover')}
                      className="w-full sm:w-auto"
                    >
                      Browse Services
                    </Button>
                  </div>
                </div>
              </div>

              {/* Vendor CTA */}
              <div className="bg-gradient-to-br from-secondary/15 via-secondary/10 to-secondary/5 rounded-xl p-6 border border-secondary/20 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <svg className="w-6 h-6 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">List Your Services & Products</h2>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Join our marketplace as a vendor and connect with event organizers looking for quality services.
                    </p>
                    <Button 
                      variant="secondary"
                      onClick={() => navigate('/marketplace/vendor/register')}
                      className="w-full sm:w-auto"
                    >
                      Vendor Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border p-6">
              <ServiceDiscoveryUI eventId={eventId || undefined} />
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <BookingManagementUI eventId={eventId || undefined} />
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ReviewRatingUI eventId={eventId || undefined} />
            </div>
          </div>
        );

      case 'integration':
        return eventId ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <EventMarketplaceIntegration 
                eventId={eventId} 
                eventName={eventName || 'Your Event'} 
              />
            </div>
          </div>
        ) : null;

      case 'vendors':
        return eventId ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <VendorCoordination eventId={eventId} />
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600 mb-4">Select an event to coordinate with vendors</p>
            <button
              onClick={() => setActiveView('discover')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Services Instead
            </button>
          </div>
        );
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title={eventId ? `Marketplace - ${eventName || 'Event'}` : 'Service Marketplace'}
          subtitle={eventId 
            ? `Discover and book services for ${eventName || 'your event'} from verified vendors`
            : 'Discover and book services from verified vendors'
          }
          breadcrumbs={breadcrumbs}
          actions={pageActions}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            current: activeView === tab.id,
            onClick: () => setActiveView(tab.id as any),
          }))}
        />

        {/* Service Categories Quick Navigation */}
        {activeView === 'discover' && (
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Popular Categories</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'VENUE', name: 'Venues' },
                  { id: 'CATERING', name: 'Catering' },
                  { id: 'PHOTOGRAPHY', name: 'Photography' },
                  { id: 'VIDEOGRAPHY', name: 'Videography' },
                  { id: 'ENTERTAINMENT', name: 'Entertainment' },
                  { id: 'AUDIO_VISUAL', name: 'Audio/Visual' },
                ].map((category) => (
                  <button
                    key={category.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {renderContent()}
        </div>

        {/* Help and Information */}
        <div className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Discover Professional Services for Your Events</h3>
          <p className="text-gray-700 mb-6">
            Browse our curated marketplace of verified vendors offering everything you need to make your events successful.
          </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
                <div className="text-2xl mb-2">🔍</div>
                <h4 className="font-semibold text-gray-900 mb-2">Smart Search</h4>
                <p className="text-sm text-gray-600">Find exactly what you need with intelligent filters for category, location, budget, and availability.</p>
              </div>
              <div className="bg-white/80 rounded-lg p-4 border border-purple-100">
                <div className="text-2xl mb-2">✅</div>
                <h4 className="font-semibold text-gray-900 mb-2">Verified Vendors</h4>
                <p className="text-sm text-gray-600">All vendors are verified and rated by previous customers for quality assurance.</p>
              </div>
              <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-semibold text-gray-900 mb-2">Direct Communication</h4>
                <p className="text-sm text-gray-600">Connect directly with vendors, request quotes, and coordinate service delivery.</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplacePage;
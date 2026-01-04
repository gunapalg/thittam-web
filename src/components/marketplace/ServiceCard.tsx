import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MapPin, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { ServiceListingData } from './ServiceDiscoveryUI';

interface ServiceCardProps {
  service: ServiceListingData;
  onBookService: (service: ServiceListingData) => void;
}

const formatPrice = (basePrice: number | null, pricingType: string, priceUnit: string | null) => {
  if (!basePrice) {
    return 'Contact for pricing';
  }
  
  const formattedPrice = basePrice.toLocaleString();
  
  switch (pricingType) {
    case 'FIXED':
      return `$${formattedPrice}`;
    case 'HOURLY':
      return `$${formattedPrice}/hour`;
    case 'PER_PERSON':
      return `$${formattedPrice}/person`;
    case 'CUSTOM_QUOTE':
      return 'Custom Quote';
    default:
      return priceUnit ? `$${formattedPrice}/${priceUnit}` : `$${formattedPrice}`;
  }
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onBookService }) => {
  const imageUrl = service.media_urls?.[0];
  const vendorLocation = [service.vendor?.city, service.vendor?.state]
    .filter(Boolean)
    .join(', ');

  return (
    <Card className="border-border/60 overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Service Image */}
          <div className="flex-shrink-0 lg:w-52">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={service.name}
                className="w-full h-40 lg:h-full object-cover"
              />
            ) : (
              <div className="w-full h-40 lg:h-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className="flex-1 p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {service.name}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                  {service.description || 'No description available'}
                </p>
                
                {/* Vendor Info */}
                <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                  <Link 
                    to={`/vendor/${service.vendor?.id}`}
                    className="flex items-center gap-1 hover:text-primary transition-colors group"
                  >
                    <span className="font-medium text-foreground group-hover:text-primary">
                      {service.vendor?.business_name}
                    </span>
                    {service.vendor?.verification_status === 'VERIFIED' && (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    )}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>

                {/* Service Category and Location */}
                <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                  <Badge variant="outline" className="text-xs">
                    {formatCategory(service.category)}
                  </Badge>
                  {vendorLocation && (
                    <span className="text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 inline mr-1" />
                      {vendorLocation}
                    </span>
                  )}
                  {service.service_areas && service.service_areas.length > 0 && !vendorLocation && (
                    <span className="text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 inline mr-1" />
                      {service.service_areas.slice(0, 2).join(', ')}
                      {service.service_areas.length > 2 && ` +${service.service_areas.length - 2} more`}
                    </span>
                  )}
                </div>

                {/* Inclusions */}
                {service.inclusions && service.inclusions.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Includes:</span>{' '}
                    {service.inclusions.slice(0, 3).join(', ')}
                    {service.inclusions.length > 3 && ` +${service.inclusions.length - 3} more`}
                  </p>
                )}

                {/* Tags */}
                {service.tags && service.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {service.tags.slice(0, 4).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing and Actions */}
              <div className="lg:text-right shrink-0">
                <div className="text-lg font-semibold text-foreground mb-3">
                  {formatPrice(service.base_price, service.pricing_type, service.price_unit)}
                </div>
                <div className="flex lg:flex-col gap-2">
                  <Button
                    onClick={() => onBookService(service)}
                    size="sm"
                    className="flex-1 lg:w-full"
                  >
                    Request Quote
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 lg:w-full"
                    asChild
                  >
                    <Link to={`/vendor/${service.vendor?.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { XMarkIcon, CheckIcon, ChevronDownIcon, SparklesIcon, CalendarDaysIcon, PaintBrushIcon, CursorArrowRaysIcon, MapPinIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/looseClient';
import { useToast } from '@/hooks/use-toast';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventManagementPaths } from '@/hooks/useEventManagementPaths';
import { useMyMemberOrganizations } from '@/hooks/useOrganization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Category display config
const categoryLabels: Record<string, string> = {
  HACKATHON: '💻 Hackathon',
  BOOTCAMP: '🎓 Bootcamp',
  WORKSHOP: '🔧 Workshop',
  CONFERENCE: '🎤 Conference',
  MEETUP: '👥 Meetup',
  STARTUP_PITCH: '🚀 Startup Pitch',
  HIRING_CHALLENGE: '💼 Hiring Challenge',
  WEBINAR: '🖥️ Webinar',
  COMPETITION: '🏆 Competition',
  SEMINAR: '📚 Seminar',
  SYMPOSIUM: '🎓 Symposium',
  CULTURAL_FEST: '🎭 Cultural Fest',
  SPORTS_EVENT: '⚽ Sports Event',
  ORIENTATION: '🎯 Orientation',
  ALUMNI_MEET: '🤝 Alumni Meet',
  CAREER_FAIR: '💼 Career Fair',
  LECTURE: '📖 Lecture',
  QUIZ: '❓ Quiz',
  DEBATE: '🗣️ Debate',
  PRODUCT_LAUNCH: '🎉 Product Launch',
  TOWN_HALL: '🏛️ Town Hall',
  TEAM_BUILDING: '🏗️ Team Building',
  TRAINING: '📋 Training',
  AWARDS_CEREMONY: '🏅 Awards Ceremony',
  OFFSITE: '✈️ Offsite',
  NETWORKING: '🔗 Networking',
  TRADE_SHOW: '🏪 Trade Show',
  EXPO: '🎪 Expo',
  SUMMIT: '⛰️ Summit',
  PANEL_DISCUSSION: '💬 Panel Discussion',
  DEMO_DAY: '🎬 Demo Day',
  FUNDRAISER: '💰 Fundraiser',
  GALA: '🌟 Gala',
  CHARITY_EVENT: '❤️ Charity Event',
  VOLUNTEER_DRIVE: '🙋 Volunteer Drive',
  AWARENESS_CAMPAIGN: '📢 Awareness Campaign',
  CONCERT: '🎵 Concert',
  EXHIBITION: '🖼️ Exhibition',
  FESTIVAL: '🎊 Festival',
  SOCIAL_GATHERING: '🎈 Social Gathering',
  OTHER: '📌 Other',
};

const virtualPlatforms = [
  { value: 'zoom', label: '📹 Zoom' },
  { value: 'teams', label: '💼 Microsoft Teams' },
  { value: 'meet', label: '📞 Google Meet' },
  { value: 'webex', label: '🎥 Webex' },
  { value: 'other', label: '🔗 Other' },
];

// Modern section header with icon
const SectionHeader: React.FC<{
  title: string;
  description: string;
  icon: React.ElementType;
  isOpen: boolean;
  stepNumber: number;
  isConditional?: boolean;
}> = ({ title, description, icon: Icon, isOpen, stepNumber, isConditional }) => (
  <div className="flex items-center gap-4 w-full py-4 px-2">
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
      isOpen 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
        : "bg-muted text-muted-foreground"
    )}>
      <Icon className="h-5 w-5" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded-full transition-colors",
          isOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          Step {stepNumber}
        </span>
        {isConditional && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground">
            Conditional
          </span>
        )}
      </div>
      <h3 className="text-base font-semibold text-foreground mt-0.5">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{description}</p>
    </div>
    <div className={cn(
      "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
      isOpen ? "bg-primary/10 rotate-0" : "bg-transparent -rotate-90"
    )}>
      <ChevronDownIcon className={cn(
        "h-5 w-5 transition-transform duration-300",
        isOpen ? "text-primary" : "text-muted-foreground"
      )} />
    </div>
  </div>
);

interface EventFormPageProps {
  mode: 'create' | 'edit';
}

const eventSchema = z
  .object({
    name: z.string().trim().min(1, 'Event name is required'),
    description: z.string().trim().min(1, 'Description is required'),
    mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID'], { required_error: 'Mode is required' }),
    category: z.string().optional(),
    organizationId: z.string().min(1, 'Organization is required'),
    capacity: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.trim() === '') return true;
          const num = Number(val);
          return !Number.isNaN(num) && num > 0;
        },
        { message: 'Capacity must be a positive number' },
      ),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    registrationDeadline: z.string().optional(),
    // Venue fields (for OFFLINE/HYBRID)
    venueName: z.string().optional(),
    venueAddress: z.string().optional(),
    venueCity: z.string().optional(),
    venueState: z.string().optional(),
    venueCountry: z.string().optional(),
    venuePostalCode: z.string().optional(),
    venueCapacity: z.string().optional(),
    // Virtual fields (for ONLINE/HYBRID)
    virtualPlatform: z.string().optional(),
    virtualMeetingUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    virtualMeetingId: z.string().optional(),
    virtualPassword: z.string().optional(),
    virtualInstructions: z.string().optional(),
    // Branding
    primaryColor: z.string().optional(),
    logoUrl: z.string().url('Logo URL must be a valid URL').optional().or(z.literal('')),
    heroSubtitle: z.string().trim().optional(),
    bannerUrl: z.string().url('Banner URL must be a valid URL').optional().or(z.literal('')),
    primaryCtaLabel: z.string().trim().optional(),
    secondaryCtaLabel: z.string().trim().optional(),
    canvasState: z.any().optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export type EventFormValues = z.infer<typeof eventSchema>;

/**
 * EventFormPage provides a single-page form with collapsible sections for creating and editing events.
 */
export const EventFormPage: React.FC<EventFormPageProps> = ({ mode }) => {
  const { eventId, orgSlug } = useParams<{ eventId?: string; orgSlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { listPath } = useEventManagementPaths();
  const { data: myOrganizations = [], isLoading: isLoadingOrganizations } =
    useMyMemberOrganizations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(mode === 'edit');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    schedule: false,
    venue: false,
    virtual: false,
    branding: false,
    cta: false,
  });

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      mode: 'ONLINE',
      category: '',
      organizationId: '',
      capacity: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      // Venue defaults
      venueName: '',
      venueAddress: '',
      venueCity: '',
      venueState: '',
      venueCountry: '',
      venuePostalCode: '',
      venueCapacity: '',
      // Virtual defaults
      virtualPlatform: '',
      virtualMeetingUrl: '',
      virtualMeetingId: '',
      virtualPassword: '',
      virtualInstructions: '',
      // Branding defaults
      primaryColor: '#2563eb',
      logoUrl: '',
      heroSubtitle: '',
      bannerUrl: '',
      primaryCtaLabel: '',
      secondaryCtaLabel: '',
      canvasState: undefined,
    },
  });

  const { handleSubmit, reset, control } = form;
  
  // Watch mode to conditionally show venue/virtual sections
  const selectedMode = useWatch({ control, name: 'mode' });
  const showVenueSection = selectedMode === 'OFFLINE' || selectedMode === 'HYBRID';
  const showVirtualSection = selectedMode === 'ONLINE' || selectedMode === 'HYBRID';

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Find current organization from URL slug
  const currentOrganization = myOrganizations.find((org: any) => org.slug === orgSlug);

  // Auto-set organization when available
  useEffect(() => {
    if (mode === 'create' && currentOrganization && !form.getValues('organizationId')) {
      form.setValue('organizationId', currentOrganization.id);
    }
  }, [currentOrganization, mode, form]);

  useEffect(() => {
    const loadEvent = async () => {
      if (mode !== 'edit' || !eventId) return;
      try {
        setIsLoadingEvent(true);
        const { data, error } = await supabase
          .from('events')
          .select(
            'id, name, description, mode, start_date, end_date, capacity, visibility, status, created_at, updated_at, organization_id, branding, canvas_state',
          )
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: 'Event not found',
            description: 'The requested event could not be found.',
            variant: 'destructive',
          });
          navigate('../list');
          return;
        }

        const branding = data.branding as any;
        reset({
          name: data.name ?? '',
          description: data.description ?? '',
          mode: data.mode ?? 'ONLINE',
          category: (data as any).category ?? '',
          organizationId: data.organization_id ?? '',
          capacity: data.capacity != null ? String(data.capacity) : '',
          startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          registrationDeadline: '',
          // Venue fields
          venueName: branding?.venue?.name ?? '',
          venueAddress: branding?.venue?.address ?? '',
          venueCity: branding?.venue?.city ?? '',
          venueState: branding?.venue?.state ?? '',
          venueCountry: branding?.venue?.country ?? '',
          venuePostalCode: branding?.venue?.postalCode ?? '',
          venueCapacity: branding?.venue?.capacity != null ? String(branding.venue.capacity) : '',
          // Virtual fields
          virtualPlatform: branding?.virtualLinks?.platform ?? '',
          virtualMeetingUrl: branding?.virtualLinks?.meetingUrl ?? '',
          virtualMeetingId: branding?.virtualLinks?.meetingId ?? '',
          virtualPassword: branding?.virtualLinks?.password ?? '',
          virtualInstructions: branding?.virtualLinks?.instructions ?? '',
          // Branding
          primaryColor: branding?.primaryColor ?? '#2563eb',
          logoUrl: branding?.logoUrl ?? '',
          heroSubtitle: branding?.heroSubtitle ?? '',
          bannerUrl: branding?.bannerUrl ?? '',
          primaryCtaLabel: branding?.primaryCtaLabel ?? '',
          secondaryCtaLabel: branding?.secondaryCtaLabel ?? '',
          canvasState: (data as any).canvas_state ?? undefined,
        });
      } catch (err: any) {
        console.error('Failed to load event', err);
        toast({
          title: 'Failed to load event',
          description: err?.message || 'Please try again.',
          variant: 'destructive',
        });
        navigate('../list');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEvent();
  }, [mode, eventId, navigate, reset, toast]);

  const pageTitle = mode === 'create' ? 'Create Event' : 'Edit Event';

  const onSubmit = async (values: EventFormValues) => {
    if (isSubmitting) return;

    setServerError(null);

    try {
      setIsSubmitting(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        throw new Error('You must be logged in to create events.');
      }

      if (mode === 'create' && values.organizationId) {
        const { data: membership, error: membershipError } = await supabase
          .from('organization_memberships')
          .select('status, role')
          .eq('user_id', user.id)
          .eq('organization_id', values.organizationId)
          .maybeSingle();

        if (membershipError) throw membershipError;

        if (
          !membership ||
          membership.status !== 'ACTIVE' ||
          !['OWNER', 'ADMIN', 'ORGANIZER'].includes(membership.role)
        ) {
          throw new Error('You must be an active organizer for this organization to create events.');
        }
      }

      // Build venue object if applicable
      const venueData = (values.mode === 'OFFLINE' || values.mode === 'HYBRID') && values.venueName
        ? {
            name: values.venueName.trim(),
            address: values.venueAddress?.trim() || '',
            city: values.venueCity?.trim() || '',
            state: values.venueState?.trim() || '',
            country: values.venueCountry?.trim() || '',
            postalCode: values.venuePostalCode?.trim() || '',
            capacity: values.venueCapacity ? Number(values.venueCapacity) : undefined,
          }
        : undefined;

      // Build virtual links object if applicable
      const virtualLinksData = (values.mode === 'ONLINE' || values.mode === 'HYBRID') && values.virtualMeetingUrl
        ? {
            platform: values.virtualPlatform || 'other',
            meetingUrl: values.virtualMeetingUrl,
            meetingId: values.virtualMeetingId?.trim() || undefined,
            password: values.virtualPassword || undefined,
            instructions: values.virtualInstructions?.trim() || undefined,
          }
        : undefined;

      const payload: any = {
        name: values.name.trim(),
        description: values.description.trim(),
        mode: values.mode,
        category: values.category || null,
        start_date: values.startDate,
        end_date: values.endDate,
        capacity:
          values.capacity && values.capacity.trim() !== '' ? Number(values.capacity) : null,
        organization_id: values.organizationId,
        visibility: 'PUBLIC',
        branding: {
          primaryColor: values.primaryColor,
          logoUrl: values.logoUrl || undefined,
          heroSubtitle: values.heroSubtitle?.trim() || undefined,
          bannerUrl: values.bannerUrl || undefined,
          primaryCtaLabel: values.primaryCtaLabel?.trim() || undefined,
          secondaryCtaLabel: values.secondaryCtaLabel?.trim() || undefined,
          venue: venueData,
          virtualLinks: virtualLinksData,
        },
        owner_id: user.id,
        canvas_state: values.canvasState ?? null,
      };

      let createdEventId: string | undefined;

      if (mode === 'create') {
        payload.status = 'DRAFT';

        const { data, error } = await supabase
          .from('events')
          .insert(payload)
          .select('id')
          .maybeSingle();

        if (error) throw error;
        createdEventId = data?.id as string | undefined;
      } else {
        const { error } = await supabase.from('events').update(payload).eq('id', eventId);
        if (error) throw error;
      }

      toast({
        title: mode === 'create' ? 'Event draft saved' : 'Event updated',
        description:
          mode === 'create'
            ? 'Your event has been saved as a draft. Next, create a workspace to manage and publish it.'
            : 'Your changes have been saved.',
      });

      if (mode === 'create') {
        const currentPath = location.pathname;
        const orgSlugCandidate = currentPath.split('/')[1];
        const isOrgContext = !!orgSlugCandidate && orgSlugCandidate !== 'dashboard';
        const baseWorkspacePath = isOrgContext
          ? `/${orgSlugCandidate}/workspaces`
          : '/dashboard/workspaces';

        if (createdEventId) {
          navigate(`${baseWorkspacePath}/create?eventId=${createdEventId}`);
        } else {
          navigate(listPath);
        }
      } else {
        navigate(listPath);
      }
    } catch (err: any) {
      console.error('Failed to save event', err);
      const rawMessage = err?.message || 'Please try again.';

      const message = rawMessage;

      setServerError(message);
      toast({
        title: 'Failed to save event',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <SparklesIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {mode === 'create' 
                  ? 'Fill in the details to create your event' 
                  : 'Update your event information'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(listPath)}
              className="gap-2"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                const formEl = document.getElementById('event-form') as HTMLFormElement | null;
                if (formEl) {
                  if (typeof formEl.requestSubmit === 'function') {
                    formEl.requestSubmit();
                  } else {
                    formEl.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  }
                }
              }}
              disabled={isSubmitting || myOrganizations.length === 0}
              className="gap-2 shadow-lg shadow-primary/25"
            >
              <CheckIcon className="h-4 w-4" />
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Save & Continue'
                  : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {isLoadingEvent ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
            <p className="text-sm text-muted-foreground">Loading event...</p>
          </div>
        ) : (
          <Form {...form}>
            <form
              id="event-form"
              onSubmit={handleSubmit(onSubmit)}
              className="divide-y divide-border/50"
              noValidate
            >
              {serverError && (
                <div className="p-4 sm:p-6">
                  <Alert variant="destructive">
                    <AlertTitle>Failed to save event</AlertTitle>
                    <AlertDescription>
                      <p>{serverError}</p>
                      {serverError.includes('organizer/admin permissions') && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 border-destructive text-destructive hover:bg-destructive/10"
                          disabled={isRequestingAccess}
                          onClick={async () => {
                            if (isRequestingAccess) return;
                            setIsRequestingAccess(true);
                            try {
                              const { error } = await supabase.functions.invoke(
                                'self-approve-organizer',
                              );
                              if (error) throw error;
                              toast({
                                title: 'Organizer access requested',
                                description:
                                  'We have recorded your request to become an organizer. Try again after your access updates.',
                              });
                            } catch (err: any) {
                              toast({
                                title: 'Failed to request organizer access',
                                description: err?.message || 'Please try again.',
                                variant: 'destructive',
                              });
                            } finally {
                              setIsRequestingAccess(false);
                            }
                          }}
                        >
                          {isRequestingAccess ? 'Requesting…' : 'Request organizer access'}
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Basic Information Section */}
              <Collapsible
                open={openSections.basic}
                onOpenChange={() => toggleSection('basic')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Basic Information"
                    description="Name, organization, description, and format"
                    icon={SparklesIcon}
                    isOpen={openSections.basic}
                    stepNumber={1}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    {/* Organization Display */}
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Creating under</p>
                          {isLoadingOrganizations ? (
                            <p className="text-sm text-muted-foreground">Loading...</p>
                          ) : currentOrganization ? (
                            <p className="font-medium text-foreground">{currentOrganization.name}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No organization found</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event name *</FormLabel>
                          <FormControl>
                            <Input 
                              type="text" 
                              placeholder="e.g. Campus DevFest 2025" 
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This appears on your landing page and emails — keep it short and clear.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Share what makes this event special"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            A quick overview that helps attendees understand who this event is for.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="mode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event mode *</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...field}
                              >
                                <option value="ONLINE">🌐 Online</option>
                                <option value="OFFLINE">📍 In-Person</option>
                                <option value="HYBRID">🔄 Hybrid</option>
                              </select>
                            </FormControl>
                            <FormDescription>
                              Choose how people will join.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event category</FormLabel>
                            <FormControl>
                              <select
                                className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                {...field}
                              >
                                <option value="">Select category...</option>
                                {Object.entries(categoryLabels).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormDescription>
                              Helps attendees discover your event.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="capacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Capacity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 150" 
                                className="h-11"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: set a soft cap.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Schedule Section */}
              <Collapsible
                open={openSections.schedule}
                onOpenChange={() => toggleSection('schedule')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Date & Schedule"
                    description="When your event starts and ends"
                    icon={CalendarDaysIcon}
                    isOpen={openSections.schedule}
                    stepNumber={2}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="startDate"
                        render={({ field }) => {
                          const dateValue = field.value ? new Date(field.value) : undefined;
                          return (
                            <FormItem>
                              <FormLabel>Start date & time *</FormLabel>
                              <FormControl>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        'w-full h-11 justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>Select start date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={dateValue}
                                      onSelect={(date) => {
                                        if (!date) {
                                          field.onChange('');
                                          return;
                                        }
                                        const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                                        field.onChange(formatted);
                                      }}
                                      initialFocus
                                      className={cn('p-3 pointer-events-auto')}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={control}
                        name="endDate"
                        render={({ field }) => {
                          const dateValue = field.value ? new Date(field.value) : undefined;
                          return (
                            <FormItem>
                              <FormLabel>End date & time *</FormLabel>
                              <FormControl>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        'w-full h-11 justify-start text-left font-normal',
                                        !dateValue && 'text-muted-foreground',
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateValue ? (
                                        format(dateValue, 'PPP p')
                                      ) : (
                                        <span>Select end date</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={dateValue}
                                      onSelect={(date) => {
                                        if (!date) {
                                          field.onChange('');
                                          return;
                                        }
                                        const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                                        field.onChange(formatted);
                                      }}
                                      initialFocus
                                      className={cn('p-3 pointer-events-auto')}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="registrationDeadline"
                      render={({ field }) => {
                        const dateValue = field.value ? new Date(field.value) : undefined;
                        return (
                          <FormItem>
                            <FormLabel>Registration deadline</FormLabel>
                            <FormControl>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                      'w-full h-11 justify-start text-left font-normal',
                                      !dateValue && 'text-muted-foreground',
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateValue ? (
                                      format(dateValue, 'PPP p')
                                    ) : (
                                      <span>Optional: set registration cutoff</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={dateValue}
                                    onSelect={(date) => {
                                      if (!date) {
                                        field.onChange('');
                                        return;
                                      }
                                      const formatted = format(date, "yyyy-MM-dd'T'HH:mm");
                                      field.onChange(formatted);
                                    }}
                                    initialFocus
                                    className={cn('p-3 pointer-events-auto')}
                                  />
                                </PopoverContent>
                              </Popover>
                            </FormControl>
                            <FormDescription>
                              If set, registrations will automatically close after this time.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Location & Venue Section - Conditional */}
              {showVenueSection && (
                <Collapsible
                  open={openSections.venue}
                  onOpenChange={() => toggleSection('venue')}
                >
                  <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                    <SectionHeader
                      title="Location & Venue"
                      description="Physical venue details for in-person attendance"
                      icon={MapPinIcon}
                      isOpen={openSections.venue}
                      stepNumber={3}
                      isConditional
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-accent/30 ml-7 mr-4">
                      <div className="rounded-xl border border-border/50 bg-accent/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          📍 These details will be shown to attendees for your <span className="font-medium text-foreground">{selectedMode === 'HYBRID' ? 'in-person' : 'offline'}</span> event.
                        </p>
                      </div>

                      <FormField
                        control={control}
                        name="venueName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue name</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="e.g. Tech Hub Convention Center"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Name of the venue or building.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="venueAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street address</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="123 Main Street, Suite 100"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="venueCity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Chennai"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="venueState"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State / Province</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. Tamil Nadu"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="venueCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. India"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="venuePostalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal code</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. 600001"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="venueCapacity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue capacity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g. 500"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum attendees the venue can accommodate.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Virtual Platform Section - Conditional */}
              {showVirtualSection && (
                <Collapsible
                  open={openSections.virtual}
                  onOpenChange={() => toggleSection('virtual')}
                >
                  <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                    <SectionHeader
                      title="Virtual Platform"
                      description="Online meeting details for virtual attendance"
                      icon={VideoCameraIcon}
                      isOpen={openSections.virtual}
                      stepNumber={showVenueSection ? 4 : 3}
                      isConditional
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-accent/30 ml-7 mr-4">
                      <div className="rounded-xl border border-border/50 bg-accent/5 p-4">
                        <p className="text-sm text-muted-foreground">
                          🎥 These details will be shared with attendees joining <span className="font-medium text-foreground">online</span>.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="virtualPlatform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Platform</FormLabel>
                              <FormControl>
                                <select
                                  className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                  {...field}
                                >
                                  <option value="">Select platform...</option>
                                  {virtualPlatforms.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                              </FormControl>
                              <FormDescription>
                                Video conferencing platform you'll use.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="virtualMeetingId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting ID</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g. 123 456 7890"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Optional meeting ID or room code.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="virtualMeetingUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://zoom.us/j/123456789"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              The link attendees will use to join.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="virtualPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Meeting password</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="Optional password"
                                  className="h-11"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Password required to join (if any).
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={control}
                        name="virtualInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Joining instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={3}
                                placeholder="Any additional instructions for joining the virtual session..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Tips or requirements for attendees (e.g., download app beforehand).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Branding Section */}
              <Collapsible
                open={openSections.branding}
                onOpenChange={() => toggleSection('branding')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Branding"
                    description="Visual identity for your event page"
                    icon={PaintBrushIcon}
                    isOpen={openSections.branding}
                    stepNumber={showVenueSection && showVirtualSection ? 5 : (showVenueSection || showVirtualSection ? 4 : 3)}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary color</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="color"
                                  className="h-11 w-16 cursor-pointer p-1"
                                  {...field}
                                />
                                <Input
                                  type="text"
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="#2563eb"
                                  className="h-11 flex-1 font-mono text-sm"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Accent color for buttons and highlights.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="heroSubtitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hero subtitle</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="A catchy tagline"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Short elevator pitch under your title.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/logo.png"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: paste a direct image URL for the header.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name="bannerUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hero banner image URL</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://example.com/hero-banner.jpg"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: wide image for the top of your landing page.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* CTA Section */}
              <Collapsible
                open={openSections.cta}
                onOpenChange={() => toggleSection('cta')}
              >
                <CollapsibleTrigger className="w-full hover:bg-muted/30 transition-colors">
                  <SectionHeader
                    title="Call to Action"
                    description="Button labels for your event page"
                    icon={CursorArrowRaysIcon}
                    isOpen={openSections.cta}
                    stepNumber={4}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 sm:px-6 pb-6 space-y-6 border-l-2 border-primary/20 ml-7 mr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={control}
                        name="primaryCtaLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary button label</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                placeholder="Register now" 
                                className="h-11"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Main call-to-action on your event hero.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={control}
                        name="secondaryCtaLabel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary button label</FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Learn more"
                                className="h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional: softer action for schedule, FAQ, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Form Actions - Sticky Footer */}
              <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    {mode === 'create' 
                      ? 'Fill required fields to continue' 
                      : 'Changes save immediately'}
                  </p>
                  <div className="flex items-center gap-3 ml-auto">
                    <Button type="button" variant="ghost" onClick={() => navigate(listPath)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || myOrganizations.length === 0}
                      className="min-w-[140px] shadow-lg shadow-primary/25"
                    >
                      {isSubmitting
                        ? 'Saving...'
                        : mode === 'create'
                          ? 'Save & Continue'
                          : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default EventFormPage;

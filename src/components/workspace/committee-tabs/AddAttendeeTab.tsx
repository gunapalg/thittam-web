import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  UserPlus,
  Mail,
  Phone,
  Ticket,
  Send,
  Users,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { Workspace } from '@/types';
import { useForm } from 'react-hook-form';

interface AddAttendeeTabProps {
  workspace: Workspace;
}

interface AttendeeFormData {
  fullName: string;
  email: string;
  phone?: string;
  ticketType: string;
  notes?: string;
  sendConfirmation: boolean;
}

const ticketTypes = [
  { id: 'vip', name: 'VIP Pass', price: 150, available: 25 },
  { id: 'general', name: 'General Admission', price: 50, available: 234 },
  { id: 'student', name: 'Student', price: 25, available: 100 },
  { id: 'speaker', name: 'Speaker', price: 0, available: 10 },
  { id: 'sponsor', name: 'Sponsor', price: 0, available: 50 },
];

export function AddAttendeeTab({ workspace: _workspace }: AddAttendeeTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEmails, setBulkEmails] = useState<string[]>(['']);
  const [recentlyAdded, setRecentlyAdded] = useState<{ name: string; email: string; ticket: string }[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AttendeeFormData>({
    defaultValues: {
      ticketType: 'general',
      sendConfirmation: true,
    }
  });

  const selectedTicketType = watch('ticketType');

  const onSubmit = async (data: AttendeeFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newAttendee = {
      name: data.fullName,
      email: data.email,
      ticket: ticketTypes.find(t => t.id === data.ticketType)?.name || data.ticketType,
    };
    
    setRecentlyAdded(prev => [newAttendee, ...prev].slice(0, 5));
    
    if (data.sendConfirmation) {
      toast.success('Attendee added & confirmation sent!', {
        description: `${data.fullName} has been registered for ${newAttendee.ticket}`,
      });
    } else {
      toast.success('Attendee added successfully!', {
        description: `${data.fullName} registered - no email sent`,
      });
    }
    
    reset({ ticketType: 'general', sendConfirmation: true });
    setIsSubmitting(false);
  };

  const handleBulkAdd = async () => {
    const validEmails = bulkEmails.filter(e => e.trim() && e.includes('@'));
    if (validEmails.length === 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`${validEmails.length} attendees invited!`, {
      description: 'Invitation emails have been sent',
    });
    
    setBulkEmails(['']);
    setIsSubmitting(false);
  };

  const addBulkEmailField = () => {
    setBulkEmails(prev => [...prev, '']);
  };

  const updateBulkEmail = (index: number, value: string) => {
    setBulkEmails(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeBulkEmail = (index: number) => {
    setBulkEmails(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-500" />
            Add Attendee
          </h2>
          <p className="text-muted-foreground mt-1">Manually register new attendees or send bulk invitations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!bulkMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBulkMode(false)}
          >
            Single
          </Button>
          <Button
            variant={bulkMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBulkMode(true)}
          >
            <Users className="w-4 h-4 mr-1" />
            Bulk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {bulkMode ? 'Bulk Invitation' : 'Registration Form'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!bulkMode ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter full name"
                        {...register('fullName', { required: 'Name is required' })}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          {...register('email', { 
                            required: 'Email is required',
                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                          })}
                          className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+1 (555) 000-0000"
                          {...register('phone')}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ticket Type *</Label>
                      <Select 
                        value={selectedTicketType} 
                        onValueChange={(value) => setValue('ticketType', value)}
                      >
                        <SelectTrigger>
                          <Ticket className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Select ticket" />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketTypes.map(ticket => (
                            <SelectItem key={ticket.id} value={ticket.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{ticket.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  {ticket.price > 0 ? `$${ticket.price}` : 'Free'} · {ticket.available} left
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Special requirements, dietary restrictions, etc."
                      {...register('notes')}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sendConfirmation" 
                      checked={watch('sendConfirmation')}
                      onCheckedChange={(checked) => setValue('sendConfirmation', !!checked)}
                    />
                    <Label htmlFor="sendConfirmation" className="text-sm font-normal cursor-pointer">
                      Send confirmation email with ticket
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Attendee
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => reset()}>
                      Clear
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter email addresses to send registration invitations. Recipients will receive a link to complete their registration.
                  </p>
                  
                  <div className="space-y-3">
                    {bulkEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => updateBulkEmail(index, e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        {bulkEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBulkEmail(index)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" onClick={addBulkEmailField} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Email
                  </Button>

                  <div className="space-y-2">
                    <Label>Ticket Type for All</Label>
                    <Select defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map(ticket => (
                          <SelectItem key={ticket.id} value={ticket.id}>{ticket.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleBulkAdd} 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {bulkEmails.filter(e => e.trim()).length} Invitation(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ticket Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketTypes.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <span className="text-sm">{ticket.name}</span>
                  <Badge variant={ticket.available > 20 ? 'outline' : 'secondary'} className={ticket.available < 10 ? 'bg-amber-500/10 text-amber-600' : ''}>
                    {ticket.available} left
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recently Added */}
          {recentlyAdded.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Recently Added
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentlyAdded.map((attendee, index) => (
                  <div key={index} className="p-2 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">{attendee.name}</p>
                    <p className="text-xs text-muted-foreground">{attendee.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{attendee.ticket}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

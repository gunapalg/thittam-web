import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  workspace_id: string;
  notification_type: 'broadcast' | 'task_assignment' | 'deadline_reminder' | 'channel_message';
  title: string;
  message: string;
  metadata?: {
    task_id?: string;
    channel_id?: string;
    sender_name?: string;
    due_date?: string;
    priority?: string;
    url?: string;
  };
}

interface Integration {
  id: string;
  platform: 'slack' | 'discord' | 'teams' | 'webhook';
  webhook_url: string;
  notification_types: string[];
}

// Format message for Slack
function formatSlackMessage(payload: WebhookPayload) {
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: payload.title,
        emoji: true
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: payload.message
      }
    }
  ];

  if (payload.metadata?.url) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "View in App",
            emoji: true
          },
          url: payload.metadata.url
        }
      ]
    });
  }

  return {
    blocks,
    text: `${payload.title}: ${payload.message}`
  };
}

// Format message for Discord
function formatDiscordMessage(payload: WebhookPayload) {
  const embed: any = {
    title: payload.title,
    description: payload.message,
    color: getColorForType(payload.notification_type),
    timestamp: new Date().toISOString()
  };

  if (payload.metadata?.sender_name) {
    embed.author = { name: payload.metadata.sender_name };
  }

  if (payload.metadata?.url) {
    embed.url = payload.metadata.url;
  }

  const fields = [];
  if (payload.metadata?.priority) {
    fields.push({ name: "Priority", value: payload.metadata.priority, inline: true });
  }
  if (payload.metadata?.due_date) {
    fields.push({ name: "Due Date", value: payload.metadata.due_date, inline: true });
  }
  if (fields.length > 0) {
    embed.fields = fields;
  }

  return { embeds: [embed] };
}

// Format message for Microsoft Teams
function formatTeamsMessage(payload: WebhookPayload) {
  const card: any = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: getColorHexForType(payload.notification_type),
    summary: payload.title,
    sections: [
      {
        activityTitle: payload.title,
        activitySubtitle: payload.metadata?.sender_name || "System",
        text: payload.message
      }
    ]
  };

  if (payload.metadata?.url) {
    card.potentialAction = [
      {
        "@type": "OpenUri",
        name: "View in App",
        targets: [{ os: "default", uri: payload.metadata.url }]
      }
    ];
  }

  return card;
}

// Format for generic webhook
function formatGenericWebhook(payload: WebhookPayload) {
  return {
    type: payload.notification_type,
    title: payload.title,
    message: payload.message,
    metadata: payload.metadata,
    timestamp: new Date().toISOString()
  };
}

function getColorForType(type: string): number {
  switch (type) {
    case 'broadcast': return 0x3B82F6; // blue
    case 'task_assignment': return 0x10B981; // green
    case 'deadline_reminder': return 0xF59E0B; // amber
    default: return 0x6B7280; // gray
  }
}

function getColorHexForType(type: string): string {
  switch (type) {
    case 'broadcast': return '3B82F6';
    case 'task_assignment': return '10B981';
    case 'deadline_reminder': return 'F59E0B';
    default: return '6B7280';
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    console.log('Received webhook notification request:', payload);

    // Validate required fields
    if (!payload.workspace_id || !payload.notification_type || !payload.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: workspace_id, notification_type, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active integrations for this workspace that handle this notification type
    const { data: integrations, error: fetchError } = await supabase
      .from('workspace_integrations')
      .select('id, platform, webhook_url, notification_types')
      .eq('workspace_id', payload.workspace_id)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching integrations:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch integrations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter integrations that handle this notification type
    const relevantIntegrations = (integrations || []).filter((int: Integration) =>
      int.notification_types.includes(payload.notification_type)
    );

    console.log(`Found ${relevantIntegrations.length} relevant integrations for ${payload.notification_type}`);

    if (relevantIntegrations.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No active integrations for this notification type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send to all relevant integrations
    const results = await Promise.allSettled(
      relevantIntegrations.map(async (integration: Integration) => {
        let body: any;
        
        switch (integration.platform) {
          case 'slack':
            body = formatSlackMessage(payload);
            break;
          case 'discord':
            body = formatDiscordMessage(payload);
            break;
          case 'teams':
            body = formatTeamsMessage(payload);
            break;
          default:
            body = formatGenericWebhook(payload);
        }

        console.log(`Sending to ${integration.platform}:`, integration.webhook_url);
        
        const response = await fetch(integration.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${integration.platform} webhook failed: ${response.status} - ${errorText}`);
        }

        return { platform: integration.platform, success: true };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
      console.error('Some webhooks failed:', failed);
    }

    console.log(`Webhook notification complete: ${successful}/${relevantIntegrations.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successful, 
        total: relevantIntegrations.length,
        failures: failed.map(f => (f as PromiseRejectedResult).reason?.message)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

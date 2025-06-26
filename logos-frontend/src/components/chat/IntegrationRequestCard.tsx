"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PngIcon from "@/components/ui/png-icon";
import { ExternalLink, Check, Loader2 } from "lucide-react";

interface IntegrationRequestCardProps {
  provider: string;
  description?: string;
  onConnect?: () => void;
}

const integrationConfig: Record<
  string,
  {
    name: string;
    icon: string;
    description: string;
    connectUrl: string;
  }
> = {
  gcal: {
    name: "Google Calendar",
    icon: "/gcal.png",
    description: "Access your calendar events and schedule",
    connectUrl: "/api/integrations/gcal",
  },
  gmail: {
    name: "Gmail",
    icon: "/gmail.png",
    description: "Send and manage your emails",
    connectUrl: "/api/integrations/gmail",
  },
  gsheets: {
    name: "Google Sheets",
    icon: "/gsheets.png",
    description: "Read and write to your spreadsheets",
    connectUrl: "/api/integrations/gsheets",
  },
  airtable: {
    name: "Airtable",
    icon: "/airtable.png",
    description: "Access your Airtable databases",
    connectUrl: "/api/integrations/airtable",
  },
  // slack: {
  //   name: "Slack",
  //   icon: "/slack.png",
  //   description: "Send messages and notifications to Slack",
  //   connectUrl: "/api/integrations/slack"
  // }
};

export function IntegrationRequestCard({
  provider,
  description,
  onConnect,
}: IntegrationRequestCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const integration = integrationConfig[provider];

  if (!integration) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Unknown integration: {provider}
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleConnect = () => {
    setIsConnecting(true);

    // The existing API endpoints handle OAuth flow via direct redirects
    // Open the integration URL in a new window for OAuth flow
    const oauthWindow = window.open(
      integration.connectUrl,
      "_blank",
      "width=500,height=600,scrollbars=yes,resizable=yes",
    );

    // Listen for the OAuth completion by checking the window URL
    const checkAuthStatus = setInterval(() => {
      try {
        // Check if window is closed
        if (oauthWindow?.closed) {
          clearInterval(checkAuthStatus);
          setIsConnecting(false);
          return;
        }

        // Try to access the window URL to check for success parameter
        const windowUrl = oauthWindow?.location?.href;
        if (windowUrl && windowUrl.includes("success=true")) {
          clearInterval(checkAuthStatus);
          setIsConnected(true);
          setIsConnecting(false);
          onConnect?.();
          oauthWindow?.close();
        } else if (windowUrl && windowUrl.includes("error")) {
          clearInterval(checkAuthStatus);
          setIsConnecting(false);
          oauthWindow?.close();
        }
      } catch {
        // Cross-origin error when trying to access window.location
        // This is expected when the OAuth provider redirects to their domain
        // We'll continue checking until the window closes or redirects back
      }
    }, 1000);

    // Fallback: stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkAuthStatus);
      if (isConnecting) {
        setIsConnecting(false);
      }
    }, 300000);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <PngIcon src={integration.icon} alt={integration.name} size={24} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {integration.name}
              {isConnected && (
                <Badge
                  variant="default"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {description || integration.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="p-3 bg-muted/50 rounded-lg border">
            <p className="text-sm text-muted-foreground">
              <strong>Required for:</strong> Accessing and managing your{" "}
              {integration.name.toLowerCase()} data
            </p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting || isConnected}
            className="w-full"
            variant={isConnected ? "outline" : "default"}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Connected
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect {integration.name}
              </>
            )}
          </Button>

          {!isConnected && !isConnecting && (
            <p className="text-xs text-muted-foreground text-center">
              You&apos;ll be redirected to authorize access safely
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import React from "react";
import { Integration } from "@/types/integrations";
import PngIcon from "@/components/ui/png-icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import IntegrationButton from "./IntegrationButton";
import { Puzzle } from "lucide-react";

interface IntegrationsUIProps {
  enabledIntegrations: string[];
}

const integrations: Integration[] = [
  {
    id: "gcal",
    name: "Google Calendar",
    description:
      "Sync your calendar events and schedule agent tasks automatically.",
    icon: <PngIcon src="/gcal.png" alt="Google Calendar" size={24} />,
    enabled: false,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Process emails and automate responses with AI agents.",
    icon: <PngIcon src="/gmail.png" alt="Gmail" size={24} />,
    enabled: false,
  },
  {
    id: "slack",
    name: "Slack",
    description:
      "Integrate with Slack for real-time notifications and commands.",
    icon: <PngIcon src="/slack.png" alt="Slack" size={24} />,
    enabled: false,
  },
  {
    id: "gsheets",
    name: "Google Sheets",
    description: "Sync your Google Sheets data with your AI agents.",
    icon: <PngIcon src="/gsheets.png" alt="Google Sheets" size={24} />,
    enabled: false,
  },
  {
    id: "airtable",
    name: "Airtable",
    description: "Sync your Airtable data with your AI agents.",
    icon: <PngIcon src="/airtable.png" alt="Airtable" size={24} />,
    enabled: false,
  },
  {
    id: "gdrive",
    name: "Google Drive",
    description: "Access and manage your Google Drive files with AI agents.",
    icon: <PngIcon src="/gdrive.png" alt="Google Drive" size={24} />,
    enabled: false,
  },
];

export function IntegrationsUI({ enabledIntegrations }: IntegrationsUIProps) {
  const updatedIntegrations = integrations.map((integration) => ({
    ...integration,
    enabled: enabledIntegrations.includes(integration.id),
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-primary">Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite tools and services to enhance your AI agents.
        </p>
      </div>

      {updatedIntegrations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {updatedIntegrations.map((integration) => (
            <Card
              key={integration.id}
              className="rounded-xl shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-[var(--background)] to-[var(--muted)] border border-border flex flex-col"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 rounded-lg bg-card/50 border border-border shadow-sm">
                  {integration.icon}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-primary">
                    {integration.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                <CardDescription className="text-muted-foreground mb-4 flex-grow">
                  {integration.description}
                </CardDescription>
                <div className="mt-auto">
                  <IntegrationButton integration={integration} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-muted/30">
          <Puzzle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            No Integrations Available
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back later for more integration options.
          </p>
        </div>
      )}
    </div>
  );
}

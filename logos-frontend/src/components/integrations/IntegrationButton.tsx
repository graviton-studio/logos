// IntegrationButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Integration } from "@/types/integrations";
import { getBaseUrl } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface IntegrationButtonProps {
  integration: Integration;
}

export default function IntegrationButton({
  integration,
}: IntegrationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Redirect to our OAuth API routes
      window.location.href = `${getBaseUrl()}/api/integrations/${integration.id}`;
    } catch (error) {
      console.error(`Error connecting to ${integration.name}:`, error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const { error } = await fetch(
        `${getBaseUrl()}/api/integrations/${integration.id}/revoke`,
        {
          method: "POST",
        },
      ).then((res) => res.json());

      if (error) {
        console.error(`Error disconnecting ${integration.name}:`, error);
      }

      // Refresh the page to update the UI
      window.location.reload();
    } catch (error) {
      console.error(`Error disconnecting ${integration.name}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Button disabled variant="outline" className="w-32">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {integration.enabled ? "Disconnecting" : "Connecting"}
      </Button>
    );
  }

  if (integration.enabled) {
    return (
      <Button onClick={handleDisconnect} variant="destructive" className="w-32">
        Disconnect
      </Button>
    );
  }

  return (
    <Button onClick={handleConnect} variant="default" className="w-32">
      Connect
    </Button>
  );
}

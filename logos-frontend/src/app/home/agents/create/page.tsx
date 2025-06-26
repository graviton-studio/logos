"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Rocket,
  Loader2,
  AlertTriangle,
  Clock,
  Webhook,
  Brain,
  Zap,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { processAgentPrompt, saveAgent } from "@/app/actions/agent";
import { useRouter } from "next/navigation";
import { Agent, WorkflowStep } from "@/types/agent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import dynamic from "next/dynamic";
import useUser from "@/lib/hooks";
import { createClient } from "@/utils/supabase/client";
import { Badge } from "@/components/ui/badge";
import PngIcon from "@/components/ui/png-icon";
import { AgentProvider } from "@/contexts/AgentContext";

// Dynamically import the AgentFlow component with SSR disabled
const AgentFlow = dynamic(() => import("@/components/flow/AgentFlow"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full min-h-[400px] bg-muted/50 rounded-lg">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  ),
});

const STEPS = [
  { id: 1, name: "Define Agent" },
  { id: 2, name: "Design Workflow" },
  { id: 3, name: "Confirm & Deploy" },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentData, setAgentData] = useState<Partial<Agent> | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [enabledIntegrations, setEnabledIntegrations] = useState<string[]>([]);
  const [missingIntegrations, setMissingIntegrations] = useState<string[]>([]);

  const { user } = useUser();

  // Fetch enabled integrations
  const fetchEnabledIntegrations = async () => {
    if (!user?.id) return;

    const supabase = createClient();
    const { data: credentials, error } = await supabase
      .from("oauth_credentials")
      .select("provider")
      .eq("user_id", user.id);

    if (!error && credentials) {
      const enabled = credentials.map((cred) => cred.provider);
      setEnabledIntegrations(enabled);
    }
  };

  // Check for missing integrations when agent data changes
  const checkMissingIntegrations = () => {
    if (!agentData?.structured_instructions?.integrations) {
      setMissingIntegrations([]);
      return;
    }

    const requiredIntegrations =
      agentData.structured_instructions.integrations.map((integration) => {
        // Map display names to provider IDs
        const nameToProvider: Record<string, string> = {
          "Google Calendar": "gcal",
          Gmail: "gmail",
          "Google Sheets": "gsheets",
          Airtable: "airtable",
          Slack: "slack",
          "Google Drive": "gdrive",
        };
        return (
          nameToProvider[integration.name] || integration.name.toLowerCase()
        );
      });

    const missing = requiredIntegrations.filter(
      (provider) => !enabledIntegrations.includes(provider),
    );

    setMissingIntegrations(missing);
  };

  // Fetch integrations on component mount
  React.useEffect(() => {
    fetchEnabledIntegrations();
  }, [user?.id]);

  // Check for missing integrations when agent data or enabled integrations change
  React.useEffect(() => {
    checkMissingIntegrations();
  }, [agentData, enabledIntegrations]);

  const handleNext = async () => {
    if (currentStep === 1) {
      setIsLoading(true);
      setError(null);
      try {
        if (!prompt.trim()) {
          setError("Please provide a prompt for your agent.");
          setIsLoading(false);
          return;
        }
        const result = await processAgentPrompt(prompt, agentName);
        if (result.agent) {
          setAgentData(result.agent);
          setAgentName(result.agent.name || agentName);
          setCurrentStep(2);
        } else {
          setError(
            result.error ||
              "An unknown error occurred while processing the prompt.",
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to process prompt.");
      }
      setIsLoading(false);
    } else if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDeploy();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDeploy = async () => {
    if (!agentData) {
      setError("Agent data is missing. Cannot deploy.");
      return;
    }
    if (!user?.id) {
      setError("User not authenticated. Cannot deploy.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const finalAgentData = {
        ...agentData,
        name: agentName || agentData.name,
        prompt: prompt || agentData.prompt,
      };
      const result = await saveAgent(finalAgentData, user.id);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/home/agents/${result.agentID}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during deployment.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForType = (type: WorkflowStep["type"]) => {
    switch (type) {
      case "trigger":
        return <Clock className="h-4 w-4 text-primary" />;
      case "input":
        return <Webhook className="h-4 w-4 text-secondary" />;
      case "process":
        return <Brain className="h-4 w-4 text-foreground" />;
      case "output":
        return <Zap className="h-4 w-4 text-accent" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/home/agents"
          className="flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Link>

        <h1 className="text-3xl font-bold mb-1 text-primary">
          Create New Agent
        </h1>
        <p className="text-muted-foreground">
          Define, design, and deploy your AI agent in 3 simple steps.
        </p>
      </div>

      {/* Progress bar (Steps) */}
      <div className="mb-8 overflow-x-auto">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
            {STEPS.map((step) => (
              <li key={step.name} className="flex-1">
                {currentStep > step.id ? (
                  <div className="group flex w-full flex-col border-l-4 border-primary py-2 pl-2 sm:pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                    <span className="text-xs font-medium text-primary transition-colors ">
                      Step {step.id}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {step.name}
                    </span>
                  </div>
                ) : currentStep === step.id ? (
                  <div
                    className="flex w-full flex-col border-l-4 border-primary py-2 pl-2 sm:pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                    aria-current="step"
                  >
                    <span className="text-xs font-medium text-primary">
                      Step {step.id}
                    </span>
                    <span className="text-sm font-medium text-primary">
                      {step.name}
                    </span>
                  </div>
                ) : (
                  <div className="group flex w-full flex-col border-l-4 border-border py-2 pl-2 sm:pl-4 transition-colors hover:border-muted-foreground/60 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                    <span className="text-xs font-medium text-muted-foreground/80 transition-colors group-hover:text-muted-foreground ">
                      Step {step.id}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {step.name}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Missing integrations alert */}
      {missingIntegrations.length > 0 && (
        <Alert className="mb-6 border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Integrations Required</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Your agent requires the following integrations that you
              haven&apos;t enabled yet:
            </p>
            <div className="flex flex-wrap gap-2">
              {missingIntegrations.map((provider) => {
                const integrationIcons: Record<
                  string,
                  { src: string; name: string }
                > = {
                  gcal: { src: "/gcal.png", name: "Google Calendar" },
                  gmail: { src: "/gmail.png", name: "Gmail" },
                  gsheets: { src: "/gsheets.png", name: "Google Sheets" },
                  airtable: { src: "/airtable.png", name: "Airtable" },
                  slack: { src: "/slack.png", name: "Slack" },
                };
                const integration = integrationIcons[provider];
                return (
                  <Badge
                    key={provider}
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-1.5"
                  >
                    {integration && (
                      <PngIcon
                        src={integration.src}
                        alt={integration.name}
                        size={16}
                      />
                    )}
                    <span>{integration?.name || provider}</span>
                  </Badge>
                );
              })}
            </div>
            <p className="text-sm">
              Please{" "}
              <Link
                href="/home/integrations"
                className="font-medium underline hover:no-underline"
              >
                enable these integrations
              </Link>{" "}
              before deploying your agent.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Define Agent */}
      {currentStep === 1 && (
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">
              Step 1: Define Your Agent
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Start by telling us what your agent should do. You can also give
              it a name.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="agentName"
                className="text-sm font-medium text-foreground"
              >
                Agent Name (Optional)
              </label>
              <Input
                id="agentName"
                placeholder="e.g., Daily Meeting Summarizer"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="bg-input border-border placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="prompt"
                className="text-sm font-medium text-foreground"
              >
                What should this agent do?
              </label>
              <Textarea
                id="prompt"
                placeholder="Describe the agent's task, e.g., 'Summarize my Google Calendar meetings for tomorrow and email them to me.'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="bg-input border-border placeholder:text-muted-foreground"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t border-border pt-6 justify-end">
            <Button
              variant="default"
              onClick={handleNext}
              disabled={isLoading || !prompt.trim()}
              className="hover:shadow-primary/25"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Next: Design Workflow
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Design Workflow */}
      {currentStep === 2 && agentData && (
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">
              Step 2: Design Workflow
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Review and modify the auto-generated workflow for your agent. This
              is a visual representation of the steps your agent will take.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-black rounded-lg border border-border p-2 h-[500px]">
              <div
                className="h-full w-full"
                style={{
                  ["--xy-attribution-background-color-default" as string]:
                    "rgba(30, 41, 59, 0.7)",
                }}
              >
                <AgentProvider initialAgent={agentData}>
                  <AgentFlow />
                </AgentProvider>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-border pt-6 justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isLoading}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="default"
              onClick={handleNext}
              disabled={isLoading}
              className="hover:shadow-primary/25"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Next: Confirm & Deploy
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Confirm and deploy */}
      {currentStep === 3 && agentData && (
        <Card className="rounded-xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">
              Step 3: Confirm and Deploy
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Review your agent&apos;s configuration. If everything looks good,
              deploy it!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Agent Name
              </h3>
              <p className="text-lg font-semibold text-foreground">
                {agentName || agentData.name || "Not Set"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Objective
              </h3>
              <p className="text-foreground">
                {agentData.structured_instructions?.objective ||
                  agentData.prompt ||
                  "Not Set"}
              </p>
            </div>

            {agentData.structured_instructions?.workflow &&
              agentData.structured_instructions.workflow.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Workflow Steps
                  </h3>
                  <ul className="space-y-3">
                    {agentData.structured_instructions.workflow.map(
                      (step, index) => (
                        <li
                          key={index}
                          className="flex items-start p-3 bg-muted/50 border border-border rounded-md"
                        >
                          <div className="flex-shrink-0 mr-3 pt-0.5">
                            {getIconForType(step.type)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {step.step}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

            {agentData.structured_instructions?.integrations &&
              agentData.structured_instructions.integrations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Required Integrations
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {agentData.structured_instructions.integrations.map(
                      (integration, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-full text-xs"
                        >
                          {integration.name === "Google Calendar" && (
                            <Clock className="h-3.5 w-3.5 text-primary" />
                          )}
                          {integration.name === "Gmail" && (
                            <Zap className="h-3.5 w-3.5 text-accent" />
                          )}
                          <span className="text-foreground">
                            {integration.name}
                          </span>
                          <span className="text-muted-foreground">
                            ({integration.type})
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {agentData.structured_instructions?.schedule && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Trigger / Schedule
                </h3>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-full text-xs w-fit">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-foreground">
                    {agentData.structured_instructions.schedule}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-border pt-6 justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isLoading}
              className="text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              variant="default"
              onClick={handleDeploy}
              disabled={isLoading}
              className="hover:shadow-primary/25"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4 mr-2" />
              )}
              Deploy Agent
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

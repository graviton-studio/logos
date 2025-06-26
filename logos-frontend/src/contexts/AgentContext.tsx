import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Agent } from "@/types/agent";

interface AgentContextType {
  agent: Agent | null;
  originalAgent: Agent | null;
  hasUnsavedChanges: boolean;
  setAgent: (agent: Agent | null) => void;
  updateNode: (
    nodeId: string,
    updates: { label?: string; description?: string },
  ) => void;
  resetChanges: () => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

interface AgentProviderProps {
  children: ReactNode;
  initialAgent: Partial<Agent> | null;
}

export function AgentProvider({ children, initialAgent }: AgentProviderProps) {
  const [agent, setAgentState] = useState<Agent | null>(
    initialAgent as Agent | null,
  );
  const [originalAgent, setOriginalAgent] = useState<Agent | null>(
    initialAgent ? (JSON.parse(JSON.stringify(initialAgent)) as Agent) : null,
  );

  const setAgent = useCallback((newAgent: Agent | null) => {
    setAgentState(newAgent);
  }, []);

  const updateNode = useCallback(
    (nodeId: string, updates: { label?: string; description?: string }) => {
      setAgentState((currentAgent) => {
        if (!currentAgent || !currentAgent.graph) return currentAgent;

        return {
          ...currentAgent,
          graph: {
            ...currentAgent.graph,
            nodes: currentAgent.graph.nodes.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    ...(updates.label !== undefined && {
                      label: updates.label,
                    }),
                    ...(updates.description !== undefined && {
                      description: updates.description,
                    }),
                  }
                : node,
            ),
          },
        };
      });
    },
    [],
  );

  const resetChanges = useCallback(() => {
    if (agent) {
      setOriginalAgent(JSON.parse(JSON.stringify(agent)));
    }
  }, [agent]);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = React.useMemo(() => {
    if (!agent || !originalAgent) return false;
    return JSON.stringify(agent.graph) !== JSON.stringify(originalAgent.graph);
  }, [agent, originalAgent]);

  const value: AgentContextType = {
    agent,
    originalAgent,
    hasUnsavedChanges,
    setAgent,
    updateNode,
    resetChanges,
  };

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
}

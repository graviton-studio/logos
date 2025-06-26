import { Agent } from "@/types/agent";
import { Position } from "@xyflow/react";
import { AgentFlowNode, AgentFlowEdge } from "@/components/flow/AgentFlow";

interface ParsedAgentGraph {
  nodes: AgentFlowNode[];
  edges: AgentFlowEdge[];
}

export const parseAgentGraph = (agent: Agent): ParsedAgentGraph => {
  if (!agent.graph) {
    return { nodes: [], edges: [] };
  }

  // Convert nodes
  const nodes: AgentFlowNode[] = agent.graph.nodes.map((node) => ({
    id: node.id,
    type: "agentNode", // Using our custom node type
    data: {
      label: node.label || node.type,
      type: node.type,
      description: node.description || JSON.stringify(node.config),
      config: node.config as Record<string, unknown>,
    },
    position: node.position,
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
  }));

  // Convert edges
  const edges: AgentFlowEdge[] = agent.graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source_id,
    target: edge.target_id,
    animated: true,
    type: "default",
    style: {
      stroke: "#3b82f6",
      strokeWidth: 2,
    },
  }));

  return { nodes, edges };
};

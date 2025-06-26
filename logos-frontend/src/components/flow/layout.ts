import Dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import { AgentFlowNode, AgentFlowEdge } from "./AgentFlow";

interface LayoutOptions {
  direction: "TB" | "LR";
  nodeWidth?: number;
  nodeHeight?: number;
  rankSeparation?: number;
  nodeSeparation?: number;
}

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 80;

export const getLayoutedElements = (
  nodes: AgentFlowNode[],
  edges: AgentFlowEdge[],
  options: LayoutOptions,
) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // Configure the graph
  g.setGraph({
    rankdir: options.direction,
    ranksep: options.rankSeparation || 80,
    nodesep: options.nodeSeparation || 50,
    edgesep: 50,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: options.nodeWidth || DEFAULT_NODE_WIDTH,
      height: options.nodeHeight || DEFAULT_NODE_HEIGHT,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Apply the layout
  Dagre.layout(g);

  // Get the positioned nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (options.nodeWidth || DEFAULT_NODE_WIDTH) / 2,
        y: nodeWithPosition.y - (options.nodeHeight || DEFAULT_NODE_HEIGHT) / 2,
      },
      // Ensure source/target positions are correct based on layout direction
      targetPosition: options.direction === "TB" ? Position.Top : Position.Left,
      sourcePosition:
        options.direction === "TB" ? Position.Bottom : Position.Right,
    };
  });

  return {
    nodes: layoutedNodes,
    edges,
  };
};

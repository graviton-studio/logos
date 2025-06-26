"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  BackgroundVariant,
  Position,
  Connection,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentNode from "./AgentNode";
import EditNodeModal from "./EditNodeModal";
import { Agent, NodeType as AgentNodeTypePrisma } from "@/types/agent";
import { parseAgentGraph } from "@/utils/agent";
import { getLayoutedElements } from "./layout";
import { Button } from "@/components/ui/button";
import { useAgent } from "@/contexts/AgentContext";

// Define node types for ReactFlow
const nodeTypes = {
  agentNode: AgentNode,
};

// Default viewport configuration
const defaultViewport = { x: 0, y: 0, zoom: 1 };

// This interface is for React Flow nodes, data.type should match what AgentNode expects
export interface AgentFlowNode extends Node {
  data: {
    label: string;
    type: AgentNodeTypePrisma;
    description?: string;
    config?: Record<string, unknown>;
  };
  // position, targetPosition, sourcePosition are part of the Node type
}

export interface AgentFlowEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
  type: string;
  style: {
    stroke: string;
    strokeWidth: number;
  };
}

const FlowContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<AgentFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AgentFlowEdge>([]);
  const { fitView } = useReactFlow();

  const [selectedNode, setSelectedNode] = useState<AgentFlowNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { agent, updateNode } = useAgent();

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: AgentFlowNode) => {
      setSelectedNode(node);
      setIsModalOpen(true);
    },
    [],
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNode(null);
  };

  const handleNodeSave = useCallback(
    (nodeId: string, updates: { label: string; description?: string }) => {
      // Update the nodes state for visual feedback
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: updates.label,
                  description: updates.description,
                },
              }
            : node,
        ),
      );

      // Update the agent context
      updateNode(nodeId, updates);
    },
    [setNodes, updateNode],
  );

  // Connect nodes
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `e-${params.source}-${params.target}`,
            type: "default",
            animated: true,
            style: { stroke: "var(--primary)", strokeWidth: 2 },
          } as AgentFlowEdge,
          eds,
        ),
      ),
    [setEdges],
  );

  const onLayout = useCallback(
    (direction: "TB" | "LR") => {
      const layouted = getLayoutedElements(nodes, edges, {
        direction,
        nodeWidth: 180,
        nodeHeight: 60,
        rankSeparation: 100,
        nodeSeparation: 60,
      });

      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);

      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 0);
    },
    [nodes, edges, setNodes, setEdges, fitView],
  );

  // Initialize default flow or parse from agent data
  useEffect(() => {
    let flowData;

    if (agent && agent.graph) {
      // Parse agent data into flow structure
      flowData = parseAgentGraph(agent as Agent);
    } else {
      // Default flow for demonstration or when agent data is not available
      flowData = {
        nodes: [
          {
            id: "calendar",
            type: "agentNode",
            data: {
              label: "Fetch Calendar Data",
              type: "input" as AgentNodeTypePrisma,
              description: "Pull tomorrow's meetings from Google Calendar",
              config: { api: "googleCalendar" },
            },
            position: { x: 100, y: 150 },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
          },
          {
            id: "research",
            type: "agentNode",
            data: {
              label: "Research Attendees",
              type: "process" as AgentNodeTypePrisma,
              description: "Generate connection points for each person",
              config: { service: "linkedinLookup" },
            },
            position: { x: 100, y: 250 },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
          },
          {
            id: "summary",
            type: "agentNode",
            data: {
              label: "Generate Summary",
              type: "process" as AgentNodeTypePrisma,
              description: "Create meeting preview with personalized context",
              config: { llm: "anthropicClaude" },
            },
            position: { x: 100, y: 350 },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
          },
          {
            id: "send_preview",
            type: "agentNode",
            data: {
              label: "Send Preview Email",
              type: "process" as AgentNodeTypePrisma,
              description: "Email meeting summary for tomorrow",
              config: { service: "gmailAPI" },
            },
            position: { x: 100, y: 450 },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
          },
          {
            id: "followup",
            type: "agentNode",
            data: {
              label: "Request Follow-ups",
              type: "output" as AgentNodeTypePrisma,
              description: "Send email requesting meeting notes and rankings",
              config: { template: "followupV1" },
            },
            position: { x: 100, y: 550 },
            targetPosition: Position.Top,
          },
        ],
        edges: [
          {
            id: "e-calendar-research",
            source: "calendar",
            target: "research",
            animated: true,
            type: "default",
            style: { stroke: "var(--primary)", strokeWidth: 2 },
          },
          {
            id: "e-research-summary",
            source: "research",
            target: "summary",
            animated: true,
            type: "default",
            style: { stroke: "var(--primary)", strokeWidth: 2 },
          },
          {
            id: "e-summary-send_preview",
            source: "summary",
            target: "send_preview",
            animated: true,
            type: "default",
            style: { stroke: "var(--primary)", strokeWidth: 2 },
          },
          {
            id: "e-send_preview-followup",
            source: "send_preview",
            target: "followup",
            animated: true,
            type: "default",
            style: { stroke: "var(--primary)", strokeWidth: 2 },
          },
        ],
      };
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      flowData.nodes as AgentFlowNode[],
      flowData.edges,
      {
        direction: "TB",
        nodeWidth: 180,
        nodeHeight: 60,
        rankSeparation: 100,
        nodeSeparation: 60,
      },
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    // Fit view after initial layout
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 0);
  }, [agent, fitView, setNodes, setEdges]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultViewport={defaultViewport}
        fitView
        onNodeClick={onNodeClick}
        style={{ backgroundColor: "oklch(0.25 0 0)" }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="oklch(0.5 0 0)"
        />
        <Panel position="top-right">
          <div className="flex gap-2 p-2">
            <Button variant="outline" onClick={() => onLayout("TB")}>
              Layout TB
            </Button>
            <Button variant="outline" onClick={() => onLayout("LR")}>
              Layout LR
            </Button>
          </div>
        </Panel>

        <EditNodeModal
          node={selectedNode}
          isOpen={isModalOpen}
          onClose={closeModal}
          onSave={handleNodeSave}
        />
      </ReactFlow>
    </div>
  );
};

const AgentFlow = () => {
  return (
    <ReactFlowProvider>
      <FlowContent />
    </ReactFlowProvider>
  );
};

export default AgentFlow;

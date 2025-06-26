import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { NodeType } from "@/types/agent"; // This is AgentNodeTypePrisma

// NodeColor type is no longer needed here as it's derived from NodeType

type AgentNodeProps = {
  data: {
    label: string;
    type: NodeType; // This will be used to determine color
    description?: string;
    config?: Record<string, unknown>;
    // color?: NodeColor; // Removed color prop
  };
  isConnectable: boolean;
  // onClick?: (event: React.MouseEvent, node: any) => void; // We'll handle click in ReactFlow
};

const getNodeColorClasses = (type: NodeType) => {
  switch (type) {
    case "input":
      return "bg-primary/80 border-primary text-primary-foreground";
    case "output":
      return "bg-accent/80 border-accent text-accent-foreground";
    case "process":
      return "bg-muted border-border text-foreground";
    // Add cases for other NodeType values as needed, e.g.:
    // case "decision":
    //   return "bg-yellow-500/80 border-yellow-500 text-yellow-foreground";
    // case "retriever":
    //   return "bg-green-500/80 border-green-500 text-green-foreground";
    default:
      return "bg-card border-border text-card-foreground";
  }
};

const AgentNode = memo(({ data, isConnectable }: AgentNodeProps) => {
  // Color classes are now determined by node type
  const nodeColorClasses = getNodeColorClasses(data.type);

  return (
    <div
      className={`p-3 rounded-md border ${nodeColorClasses} min-w-[150px] max-w-[200px] cursor-pointer shadow-md`}
    >
      {/* Target Handle (Top) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-border hover:!bg-ring transition-colors duration-150"
      />

      <div className="flex items-center justify-center h-full">
        <div className="font-medium text-sm truncate text-center">
          {data.label}
        </div>
      </div>

      {/* Source Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        className="w-3 h-3 !bg-border hover:!bg-ring transition-colors duration-150"
      />
    </div>
  );
});

AgentNode.displayName = "AgentNode";

export default AgentNode;

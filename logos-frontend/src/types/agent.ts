// Graph Structure Types

export type NodeType =
  | "trigger"
  | "input"
  | "process"
  | "output"
  | "tool"
  | "decision"
  | "transform"
  | "loop";
export interface Position {
  x: number;
  y: number;
}

export interface AgentNode {
  id: string;
  type: NodeType;
  config:
    | ToolCallNodeConfig
    | DecisionNodeConfig
    | TransformNodeConfig
    | LoopNodeConfig
    | InputNodeConfig
    | OutputNodeConfig
    | Record<string, unknown>; // Fallback for other node types
  position: Position;
  label?: string;
  description?: string;
}

export interface AgentEdge {
  id: string;
  source_id: string; // Source node ID
  target_id: string; // Target node ID
  condition?: Record<string, unknown>; // Optional condition for conditional flows
  label?: string; // Optional display label
}

export interface AgentGraph {
  nodes: AgentNode[];
  edges: AgentEdge[];
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
    created_at?: string;
    updated_at?: string;
  };
}

// Database Table Types
export type WorkflowStep = {
  step: string;
  description: string;
  type:
    | "trigger"
    | "input"
    | "process"
    | "output"
    | "tool"
    | "decision"
    | "transform"
    | "loop";
};

export type Integration = {
  name: string;
  type: "read" | "write";
  permissions: string[];
};

export type StructuredInstructions = {
  objective: string;
  workflow: WorkflowStep[];
  schedule?: string;
  integrations: Integration[];
};

export type Agent = {
  id: string;
  name: string;
  prompt: string;
  description: string;
  structured_instructions?: StructuredInstructions;
  graph?: AgentGraph;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  status?: "active" | "inactive" | "error";
};

export type TriggerType = "webhook" | "scheduled" | "manual";

export interface AgentTrigger {
  id: string; // UUID
  agent_id: string; // UUID
  user_id: string; // UUID
  trigger_type: TriggerType; // TEXT (not JSONB anymore)
  config: TriggerConfig; // JSONB
  is_active: boolean;
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

export interface WebhookTriggerConfig {
  webhook_url: string;
  secret?: string;
}

export interface ScheduledTriggerConfig {
  cron_expression: string;
  timezone?: string;
}

export interface ManualTriggerConfig {
  description?: string;
}

export type TriggerConfig =
  | WebhookTriggerConfig
  | ScheduledTriggerConfig
  | ManualTriggerConfig;

export type ExecutionState = "running" | "completed" | "failed";

export interface AgentExecution {
  id: string; // UUID
  agent_id: string; // UUID
  trigger_id?: string; // UUID
  trigger_type: TriggerType;
  trigger_context?: Record<string, unknown>; // JSONB
  state: ExecutionState;
  result?: Record<string, unknown>; // JSONB
  error?: string;
  started_at: string; // TIMESTAMPTZ
  completed_at?: string; // TIMESTAMPTZ
  created_at?: string; // TIMESTAMPTZ
}

export type LogType =
  | "info"
  | "tool_call"
  | "llm_input"
  | "llm_output"
  | "error";

export interface AgentExecutionLog {
  id: string; // UUID
  execution_id: string; // UUID
  log_type: LogType;
  content: Record<string, unknown>; // JSONB
  timestamp: string; // TIMESTAMPTZ
  created_at?: string; // TIMESTAMPTZ
}

export interface AgentTool {
  id: string; // UUID
  agent_id: string; // UUID
  tool_name: string; // 'gmail', 'gcal', 'sheets', etc.
  parameters: Record<string, unknown>; // JSONB
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

// Tool Configuration Types

// Gmail Tool
export interface GmailToolConfig {
  actions: ("read" | "send" | "search")[];
  filters?: {
    labels?: string[];
    from?: string;
    to?: string;
    subject?: string;
    has_attachment?: boolean;
  };
}

// Google Calendar Tool
export interface GCalToolConfig {
  actions: ("read" | "create" | "update" | "delete")[];
  calendars?: string[]; // Calendar IDs to access
  time_range?: {
    start?: string;
    end?: string;
  };
}

// Google Sheets Tool
export interface GSheetsToolConfig {
  actions: ("read" | "write" | "append" | "clear")[];
  spreadsheet_id: string;
  sheet_name?: string;
  range?: string;
}

// Airtable Tool
export interface AirtableToolConfig {
  actions: ("read" | "create" | "update" | "delete")[];
  base_id: string;
  table_name: string;
  view_name?: string;
}

// Union type for all tool configurations
export type ToolConfig =
  | { type: "gmail"; config: GmailToolConfig }
  | { type: "gcal"; config: GCalToolConfig }
  | { type: "gsheets"; config: GSheetsToolConfig }
  | { type: "airtable"; config: AirtableToolConfig };

// Node-specific configuration types
export interface ToolCallNodeConfig {
  tool: AgentTool;
  input_mapping: Record<string, string>;
  output_mapping: Record<string, string>;
}

export interface DecisionNodeConfig {
  condition: string;
  input_variables: string[];
}

export interface TransformNodeConfig {
  transformation: string;
  input_variables: string[];
  output_variable: string;
}

export interface LoopNodeConfig {
  collection_variable: string;
  item_variable: string;
  max_iterations?: number;
}

export interface InputNodeConfig {
  variable_name: string;
  description?: string;
  default_value?: string;
}

export interface OutputNodeConfig {
  output_variables: string[];
  format?: string;
}

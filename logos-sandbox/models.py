import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Literal, Optional, Union, Any

from pydantic import BaseModel, Field

# Python equivalents of the TypeScript interfaces


class Position(BaseModel):
    x: float
    y: float


NodeType = Literal[
    "trigger", "input", "process", "output", "tool", "decision", "transform"
]


class AgentNode(BaseModel):
    id: str
    type: NodeType
    config: Dict[str, Any]
    position: Position
    label: Optional[str] = None


class AgentEdge(BaseModel):
    id: str
    source_id: str
    target_id: str
    condition: Optional[Dict[str, Any]] = None
    label: Optional[str] = None


class AgentGraphMetadata(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AgentGraph(BaseModel):
    nodes: list[AgentNode]
    edges: list[AgentEdge]
    metadata: Optional[AgentGraphMetadata] = None


class WorkflowStep(BaseModel):
    step: str
    description: str
    type: NodeType


class Integration(BaseModel):
    name: str
    type: Literal["read", "write"]
    permissions: list[str]


class StructuredInstructions(BaseModel):
    objective: str
    workflow: list[WorkflowStep]
    schedule: Optional[str] = None
    integrations: list[Integration]


class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    prompt: str
    description: str
    structured_instructions: Optional[StructuredInstructions] = None
    graph: Optional[AgentGraph] = None
    is_public: bool
    created_at: Optional[float] = None
    updated_at: Optional[float] = None
    user_id: Optional[str] = None


# New models based on TypeScript interfaces

TriggerType = Literal["webhook", "scheduled", "manual"]


class WebhookTriggerConfig(BaseModel):
    webhook_url: str
    secret: Optional[str] = None


class ScheduledTriggerConfig(BaseModel):
    cron_expression: str
    timezone: Optional[str] = None


class ManualTriggerConfig(BaseModel):
    description: Optional[str] = None


TriggerConfig = Union[WebhookTriggerConfig, ScheduledTriggerConfig, ManualTriggerConfig]


class AgentTrigger(BaseModel):
    id: str
    agent_id: str
    user_id: str
    trigger_type: TriggerType
    config: TriggerConfig
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


ExecutionState = Literal["pending", "running", "completed", "failed", "cancelled"]


class AgentExecution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    user_id: Optional[str] = None
    trigger_id: Optional[str] = None
    trigger_type: Optional[TriggerType] = None
    initial_context: Optional[Dict[str, Any]] = None
    state: ExecutionState = "pending"
    final_outputs: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


LogType = Literal[
    "info",
    "debug",
    "warning",
    "error",
    "tool_call",
    "tool_result",
    "llm_input",
    "llm_output",
    "node_execution",
]


class AgentExecutionLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    execution_id: str
    node_id: Optional[str] = None
    step_number: Optional[int] = None
    log_type: LogType
    content: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AgentTool(BaseModel):
    id: str
    agent_id: str
    tool_name: str
    parameters: Dict[str, Any]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# Node-specific configuration types
class ToolCallNodeConfig(BaseModel):
    tool: AgentTool
    input_mapping: Dict[str, str]
    output_mapping: Dict[str, str]


class DecisionNodeConfig(BaseModel):
    condition: str
    input_variables: list[str]


class TransformNodeConfig(BaseModel):
    transformation: str
    input_variables: list[str]
    output_variable: str


class LoopNodeConfig(BaseModel):
    collection_variable: str
    item_variable: str
    max_iterations: Optional[int] = None


class InputNodeConfig(BaseModel):
    variable_name: str
    description: Optional[str] = None
    default_value: Optional[Any] = None


class OutputNodeConfig(BaseModel):
    output_variables: list[str]
    format: Optional[str] = None

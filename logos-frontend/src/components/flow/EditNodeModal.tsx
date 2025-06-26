import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AgentFlowNode } from "./AgentFlow";

interface EditNodeModalProps {
  node: AgentFlowNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    nodeId: string,
    updates: { label: string; description?: string },
  ) => void;
}

export default function EditNodeModal({
  node,
  isOpen,
  onClose,
  onSave,
}: EditNodeModalProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when node changes
  useEffect(() => {
    if (node) {
      setLabel(node.data.label || "");
      setDescription(node.data.description || "");
      setHasChanges(false);
    }
  }, [node]);

  // Track changes
  useEffect(() => {
    if (node) {
      const labelChanged = label !== (node.data.label || "");
      const descriptionChanged = description !== (node.data.description || "");
      setHasChanges(labelChanged || descriptionChanged);
    }
  }, [label, description, node]);

  const handleSave = () => {
    if (node && hasChanges) {
      onSave(node.id, { label, description });
      onClose();
    }
  };

  const handleCancel = () => {
    if (node) {
      setLabel(node.data.label || "");
      setDescription(node.data.description || "");
      setHasChanges(false);
    }
    onClose();
  };

  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-primary">
            Edit Node
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modify the label and description for this {node.data.type} node
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="node-label" className="text-sm font-medium">
              Label
            </Label>
            <Input
              id="node-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter node label"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="node-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="node-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter node description"
              className="w-full min-h-[100px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className={hasChanges ? "" : "opacity-50 cursor-not-allowed"}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

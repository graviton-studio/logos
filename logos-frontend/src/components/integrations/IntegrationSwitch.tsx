"use client";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function IntegrationSwitch({
  name,
  enabled,
}: {
  name: string;
  enabled: boolean;
}) {
  const [isChecked, setIsChecked] = useState(enabled);

  const handleSwitchChange = () => {
    setIsChecked(!isChecked);
    console.log(`${name} is now ${isChecked ? "enabled" : "disabled"}`);
  };

  return (
    <div className="flex flex-row items-center justify-center space-x-4">
      <Switch checked={isChecked} onCheckedChange={handleSwitchChange} />
    </div>
  );
}

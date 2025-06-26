"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Bell, Moon, Sun, Laptop } from "lucide-react";
import useUser from "@/lib/hooks";
import {
  staggerContainerVariants,
  staggerContainerVariantsReduced,
  listItemVariants,
  listItemVariantsReduced,
  fadeInVariants,
  fadeInVariantsReduced,
} from "@/lib/animations";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const MotionCard = motion(Card);

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const [theme, setTheme] = useState("system");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    agentAlerts: true,
    marketingEmails: false,
  });
  const prefersReducedMotion = useReducedMotion();

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <motion.div
        className="mb-8"
        variants={prefersReducedMotion ? fadeInVariantsReduced : fadeInVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-3xl font-bold mb-2 text-primary">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and settings
        </p>
      </motion.div>

      <motion.div
        className="grid gap-6"
        variants={
          prefersReducedMotion
            ? staggerContainerVariantsReduced
            : staggerContainerVariants
        }
        initial="hidden"
        animate="visible"
      >
        {/* Profile Settings */}
        <MotionCard
          className="rounded-xl shadow-lg bg-gradient-to-br from-[var(--background)] to-[var(--muted)] border border-border"
          variants={
            prefersReducedMotion ? listItemVariantsReduced : listItemVariants
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>Profile Settings</CardTitle>
            </div>
            <CardDescription>
              Update your personal information and profile settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold transition-all duration-300 hover:scale-105">
                {user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
                  user?.email?.[0]?.toUpperCase() ||
                  "U"}
              </div>
              <Button variant="outline" className="hover:border-primary">
                Change Avatar
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  defaultValue={user?.user_metadata?.full_name || ""}
                  className="bg-input border-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="bg-input/50 border-input cursor-not-allowed"
                />
              </div>
            </div>
          </CardContent>
        </MotionCard>

        {/* Appearance Settings */}
        <MotionCard
          className="rounded-xl shadow-lg bg-gradient-to-br from-[var(--background)] to-[var(--muted)] border border-border"
          variants={
            prefersReducedMotion ? listItemVariantsReduced : listItemVariants
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              {theme === "light" && <Sun className="h-5 w-5 text-primary" />}
              {theme === "dark" && <Moon className="h-5 w-5 text-primary" />}
              {theme === "system" && (
                <Laptop className="h-5 w-5 text-primary" />
              )}
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>
              Customize how Logos looks on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme" className="bg-input border-input">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </MotionCard>

        {/* Notification Settings */}
        <MotionCard
          className="rounded-xl shadow-lg bg-gradient-to-br from-[var(--background)] to-[var(--muted)] border border-border"
          variants={
            prefersReducedMotion ? listItemVariantsReduced : listItemVariants
          }
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Choose what updates you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about your agents via email
                  </p>
                </div>
                <Switch
                  checked={notifications.emailUpdates}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({
                      ...prev,
                      emailUpdates: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Agent Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your agents complete tasks or need
                    attention
                  </p>
                </div>
                <Switch
                  checked={notifications.agentAlerts}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({
                      ...prev,
                      agentAlerts: checked,
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news about new features and updates
                  </p>
                </div>
                <Switch
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({
                      ...prev,
                      marketingEmails: checked,
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </MotionCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[100px] transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

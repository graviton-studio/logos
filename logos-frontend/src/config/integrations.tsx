import {
  Mail,
  MessageSquare,
  Trello,
  Calendar,
  Github,
  Video,
  Linkedin,
  Twitch,
  Twitter,
  Figma,
  Codepen,
  Youtube,
} from "lucide-react";

export interface Integration {
  name: string;
  icon: typeof Mail; // Using Mail as an example type, any Lucide icon component will work
  color: string;
}

export const integrations: Integration[] = [
  {
    name: "Twitter",
    icon: Twitter,
    color: "text-primary",
  },
  {
    name: "Slack",
    icon: MessageSquare,
    color: "text-primary",
  },
  {
    name: "Trello",
    icon: Trello,
    color: "text-primary",
  },
  {
    name: "Youtube",
    icon: Youtube,
    color: "text-red-500",
  },
  {
    name: "Calendar",
    icon: Calendar,
    color: "text-primary",
  },
  {
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-purple-500",
  },
  {
    name: "Codepen",
    icon: Codepen,
    color: "text-primary",
  },
  {
    name: "GitHub",
    icon: Github,
    color: "text-primary",
  },
  {
    name: "Zoom",
    icon: Video,
    color: "text-primary",
  },
  {
    name: "Figma",
    icon: Figma,
    color: "text-primary",
  },
  {
    name: "Twitch",
    icon: Twitch,
    color: "text-primary",
  },
];

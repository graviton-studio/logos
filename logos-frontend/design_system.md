---
description: Documentation for the Logos Frontend design system, including color palettes, typography, spacing, CSS variables, and theming guidelines.
globs: src/app/globals.css, tailwind.config.js, src/components/**/*.{tsx,jsx}
alwaysApply: false
---

# Core Design Language

This design system aims to create a **clean, minimalist, professional, and modern UI** with a **sleek digital feel**, inspired by the clarity and trustworthiness of platforms like Anthropic. It will be uniquely branded through a distinct color palette and subtle thematic elements nodding to "Logos/Word" and a refined interpretation of "papyrus/waxy" aesthetics.

## 1. Color System

The color system is defined using CSS custom properties (variables) in `src/app/globals.css`. It supports both light and dark themes. OKLCH is the preferred color format for its perceptual uniformity and ability to define wide-gamut colors, with HEX/RGB as fallbacks or for comments.

### 1.1. Light Theme Color Palette

- **Goal:** Establish a predominantly light and airy feel, using off-whites and creams as a base to achieve a clean, expansive look. Accent tones will be used strategically for branding, calls-to-action, and visual hierarchy, ensuring the overall aesthetic remains modern and professional.
- **Primary Text Color (`--foreground`):** `oklch(0.271 0.078 258.95)` (Navy - `#102C57`) - For primary text and general foreground content.
- **Primary Background Color (`--background`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`) - For main page backgrounds.
- **Card Background Color (`--card`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`) - For card backgrounds.
- **Popover Background Color (`--popover`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`) - For popover backgrounds.
- **Primary Action Color (`--primary`):** `oklch(0 0 0)` (Black - `#000000`) - For primary calls-to-action, interactive elements, and key highlights.
- **Primary Action Text Color (`--primary-foreground`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`) - Text color for elements using `--primary` background.
- **Secondary Action Color (`--secondary`):** `oklch(0.818 0.055 76.01)` (Tan - `#DAC0A3`) - For secondary buttons and less prominent accents.
- **Secondary Action Text Color (`--secondary-foreground`):** `oklch(0 0 0)` (Black - `#000000`) - Text color for elements using `--secondary` background.
- **Muted Background/Border Color (`--muted`):** `oklch(0.918 0.036 82.64)` (Light Beige - `#EADBC8`) - For muted backgrounds, subtle borders.
- **Muted Text Color (`--muted-foreground`):** `oklch(0.271 0.078 258.95)` (Navy - `#102C57`) - For less emphasized text.
- **Accent Color (`--accent`):** `oklch(0.818 0.055 76.01)` (Tan - `#DAC0A3`) - For accents and some iconography.
- **Accent Text Color (`--accent-foreground`):** `oklch(0 0 0)` (Black - `#000000`) - Text color for elements using `--accent` background.
- **Destructive Color (`--destructive`):** `oklch(0.698 0.232 13.06)` (Deep Red) - For error messages and destructive actions.
- **Destructive Text Color (`--destructive-foreground`):** `oklch(0.959 0.021 13.2)` (Light text for destructive elements).
- **Border Color (`--border`):** `oklch(0.918 0.036 82.64)` (Light Beige - `#EADBC8`) - Default border color.
- **Input Background Color (`--input`):** `oklch(0.918 0.036 82.64)` (Light Beige - `#EADBC8`) - Background for input fields.
- **Focus Ring Color (`--ring`):** `oklch(0 0 0)` (Black - `#000000`) - For focus indicators.
- **Semantic Greens/Yellows/Purples:** Retained for specific UI feedback like tool call statuses (`text-green-500`, `text-yellow-500`, `text-purple-500`).
- **Accessibility:** Ensure WCAG AA contrast ratios are met for all text/background combinations.

### 1.2. Dark Theme Color Palette

The dark theme provides an alternative viewing experience, activated by applying the `.dark` class, typically to the `<html>` element.

- **Primary Text Color (`--foreground`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`)
- **Primary Background Color (`--background`):** `oklch(0.271 0.078 258.95)` (Navy - `#102C57`)
- **Card Background Color (`--card`):** `oklch(0.314 0.076 259.41)` (Darker Navy variant - e.g., `#1A3A6D`)
- **Popover Background Color (`--popover`):** `oklch(0.314 0.076 259.41)` (Darker Navy variant)
- **Primary Action Color (`--primary`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`)
- **Primary Action Text Color (`--primary-foreground`):** `oklch(0 0 0)` (Black - `#000000`)
- **Secondary Action Color (`--secondary`):** `oklch(0.818 0.055 76.01)` (Tan - `#DAC0A3`) (Remains Tan)
- **Secondary Action Text Color (`--secondary-foreground`):** `oklch(0 0 0)` (Black - `#000000`) (Remains Black for Tan bg)
- **Muted Background/Border Color (`--muted`):** `oklch(0.352 0.073 259.88)` (Even Darker Navy/Slate - e.g., `#2A4A7D`)
- **Muted Text Color (`--muted-foreground`):** `oklch(0.918 0.036 82.64)` (Light Beige - `#EADBC8`)
- **Accent Color (`--accent`):** `oklch(0.818 0.055 76.01)` (Tan - `#DAC0A3`) (Remains Tan)
- **Accent Text Color (`--accent-foreground`):** `oklch(0 0 0)` (Black - `#000000`) (Remains Black for Tan bg)
- **Destructive Color (`--destructive`):** `oklch(0.698 0.232 13.06)` (Consistent Deep Red)
- **Destructive Text Color (`--destructive-foreground`):** `oklch(0.991 0.005 91.88)` (Ivory)
- **Border Color (`--border`):** `oklch(0.818 0.055 76.01)` (Tan - `#DAC0A3`) (Tan border for contrast on Navy)
- **Input Background Color (`--input`):** `oklch(0.352 0.073 259.88)` (Even Darker Navy/Slate)
- **Focus Ring Color (`--ring`):** `oklch(0.991 0.005 91.88)` (Ivory - `#FEFAF6`)

## 2. CSS Variable Reference

The following CSS custom properties are defined in `src/app/globals.css` and form the basis of the theming system.

### 2.1. Core Theme Variables

| Variable                   | Light Mode Value (OKLCH)          | Dark Mode Value (OKLCH)           | Purpose                                   |
| -------------------------- | --------------------------------- | --------------------------------- | ----------------------------------------- |
| `--background`             | `0.991 0.005 91.88` (Ivory)       | `0.271 0.078 258.95` (Navy)       | Main page background                      |
| `--foreground`             | `0.271 0.078 258.95` (Navy)       | `0.991 0.005 91.88` (Ivory)       | Default text color                        |
| `--card`                   | `0.991 0.005 91.88` (Ivory)       | `0.314 0.076 259.41` (Dark Navy)  | Background for card-like components       |
| `--card-foreground`        | `0.271 0.078 258.95` (Navy)       | `0.991 0.005 91.88` (Ivory)       | Text color within cards                   |
| `--popover`                | `0.991 0.005 91.88` (Ivory)       | `0.314 0.076 259.41` (Dark Navy)  | Background for popovers, dropdowns        |
| `--popover-foreground`     | `0.271 0.078 258.95` (Navy)       | `0.991 0.005 91.88` (Ivory)       | Text color within popovers                |
| `--primary`                | `0 0 0` (Black)                   | `0.991 0.005 91.88` (Ivory)       | Primary interactive elements background   |
| `--primary-foreground`     | `0.991 0.005 91.88` (Ivory)       | `0 0 0` (Black)                   | Text color for primary elements           |
| `--secondary`              | `0.818 0.055 76.01` (Tan)         | `0.818 0.055 76.01` (Tan)         | Secondary interactive elements background |
| `--secondary-foreground`   | `0 0 0` (Black)                   | `0 0 0` (Black)                   | Text color for secondary elements         |
| `--muted`                  | `0.918 0.036 82.64` (Light Beige) | `0.352 0.073 259.88` (Dark Slate) | Muted backgrounds, dividers               |
| `--muted-foreground`       | `0.271 0.078 258.95` (Navy)       | `0.918 0.036 82.64` (Light Beige) | Muted text color                          |
| `--accent`                 | `0.818 0.055 76.01` (Tan)         | `0.818 0.055 76.01` (Tan)         | Accent elements background                |
| `--accent-foreground`      | `0 0 0` (Black)                   | `0 0 0` (Black)                   | Text color for accent elements            |
| `--destructive`            | `0.698 0.232 13.06` (Red)         | `0.698 0.232 13.06` (Red)         | Destructive actions background            |
| `--destructive-foreground` | `0.959 0.021 13.2` (Light Red)    | `0.991 0.005 91.88` (Ivory)       | Text color for destructive actions        |
| `--border`                 | `0.918 0.036 82.64` (Light Beige) | `0.818 0.055 76.01` (Tan)         | Default border color                      |
| `--input`                  | `0.918 0.036 82.64` (Light Beige) | `0.352 0.073 259.88` (Dark Slate) | Input field backgrounds                   |
| `--ring`                   | `0 0 0` (Black)                   | `0.991 0.005 91.88` (Ivory)       | Focus ring color                          |

### 2.2. Chart Variables

Used for data visualizations.

| Variable    | Light Mode Value (OKLCH) | Dark Mode Value (OKLCH) |
| ----------- | ------------------------ | ----------------------- |
| `--chart-1` | `0.646 0.222 41.116`     | `0.488 0.243 264.376`   |
| `--chart-2` | `0.6 0.118 184.704`      | `0.696 0.17 162.48`     |
| `--chart-3` | `0.398 0.07 227.392`     | `0.769 0.188 70.08`     |
| `--chart-4` | `0.828 0.189 84.429`     | `0.627 0.265 303.9`     |
| `--chart-5` | `0.769 0.188 70.08`      | `0.645 0.246 16.439`    |

### 2.3. Sidebar Variables

Specific theme variables for the main application sidebar.

| Variable                       | Light Mode Value (OKLCH) | Dark Mode Value (OKLCH)     |
| ------------------------------ | ------------------------ | --------------------------- |
| `--sidebar`                    | `0.985 0 0`              | `0.205 0 0`                 |
| `--sidebar-foreground`         | `0.145 0 0`              | `0.985 0 0`                 |
| `--sidebar-primary`            | `0.205 0 0`              | `0.488 0.243 264.376`       |
| `--sidebar-primary-foreground` | `0.985 0 0`              | `0.985 0 0`                 |
| `--sidebar-accent`             | `0.97 0 0`               | `0.269 0 0`                 |
| `--sidebar-accent-foreground`  | `0.205 0 0`              | `0.985 0 0`                 |
| `--sidebar-border`             | `0.922 0 0`              | `1 0 0 / 10%` (Transparent) |
| `--sidebar-ring`               | `0.708 0 0`              | `0.556 0 0`                 |

### 2.4. Radius Variables

Controls `border-radius` across components.

| Variable      | Value                       |
| ------------- | --------------------------- |
| `--radius`    | `0.625rem`                  |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)`             |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

### 2.5. Font Variables

Defines the primary font families used.

| Variable      | Value                                 |
| ------------- | ------------------------------------- |
| `--font-sans` | `var(--font-ubuntu)` (Ubuntu)         |
| `--font-mono` | `var(--font-geist-mono)` (Geist Mono) |

## 3. Theming System

### 3.1. Modifying the Theme

The application's theme is primarily defined by CSS custom properties (variables) located in `src/app/globals.css`.

- To change base color values, modify the OKLCH/HEX values for the corresponding variables in the `:root { ... }` (for light theme) and `.dark { ... }` (for dark theme) blocks within this file.
- `tailwind.config.js` consumes these CSS variables to generate utility classes (e.g., `bg-background`, `text-primary`). If you need to change how Tailwind maps these variables to classes or add new semantic color names for Tailwind, you would edit `tailwind.config.js` (specifically under `theme.extend.colors`, etc.).

### 3.2. Dark Mode Implementation

- Dark mode is activated by adding the `.dark` class to a parent element, typically the `<html>` tag. This is usually handled by a theme switcher component.
- All dark mode specific CSS variable overrides are defined under the `.dark { ... }` selector in `src/app/globals.css`. Components should use the semantic variable names (e.g., `var(--background)`) which will automatically resolve to the correct light or dark theme value based on the presence of the `.dark` class.

## 4. Typography

- **Goal:** Prioritize clarity, readability, and a professional tone. Fonts should complement the modern, sleek digital feel while being highly legible across all devices and screen sizes.
- **Font Style:** Clean sans-serif font (`--font-sans`, mapped to Ubuntu) is used for UI elements and body text. Monospace font (`--font-mono`, mapped to Geist Mono) is available for code snippets or tabular data. Serif or script fonts might be considered _very sparingly_ for specific, highly stylized branding elements if they align with the "Logos/Word" concept without compromising overall modernity.
- **Emphasis:** Excellent readability is paramount. Consistent hierarchy through font weights, sizes, and line heights, primarily managed via Tailwind CSS utility classes.
- **Considerations:** Responsive scaling, sufficient contrast with backgrounds, internationalization-friendly character sets if applicable.

### 4.1. Standard Text Styles

The following provides a general guideline for typographic scale using Tailwind CSS utility classes. Adjustments may be necessary based on specific component needs and visual balance.

| Element / Use Case        | Tailwind Classes (Example)                                                                                                                                   | Font Weight     | Notes                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------- |
| **Page Titles (H1)**      | `text-3xl md:text-4xl`                                                                                                                                       | `font-bold`     | Prominent, clear, often uses `text-primary` (dark text on light bg) or `text-foreground` on dark bg. |
| **Section Titles (H2)**   | `text-2xl md:text-3xl`                                                                                                                                       | `font-semibold` | Clear hierarchy below H1.                                                                            |
| **Card Titles (H3)**      | `text-xl md:text-2xl`                                                                                                                                        | `font-semibold` | Used within components like Cards.                                                                   |
| **Sub-headings (H4)**     | `text-lg`                                                                                                                                                    | `font-medium`   | For further content division.                                                                        |
| **Body Text (P)**         | `text-base` or `text-md` (alias for base)                                                                                                                    | `font-normal`   | Standard readability for paragraphs.                                                                 |
| **Small Text / Captions** | `text-sm`                                                                                                                                                    | `font-normal`   | For less prominent information, labels.                                                              |
| **Micro Text / Legal**    | `text-xs`                                                                                                                                                    | `font-normal`   | For fine print, if necessary.                                                                        |
| **Links**                 | `text-primary hover:underline` (Light) / `text-primary hover:underline` (Dark for primary on dark) or `text-accent-foreground hover:underline` for tan links | `font-medium`   | Clearly interactive.                                                                                 |

- Line heights are generally managed by Tailwind's defaults (e.g., `leading-relaxed` for body text, tighter for headings).
- Ensure `text-foreground` is used for general text to respect theme changes, or specific semantic colors like `text-muted-foreground` for de-emphasized text.

## 5. Border Styles

- **Goal:** Borders should be clean and subtle, contributing to structure without being visually distracting.
- **Appearance:** Thin, solid borders. Color typically derived from `--border`.
- **Radius:** Consistent corner rounding using `--radius` variables (see Section 2.4).
- **Considerations:** Focus states for interactive elements might involve border color changes (e.g., using `--ring` color for outline rings).

## 6. Spacing System

- **Goal:** Establish a harmonious and consistent rhythm throughout the UI, ensuring elements are well-balanced and interfaces are uncluttered.
- **Methodology:** Utilize Tailwind CSS's default spacing scale (based on a 4pt or 0.25rem unit). Standard Tailwind spacing utilities (e.g., `p-2`, `m-4`, `gap-8`) should be used for consistency.
- **Application:** Margins, paddings, gaps in flex/grid layouts.

### 6.1. Common Spacing Values & Examples

While the full Tailwind scale is available, here are some common patterns:

- **Fine-grained spacing (within components):**
  - `p-1` (4px), `p-2` (8px), `px-2 py-1`
  - `gap-1` (4px), `gap-2` (8px) for items in a flex/grid container.
  - `space-x-1`, `space-y-1` for direct children.
- **Component internal padding:**
  - `p-3` (12px), `p-4` (16px) often used for padding inside buttons, inputs, or small cards.
- **Card & Section padding:**
  - `p-4` (16px), `p-6` (24px) are common for the content area of cards or distinct UI sections.
- **Page-level / Layout spacing:**
  - `p-6` (24px), `p-8` (32px) for main content wrappers or significant visual separation between large page blocks.
- **Consistent Gaps:** Use `gap-*` utilities for consistent spacing in flex and grid layouts (e.g., `grid gap-4` or `flex gap-2`).

- _Future Expansion: Could define common spacing "tokens" or presets if needed, e.g., `container-padding: p-4 md:p-6`._

## 7. Iconography

- **Goal:** Icons should be clear, modern, and instantly recognizable, aligning with the overall minimalist and professional aesthetic. (Current library: Lucide React).
- **Style:** Outline or line-art style icons generally preferred over filled icons for a lighter feel.
- **Color:** Typically inherit color from parent text (`currentColor`) or use semantic theme colors like `text-primary`, `text-muted-foreground`, or `text-destructive` as appropriate.
- **Size:** Consistent sizing with clear visual hierarchy, typically using Tailwind's `h-` and `w-` utilities (e.g., `h-5 w-5`).

## 8. Shadow/Depth Effects

- **Goal:** Use shadows subtly to create depth and hierarchy, particularly for interactive elements or modal dialogs, without creating a heavy or cluttered appearance.
- **Application:** Subtle box shadows (e.g., `shadow-sm`, `shadow-md`, `shadow-lg` from Tailwind) on cards, modals, dropdowns, and active/hover states for buttons.
- **Style:** Soft, diffused shadows rather than hard, stark ones. Shadow colors are typically based on a semi-transparent version of a dark color (e.g., black or a dark theme color, configured in `tailwind.config.js`).

## 9. Component Guidelines

This section provides guidelines for commonly used components, emphasizing consistent theming, usage patterns, and accessibility. Most components are based on `shadcn/ui` primitives.

### 9.1. General Principles

- **Leverage `shadcn/ui`:** Utilize components from `@/components/ui` (which are typically `shadcn/ui` based) as the foundation.
- **Theming:** Apply theme colors and styles using CSS variables (e.g., `bg-[var(--card)]`) and Tailwind utility classes. Refer to Section 1 (Color System) and Section 2 (CSS Variable Reference).
- **Accessibility (A11y):** While `shadcn/ui` provides a good A11y baseline, always ensure:
  - Semantic HTML is used.
  - Interactive elements are keyboard navigable and have clear focus states.
  - Sufficient color contrast.
  - ARIA attributes are used correctly when custom behaviors are introduced.
- **Responsiveness:** Ensure components adapt well to different screen sizes.

### 9.2. Buttons (`@/components/ui/button`)

- **Base Component:** `Button` from `@/components/ui/button`.
- **Key Variants & Styling:**
  - `variant="default"`: Primary actions. Uses `bg-primary`, `text-primary-foreground`.
  - `variant="secondary"`: Secondary actions. Uses `bg-secondary`, `text-secondary-foreground`.
  - `variant="outline"`: Tertiary actions, less emphasis. Uses `border-input`, `bg-background`, `hover:bg-accent`, `hover:text-accent-foreground`.
  - `variant="ghost"`: Minimal styling for subtle actions (e.g., icon-only buttons). Uses `hover:bg-accent`, `hover:text-accent-foreground`.
  - `variant="destructive"`: For actions that delete data or have significant consequences. Uses `bg-destructive`, `text-destructive-foreground`.
  - `variant="link"`: Styles as a hyperlink. Uses `text-primary`, `underline-offset-4`, `hover:underline`.
- **Sizing:**
  - Default (no `size` prop): Standard padding.
  - `size="sm"`: Smaller padding.
  - `size="lg"`: Larger padding.
  - `size="icon"`: Square, minimal padding, for icon-only buttons.
- **Usage:**
  - Always use for interactive click actions.
  - Provide clear, concise text labels.
  - For icon buttons, ensure an `aria-label` is provided for accessibility if no visible text label exists.
- **Accessibility:** `shadcn/ui` Button handles basic ARIA roles. Ensure focus states are clear (uses `--ring`).
- **Conceptual Code Example:**

  ```tsx
  import { Button } from "@/components/ui/button";
  import { Plus } from "lucide-react";

  // <Button variant="default" size="lg">Primary Action</Button>
  // <Button variant="outline">
  //   <Plus className="mr-2 h-4 w-4" /> Add Item
  // </Button>
  // <Button variant="ghost" size="icon" aria-label="Settings">
  //   <Settings className="h-4 w-4" />
  // </Button>
  ```

### 9.3. Cards (`@/components/ui/card`)

- **Base Components:** `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` from `@/components/ui/card`.
- **Standard Styling (Tier 1):**
  - `bg-card` (i.e., `var(--card)`)
  - `text-card-foreground` (i.e., `var(--card-foreground)`)
  - `border border-border` (i.e., `var(--border)`)
  - `rounded-xl` (custom default, larger than `shadcn/ui`'s `rounded-lg`)
  - `shadow-lg` (custom default for more lift)
- **Muted/Subtle Styling (Tier 2):**
  - Example: `bg-muted/50 border-border rounded-xl` for less prominent cards or nested card-like sections.
- **Interactive/Hover Styling (Tier 3):**
  - Consider using `MotionCard` (if defined with `framer-motion`) or applying hover effects directly (e.g., `hover:shadow-xl`, `hover:border-primary/50`).
- **Usage:**
  - Grouping related content and actions.
  - Main content blocks on dashboards and list pages.
- **Accessibility:**
  - Use `CardTitle` (typically maps to an `<h3>` or appropriate heading level) for the main title of the card content.
  - `CardDescription` can provide supplementary information.
- **Conceptual Code Example:**

  ```tsx
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
  } from "@/components/ui/card";

  // <Card className="rounded-xl shadow-lg">
  //   <CardHeader>
  //     <CardTitle>Agent Activity</CardTitle>
  //     <CardDescription>Recent logs and performance metrics.</CardDescription>
  //   </CardHeader>
  //   <CardContent>
  //     <p>Details about agent activity...</p>
  //   </CardContent>
  // </Card>
  ```

### 9.4. Inputs & Forms (`@/components/ui/input`, `textarea`, `select`, `label`, `checkbox`, `switch`)

- **Base Components:** `Input`, `Textarea`, `Select` (and its parts like `SelectTrigger`, `SelectContent`, `SelectItem`), `Label`, `Checkbox`, `Switch` from `@/components/ui/`.
- **Styling:**
  - **Input / Textarea:**
    - `bg-input` (or `bg-background` for transparent/minimal variants if designed)
    - `border-border`
    - `text-foreground`
    - `placeholder:text-muted-foreground`
    - `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background` (standard focus style)
  - **Label:** `text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70` (associates with form controls).
  - **Select:** `SelectTrigger` styles similarly to `Input`. `SelectContent` uses popover styling (`bg-popover`, `text-popover-foreground`, `border-border`, `rounded-md shadow-md`).
  - **Checkbox / Switch:** Styled with `accent-primary` or theme-consistent colors for their active/checked states.
- **Usage:** Data entry, user configuration, filtering.
- **Accessibility:**
  - Always associate `Label` components with their respective form controls using `htmlFor="inputId"`.
  - Use `aria-describedby` to link inputs to any help text or error messages.
  - Ensure interactive form elements are keyboard accessible and have clear focus states.
  - `shadcn/ui` components provide a strong ARIA foundation.
- **Conceptual Code Example:**

  ```tsx
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Textarea } from "@/components/ui/textarea";
  import { Checkbox } from "@/components/ui/checkbox";

  // <div>
  //   <Label htmlFor="username">Username</Label>
  //   <Input type="text" id="username" placeholder="Enter your username" />
  // </div>
  // <div>
  //   <Label htmlFor="description">Description</Label>
  //   <Textarea id="description" placeholder="Describe the agent..." />
  // </div>
  // <div className="flex items-center space-x-2">
  //   <Checkbox id="terms" />
  //   <Label htmlFor="terms">Accept terms and conditions</Label>
  // </div>
  ```

### 9.5. Overlay Components (Modals, Popovers, Tooltips, Dropdowns)

- **Goal:** Ensure all overlay components provide a consistent, themed, and accessible user experience.
- **General Principles:** Leverage `shadcn/ui`, ensure distinctness from page content, maintain usability.
- **Specific Component Guidelines:**
  - **Modals / Dialogs (e.g., `Dialog`, `AlertDialog` from `shadcn/ui`):**
    - **Content Panel (`DialogContent`):** Styled as Tier 1 Cards. `bg-card`, `border border-border`, `rounded-xl shadow-lg`.
    - **Backdrop / Overlay (`DialogOverlay`):** `bg-black/50` or `bg-background/80 backdrop-blur-sm` for a frosted glass effect.
    - **Accessibility:** `Dialog` manages focus trapping, `aria-modal`, `aria-labelledby`, `aria-describedby`. Ensure `DialogTitle` and `DialogDescription` are used.
  - **Popovers & Hover Cards (e.g., `PopoverContent`, `HoverCardContent` from `shadcn/ui`):**
    - **Standard:** `bg-popover`, `text-popover-foreground`, `border border-border`, `rounded-md shadow-md`.
    - **Large Content:** If popover content is substantial, consider styling its internal container more like a Card.
  - **Tooltips (e.g., `TooltipContent` from `shadcn/ui`):**
    - **Standard:** `bg-primary` (or `bg-popover` for a more muted style), `text-primary-foreground` (or `text-popover-foreground`), `rounded-md shadow-md`, `px-3 py-1.5 text-xs`.
  - **Dropdown Menus (e.g., `DropdownMenuContent` from `shadcn/ui`):**
    - **Standard:** `bg-popover`, `text-popover-foreground`, `border border-border`, `rounded-md shadow-md`. `DropdownMenuItem`s have hover/focus states.
  - **Animations:** Standard `shadcn/ui` animations (subtle fades/scales) are generally acceptable.
  - **Responsiveness:** Ensure overlays are usable across various screen sizes. `shadcn/ui` components are generally responsive.

## 10. Background Gradients

- **Primary Gradient:** A subtle bottom-right diagonal gradient is used for large background areas to add depth and visual interest while maintaining a clean aesthetic.
  - **Tailwind Utility:** `bg-gradient-to-br from-[var(--background)] to-[var(--muted)]`
  - **CSS Variables Used:**
    - `var(--background)`: Typically the main page background color.
    - `var(--muted)`: A slightly darker or complementary muted tone.
  - **Intended Use:** Full page backgrounds, main content area wrappers, larger cards.
  - **Rationale:** Provides a gentle visual transition, adding sophistication.
  - **Example (Conceptual):**
    ```html
    <div class="bg-gradient-to-br from-[var(--background)] to-[var(--muted)]">
      <!-- Page or section content -->
    </div>
    ```
- **Considerations:** Ensure text contrast. For smaller areas, solid backgrounds are preferred.

## 11. Implementation Guidelines for Developers

### 11.1. Core Technologies

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI Rendering:** React
- **Styling:** Tailwind CSS
- **Component Primitives:** `shadcn/ui`
- **Animation:** Framer Motion (used selectively)

### 11.2. Project Structure (Simplified)

- `src/app/`: Page routes and layouts (App Router).
- `src/components/`: Reusable UI components.
  - `src/components/ui/`: `shadcn/ui` based components.
  - `src/components/custom/`: Project-specific complex components.
- `src/lib/`: Utility functions, hooks, API clients, etc.
- `src/styles/`: Global styles (`globals.css`). (Note: `globals.css` is in `src/app/` in this project).
- `public/`: Static assets.

### 11.3. Styling Approach

- **Primary Method:** Utilize Tailwind CSS utility classes directly in your JSX.
- **CSS Variables:** Leverage the theming variables defined in `src/app/globals.css` for colors, radii, fonts (e.g., `className="bg-[var(--background)] text-[var(--foreground)]"`).
- **Conditional Classes:** Use `clsx` or the `cn` utility (common with `shadcn/ui`) for managing conditional application of classes.
- **Custom CSS:** Minimize custom CSS. If absolutely necessary:
  - For global styles or overrides: `src/app/globals.css`.
  - For component-specific styles not achievable with Tailwind: CSS Modules (`.module.css`).
- **Responsive Design:** Use Tailwind's responsive prefixes (e.g., `md:`, `lg:`) for adapting styles to different screen sizes.

### 11.4. State Management

- **Local State:** React's `useState` and `useReducer` for component-level state.
- **Global State (if needed):** Zustand is preferred for its simplicity and performance. React Context API can be used for simpler global state needs or theming.
- **Server State / Data Fetching:** Utilize React Server Components and Server Actions where possible for data fetching and mutations. For client-side data fetching and caching, consider libraries like SWR or React Query if complex needs arise, otherwise use `fetch` with `useEffect`.

### 11.5. Accessibility (A11y)

- **Semantic HTML:** Always use appropriate HTML elements for their intended purpose (e.g., `<button>` for buttons, `<nav>` for navigation).
- **Keyboard Navigation:** Ensure all interactive elements are focusable and operable via keyboard.
- **Focus States:** Maintain clear and visible focus indicators (Tailwind's default `ring` utilities are configured with `--ring`).
- **ARIA Attributes:** Use ARIA attributes to enhance accessibility where semantic HTML alone is insufficient. `shadcn/ui` components often handle this well. Double-check custom components.
- **Color Contrast:** Adhere to WCAG AA guidelines for text and background color combinations (see Section 1).
- **Testing:** Periodically test with assistive technologies like screen readers (VoiceOver, NVDA) and keyboard-only navigation.

### 11.6. Code Quality & Conventions

- **Linting & Formatting:** Adhere to ESLint and Prettier configurations in the project to maintain consistent code style.
- **TypeScript:** Utilize TypeScript's features for strong typing to reduce runtime errors and improve code clarity.
- **Component Design:** Aim for small, reusable components with clear props and responsibilities.
- **Naming Conventions:** Follow standard JavaScript/React naming conventions (PascalCase for components, camelCase for variables/functions).

## 12. Visual Do's and Don'ts

These guidelines help maintain the intended "clean, minimalist, professional, modern, sleek digital" aesthetic with subtle "Logos/Word" and "papyrus/waxy" nods.

### Do:

- **Embrace Whitespace:** (Or "Ivory space" given our `--background`). Generous spacing creates a clean, uncluttered, and premium feel.
- **Maintain Color Consistency:** Adhere strictly to the defined color palette (Section 1). Use semantic variables (`--primary`, `--muted`, etc.) to ensure theme adaptability.
- **Prioritize Readability:** Use clear typography (Section 4) with sufficient contrast against backgrounds.
- **Employ Subtle Interactions:** Animations and transitions should be tasteful, quick, and enhance the user experience without being distracting or slowing down perceived performance.
- **Use Icons Meaningfully:** Icons (Section 7) should be clear, simple (outline style preferred), and used consistently to support content, not just for decoration.
- **Ensure Visual Hierarchy:** Clearly distinguish between primary, secondary, and tertiary actions and information using size, weight, color, and placement.
- **Keep it Clean & Modern:** The overarching goal is a sleek digital interface. Papyrus/waxy elements should be extremely subtle (e.g., slight texture in a background gradient if any, or a specific icon choice), not literal representations that could make the UI feel dated or cluttered.
- **Consider Focus States:** All interactive elements must have clear, visible focus states that align with the theme (using `--ring`).

### Don't:

- **Overcrowd the UI:** Avoid placing too many elements close together. Let content breathe.
- **Introduce Unapproved Colors:** Refrain from adding new colors outside the defined palette (Section 1) without strong justification and team consensus.
- **Use Overly Decorative Fonts:** Stick to the defined sans-serif font (`--font-sans`) for all primary UI text. Highly stylized fonts should be avoided for readability.
- **Create Jarring Animations:** Avoid lengthy, complex, or distracting animations. Interactions should feel smooth and natural.
- **Mix Icon Styles:** Do not mix different icon families or styles (e.g., outline vs. filled vs. 3D) inconsistently.
- **Overuse Shadows or Gradients:** Use depth effects (Section 8) and background gradients (Section 10) subtly to add hierarchy or visual interest, not to the point where they make the UI feel heavy or busy.
- **Neglect Accessibility:** Never sacrifice accessibility (contrast, keyboard navigation, ARIA) for purely aesthetic reasons.

---

_This document is a living guide and will be updated as the design system evolves._

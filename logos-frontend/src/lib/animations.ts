import { Variants } from "framer-motion";

// Base animation for elements entering the viewport
export const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Reduced motion variants
export const fadeInVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Card hover animation
export const cardHoverVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },
};

// Reduced motion card hover
export const cardHoverVariantsReduced: Variants = {
  initial: { opacity: 1 },
  hover: {
    opacity: 0.8,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    opacity: 0.7,
    transition: {
      duration: 0.1,
    },
  },
};

// Button click animation
export const buttonTapVariants: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: "easeOut",
    },
  },
};

// Reduced motion button click
export const buttonTapVariantsReduced: Variants = {
  initial: { opacity: 1 },
  hover: {
    opacity: 0.8,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    opacity: 0.7,
    transition: {
      duration: 0.1,
    },
  },
};

// Form submission success animation
export const formSuccessVariants: Variants = {
  initial: { scale: 1, borderColor: "var(--border)" },
  success: {
    scale: [1, 1.02, 1],
    borderColor: ["var(--border)", "var(--primary)", "var(--border)"],
    transition: {
      duration: 0.4,
      ease: "easeOut",
      times: [0, 0.5, 1],
    },
  },
};

// Reduced motion form success
export const formSuccessVariantsReduced: Variants = {
  initial: { borderColor: "var(--border)" },
  success: {
    borderColor: ["var(--border)", "var(--primary)", "var(--border)"],
    transition: {
      duration: 0.4,
      times: [0, 0.5, 1],
    },
  },
};

// Staggered list item animation
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
};

// Reduced motion list item
export const listItemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

// Container for staggered children
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Reduced motion container
export const staggerContainerVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

// Page transition animation
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

// Reduced motion page transition
export const pageTransitionVariantsReduced: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

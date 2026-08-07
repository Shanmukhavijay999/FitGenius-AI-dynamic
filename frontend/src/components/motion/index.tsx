"use client";

/**
 * Reusable Framer Motion animation primitives.
 * Import these instead of writing motion variants inline to keep code DRY.
 */

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import React from "react";

/* --- Shared Easing Curves ------------------------------------ */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT   = [0.87, 0, 0.13, 1] as const;
export const SPRING        = { type: "spring", stiffness: 300, damping: 30 } as const;
export const SPRING_SLOW   = { type: "spring", stiffness: 120, damping: 20 } as const;

/* --- Fade Up ------------------------------------------------- */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: EASE_OUT_EXPO,
      delay: delay * 0.1,
    },
  }),
};

/* --- Fade In ------------------------------------------------- */
export const fadeInVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", delay: delay * 0.1 },
  }),
};

/* --- Scale In ------------------------------------------------ */
export const scaleInVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO, delay: delay * 0.1 },
  }),
};

/* --- Slide Left ---------------------------------------------- */
export const slideLeftVariants: Variants = {
  hidden:  { opacity: 0, x: -60 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO, delay: delay * 0.1 },
  }),
};

/* --- Slide Right --------------------------------------------- */
export const slideRightVariants: Variants = {
  hidden:  { opacity: 0, x: 60 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: EASE_OUT_EXPO, delay: delay * 0.1 },
  }),
};

/* --- Stagger Container --------------------------------------- */
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

/* --- Stagger Item (used inside stagger container) ------------ */
export const staggerItemVariants: Variants = {
  hidden:  { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT_EXPO },
  },
};

/* --- Reusable Animated Wrappers ------------------------------ */

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/** Fades and slides up when it enters the viewport. */
export function FadeUp({ children, delay = 0, className = "", ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={fadeUpVariants}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Fades in when it enters the viewport. */
export function FadeIn({ children, delay = 0, className = "", ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={fadeInVariants}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Scales up from 92% when it enters the viewport. */
export function ScaleIn({ children, delay = 0, className = "", ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={scaleInVariants}
      custom={delay}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Wraps children in a stagger container — children should use StaggerItem. */
export function StaggerContainer({ children, className = "", ...props }: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={staggerContainerVariants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Each child inside a StaggerContainer — slides up with auto-stagger timing. */
export function StaggerItem({ children, className = "", ...props }: MotionWrapperProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}

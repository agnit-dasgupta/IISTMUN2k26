/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useMemo } from "react";
import { motion } from "motion/react";

/**
 * Botanical Blossom & Branch SVG Component
 */
interface FlowerProps {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  delay?: number;
  hasLeaves?: boolean;
}

const SakuraBlossom: React.FC<FlowerProps> = ({
  x,
  y,
  scale = 1,
  rotation = 0,
  delay = 1.2,
  hasLeaves = true,
}) => {
  return (
    <motion.g
      transform={`translate(${x}, ${y}) rotate(${rotation})`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: scale, opacity: 1 }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.34, 1.3, 0.64, 1], // delicate bloom spring
      }}
      style={{ transformOrigin: "center" }}
    >
      {/* Tender young matcha leaves next to blossom */}
      {hasLeaves && (
        <g opacity="0.85">
          <path
            d="M 0 0 C -12 -8, -18 -22, -14 -30 C -6 -28, 2 -18, 0 0 Z"
            fill="url(#matchaLeafGrad)"
            opacity="0.9"
            transform="rotate(-25)"
          />
          <path
            d="M 0 0 C 14 -6, 20 -18, 16 -26 C 8 -24, 0 -16, 0 0 Z"
            fill="url(#matchaLeafGrad)"
            opacity="0.75"
            transform="rotate(35)"
          />
        </g>
      )}

      {/* 5 Petals of Delicate Blossom (Grey Tone Botanical Motif) */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <g key={i} transform={`rotate(${angle})`}>
          {/* Base petal body in grey tone gradient */}
          <path
            d="M 0,0 
               C -7,-10 -15,-20 -13,-30 
               C -11,-38 -4,-42 0,-37 
               C 4,-42 11,-38 13,-30 
               C 15,-20 7,-10 0,0 Z"
            fill="url(#sakuraPetalGrad)"
            stroke="rgba(110, 122, 114, 0.45)"
            strokeWidth="0.75"
          />
          {/* Inner petal highlight in soft pearl grey-white */}
          <path
            d="M 0,-4 
               C -4,-12 -8,-20 -7,-27 
               C -5,-32 0,-33 0,-33 
               C 0,-33 5,-32 7,-27 
               C 8,-20 4,-12 0,-4 Z"
            fill="rgba(244, 247, 245, 0.45)"
          />
        </g>
      ))}

      {/* Golden Stamens & Pistils - Providing striking contrast to grey petals */}
      <g opacity="0.95">
        {[18, 54, 90, 126, 162, 198, 234, 270, 306, 342].map((deg, idx) => (
          <g key={idx} transform={`rotate(${deg})`}>
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-15"
              stroke="#C9A86A"
              strokeWidth="0.85"
              strokeLinecap="round"
            />
            <circle
              cx="0"
              cy="-16"
              r="1.3"
              fill="#E5C17B"
            />
          </g>
        ))}
      </g>

      {/* Blossom Core Pistil & Center Calyx in deep charcoal and mineral grey */}
      <circle cx="0" cy="0" r="4.5" fill="#2E3630" opacity="0.85" />
      <circle cx="0" cy="0" r="2.5" fill="#8E9991" />
      <circle cx="0" cy="0" r="1.2" fill="#EDE6D3" />
    </motion.g>
  );
};

/**
 * Furled Sakura Flower Bud
 */
const SakuraBud: React.FC<{ x: number; y: number; rotation?: number; delay?: number; scale?: number }> = ({
  x,
  y,
  rotation = 0,
  delay = 1.0,
  scale = 0.8,
}) => (
  <motion.g
    transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`}
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale, opacity: 1 }}
    transition={{ duration: 0.7, delay, ease: "easeOut" }}
    style={{ transformOrigin: "center" }}
  >
    {/* Small green sepal */}
    <path
      d="M -3 0 C -4 -5, -6 -9, -3 -12 C 0 -8, 2 -4, 0 0 Z"
      fill="#5B6B4F"
    />
    <path
      d="M 3 0 C 4 -5, 6 -9, 3 -12 C 0 -8, -2 -4, 0 0 Z"
      fill="#6A7B52"
    />
    {/* Mineral Slate Bud */}
    <ellipse cx="0" cy="-10" rx="4" ry="7" fill="url(#sakuraBudGrad)" />
    <path
      d="M 0 -17 C -2 -14, -2 -7, 0 -4 C 2 -7, 2 -14, 0 -17 Z"
      fill="#D5DED6"
      opacity="0.85"
    />
  </motion.g>
);

/**
 * Main Animated Background Component with Growing Cherry Blossom Branches
 */
export default function CherryBlossomBackground() {
  const filterId = useId();

  // Floating petals configuration (with organic varied drift speeds, angles, and blurs)
  const petals = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => {
      const leftPercent = (i * 5.8 + 4) % 96; // distribute nicely across screen width
      const size = 11 + (i % 5) * 3.2;
      const duration = 12 + (i % 6) * 2.8; // 12s - 26s
      const delay = (i * 1.3) % 11;
      const driftX = 60 + ((i * 37) % 110) * (i % 2 === 0 ? 1 : -1);
      const rotZ = 240 + ((i * 53) % 360);
      const rotY = 180 + ((i * 41) % 180);
      const blur = i % 4 === 0 ? 1 : i % 5 === 0 ? 1.8 : 0;
      const opacity = 0.55 + (i % 4) * 0.12;

      return {
        id: i,
        leftPercent,
        size,
        duration,
        delay,
        driftX,
        rotZ,
        rotY,
        blur,
        opacity,
      };
    });
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* SVG Definitions for Botanical & Sustainable Gradients */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Petal Radial Gradient: Deep mineral slate center to delicate silver/mist grey blush */}
          <radialGradient id="sakuraPetalGrad" cx="50%" cy="100%" r="80%" fx="50%" fy="95%">
            <stop offset="0%" stopColor="#4D5750" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#7E8A81" stopOpacity="0.92" />
            <stop offset="70%" stopColor="#BAC5BC" stopOpacity="0.92" />
            <stop offset="90%" stopColor="#E5EBE5" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F5F8F5" stopOpacity="0.98" />
          </radialGradient>

          {/* Bud Gradient: Charcoal to Slate to Silver */}
          <linearGradient id="sakuraBudGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#2E3630" />
            <stop offset="45%" stopColor="#6C776F" />
            <stop offset="100%" stopColor="#D5DED6" />
          </linearGradient>

          {/* Sustainable Matcha & Bamboo Young Leaf Gradient */}
          <linearGradient id="matchaLeafGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#4A6048" />
            <stop offset="50%" stopColor="#6A7B52" />
            <stop offset="100%" stopColor="#8BA06F" />
          </linearGradient>

          {/* Bark Aged Wood Gradient for Top Right Branch */}
          <linearGradient id="branchBarkGradTR" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B140E" />
            <stop offset="40%" stopColor="#2D2118" />
            <stop offset="85%" stopColor="#3E3024" />
            <stop offset="100%" stopColor="#554434" />
          </linearGradient>

          {/* Bark Gradient for Top Left Branch */}
          <linearGradient id="branchBarkGradTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18130F" />
            <stop offset="50%" stopColor="#2E231B" />
            <stop offset="100%" stopColor="#4A3B2E" />
          </linearGradient>

          {/* Bark Lichen Accent */}
          <linearGradient id="mossLichenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A6048" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#889C73" stopOpacity="0.2" />
          </linearGradient>

          {/* Subtle Sakura Ambient Glow Filter */}
          <filter id={`sakuraGlow-${filterId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* ========================================================================= */}
      {/* 1. TOP-RIGHT CHERRY BLOSSOM BRANCH (ENTERING FROM TOP-RIGHT OUTSIDE)       */}
      {/* ========================================================================= */}
      <div className="absolute top-0 right-0 w-[380px] sm:w-[540px] md:w-[680px] lg:w-[820px] aspect-[16/11] animate-branch-tr">
        <svg
          viewBox="0 0 800 550"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
        >
          {/* Main Wooden Trunk - Grows from Outside Screen (Top Right: 830, -30) */}
          <motion.path
            d="M 830 -30 
               C 740 40, 680 90, 610 120 
               C 530 155, 460 170, 390 220 
               C 330 260, 270 320, 210 390 
               C 170 435, 120 470, 60 500"
            stroke="url(#branchBarkGradTR)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.95 }}
            transition={{
              duration: 1.8,
              ease: [0.16, 1, 0.3, 1], // fluid organic growth
            }}
          />

          {/* Secondary Branch 1: Arching higher right into center */}
          <motion.path
            d="M 610 120 
               C 560 80, 500 50, 430 40 
               C 360 30, 290 55, 230 85"
            stroke="url(#branchBarkGradTR)"
            strokeWidth="7.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{
              duration: 1.4,
              delay: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Secondary Branch 2: Arching lower inward */}
          <motion.path
            d="M 390 220 
               C 360 170, 320 130, 260 120 
               C 210 110, 160 130, 110 160"
            stroke="url(#branchBarkGradTR)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.88 }}
            transition={{
              duration: 1.3,
              delay: 0.55,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Delicate Tertiary Twigs */}
          <motion.path
            d="M 230 85 C 190 70, 160 80, 130 100"
            stroke="url(#branchBarkGradTR)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.0, delay: 0.75 }}
          />
          <motion.path
            d="M 430 40 C 400 15, 360 10, 320 20"
            stroke="url(#branchBarkGradTR)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 0.9, delay: 0.65 }}
          />
          <motion.path
            d="M 210 390 C 180 340, 140 310, 90 300"
            stroke="url(#branchBarkGradTR)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.1, delay: 0.8 }}
          />

          {/* Lichen Moss Highlighting along Branch Shoulders */}
          <motion.path
            d="M 720 50 C 650 100, 560 145, 450 175"
            stroke="url(#mossLichenGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1.0, delay: 0.9 }}
          />

          {/* ================= Blossom Clusters on Top-Right Branch ================= */}
          {/* Mature full blossoms that bloom as the branch extends */}
          <SakuraBlossom x={670} y={80} scale={1.05} rotation={12} delay={0.45} />
          <SakuraBlossom x={590} y={130} scale={1.2} rotation={-25} delay={0.65} />
          <SakuraBlossom x={520} y={70} scale={0.95} rotation={45} delay={0.8} />
          <SakuraBlossom x={440} y={45} scale={1.15} rotation={-10} delay={0.95} />
          <SakuraBlossom x={380} y={230} scale={1.25} rotation={30} delay={1.05} />
          <SakuraBlossom x={330} y={160} scale={0.9} rotation={-40} delay={1.15} />
          <SakuraBlossom x={260} y={120} scale={1.1} rotation={15} delay={1.25} />
          <SakuraBlossom x={220} y={85} scale={1.0} rotation={-18} delay={1.3} />
          <SakuraBlossom x={140} y={100} scale={0.85} rotation={50} delay={1.4} />
          <SakuraBlossom x={210} y={390} scale={1.15} rotation={-15} delay={1.35} />
          <SakuraBlossom x={130} y={310} scale={0.95} rotation={35} delay={1.45} />
          <SakuraBlossom x={70} y={495} scale={0.9} rotation={-20} delay={1.55} />

          {/* Delicate young buds on outer twigs */}
          <SakuraBud x={315} y={18} rotation={-35} delay={1.0} scale={0.9} />
          <SakuraBud x={120} y={105} rotation={65} delay={1.35} scale={0.8} />
          <SakuraBud x={85} y={295} rotation={-70} delay={1.45} scale={0.85} />
          <SakuraBud x={50} y={505} rotation={40} delay={1.55} scale={0.75} />
          <SakuraBud x={460} y={180} rotation={20} delay={0.95} scale={0.85} />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP-LEFT CHERRY BLOSSOM BRANCH (ENTERING FROM TOP-LEFT OUTSIDE)         */}
      {/* ========================================================================= */}
      <div className="absolute top-0 left-0 w-[300px] sm:w-[420px] md:w-[520px] lg:w-[620px] aspect-[16/12] animate-branch-tl">
        <svg
          viewBox="0 0 600 450"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]"
        >
          {/* Main Trunk entering from outside screen (x: -30, y: -20) */}
          <motion.path
            d="M -30 -20 
               C 50 40, 110 80, 180 110 
               C 260 145, 330 180, 390 240 
               C 440 290, 480 350, 510 420"
            stroke="url(#branchBarkGradTL)"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.92 }}
            transition={{
              duration: 1.7,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Secondary Branch climbing gently right */}
          <motion.path
            d="M 180 110 
               C 220 70, 270 50, 340 45 
               C 390 40, 440 60, 480 90"
            stroke="url(#branchBarkGradTL)"
            strokeWidth="5.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.88 }}
            transition={{
              duration: 1.2,
              delay: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Lower delicate branch */}
          <motion.path
            d="M 330 180 
               C 320 230, 290 270, 240 300"
            stroke="url(#branchBarkGradTL)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{
              duration: 1.1,
              delay: 0.65,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          {/* Blossoms on Top-Left Branch */}
          <SakuraBlossom x={110} y={75} scale={1.0} rotation={-15} delay={0.55} />
          <SakuraBlossom x={190} y={115} scale={1.15} rotation={25} delay={0.75} />
          <SakuraBlossom x={270} y={60} scale={0.9} rotation={-35} delay={0.95} />
          <SakuraBlossom x={350} y={45} scale={1.05} rotation={15} delay={1.15} />
          <SakuraBlossom x={460} y={85} scale={0.85} rotation={40} delay={1.3} />
          <SakuraBlossom x={340} y={185} scale={1.2} rotation={-10} delay={1.25} />
          <SakuraBlossom x={250} y={295} scale={0.95} rotation={30} delay={1.4} />
          <SakuraBlossom x={400} y={250} scale={1.05} rotation={-25} delay={1.35} />
          <SakuraBlossom x={500} y={410} scale={0.85} rotation={15} delay={1.5} />

          {/* Buds */}
          <SakuraBud x={485} y={95} rotation={45} delay={1.3} scale={0.8} />
          <SakuraBud x={230} y={305} rotation={-45} delay={1.4} scale={0.75} />
          <SakuraBud x={520} y={425} rotation={20} delay={1.55} scale={0.7} />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM-LEFT GROUNDING SAKURA BRANCH (ENTERING FROM BOTTOM-LEFT)        */}
      {/* ========================================================================= */}
      <div className="absolute bottom-0 left-0 w-[260px] sm:w-[360px] md:w-[460px] aspect-[16/10] animate-branch-bl opacity-75">
        <svg
          viewBox="0 0 460 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]"
        >
          {/* Branch growing upward from bottom-left corner */}
          <motion.path
            d="M -20 320 
               C 40 260, 90 210, 150 170 
               C 210 130, 270 100, 340 70"
            stroke="url(#branchBarkGradTL)"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.9 }}
            transition={{
              duration: 1.6,
              delay: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
          />

          <motion.path
            d="M 150 170 C 180 140, 200 90, 220 50"
            stroke="url(#branchBarkGradTL)"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.1, delay: 0.65 }}
          />

          <SakuraBlossom x={90} y={215} scale={1.0} rotation={20} delay={0.7} />
          <SakuraBlossom x={160} y={170} scale={1.15} rotation={-15} delay={0.95} />
          <SakuraBlossom x={220} y={55} scale={0.9} rotation={35} delay={1.2} />
          <SakuraBlossom x={330} y={75} scale={1.05} rotation={-25} delay={1.4} />
          <SakuraBud x={350} y={65} rotation={30} delay={1.45} scale={0.8} />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 4. FALLING DRIFTING PETALS (BOTANICAL BREEZE)                              */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {petals.map((petal) => (
          <div
            key={petal.id}
            className="absolute animate-petal"
            style={
              {
                left: `${petal.leftPercent}%`,
                top: `-50px`,
                width: `${petal.size}px`,
                height: `${petal.size * 1.3}px`,
                animationDuration: `${petal.duration}s`,
                animationDelay: `${petal.delay}s`,
                filter: petal.blur ? `blur(${petal.blur}px)` : undefined,
                opacity: petal.opacity,
                "--drift-x": `${petal.driftX}px`,
                "--rot-z": `${petal.rotZ}deg`,
                "--rot-y": `${petal.rotY}deg`,
              } as React.CSSProperties
            }
          >
            <svg
              viewBox="0 0 30 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]"
            >
              {/* Organic curved petal shape with natural heart notch in grey tone */}
              <path
                d="M 15 38 
                   C 7 28, 1 18, 2 9 
                   C 3 3, 9 0, 15 4 
                   C 21 0, 27 3, 28 9 
                   C 29 18, 23 28, 15 38 Z"
                fill="url(#sakuraPetalGrad)"
                stroke="rgba(110, 122, 114, 0.45)"
                strokeWidth="0.6"
              />
              {/* Petal fold/crease line for 3D realism */}
              <path
                d="M 15 6 C 15 15, 15 25, 15 34"
                stroke="rgba(110, 122, 114, 0.35)"
                strokeWidth="0.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

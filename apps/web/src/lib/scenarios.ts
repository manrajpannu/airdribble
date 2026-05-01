import { FlowMovement } from "../../../../src/Ball/Movement/FlowMovement";
import { CoolMovement } from "../../../../src/Ball/Movement/CoolMovement";

export type Scenario = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail: string;
  icon: "flick" | "tracking" | "precision";
  config: {
    numBalls?: number;
    health?: number;
    movement?: any;
    size?: number | number[];
    timeLimit?: number;
    boundary?: number;
    colors?: string[];
    reticleType?: 'cross' | 'x' | 'ring' | 'box';
    reticleColor?: string;
    holdSliderEnabled?: boolean;
    holdSliderSeconds?: number;
    isStriped?: boolean;
    stripedAngle?: number | "random";
    stripeTolerance?: number;
    bulletsEnabled?: boolean;
    bulletAmmo?: number;
    bulletCooldownSeconds?: number;
    bulletReloadSeconds?: number;
    autoBulletReload?: boolean;
    killEffect?: string;
    onHoverEffect?: string;
    pointsPerKill?: number;
    pointsPerHit?: number;
    pointsPerMiss?: number;
  };
};

export const SCENARIOS: Scenario[] = [
  {
    id: "tutorial",
    title: "Tutorial",
    description: "Learn the basics of moving, air rolling, and shooting.",
    tags: ["basics", "tutorial"],
    thumbnail: "from-zinc-500/20 to-zinc-500/5",
    icon: "tracking",
    config: {},
  },
  {
    id: "one-shot",
    title: "One Shot",
    description: "Make accurate and powerful shots to score goals.",
    tags: ["accuracy", "easy"],
    thumbnail: "from-blue-500/20 to-blue-500/5",
    icon: "precision",
    config: {
      numBalls: 1,
      killEffect: 'whiteGlitter',
      health: 1,
      size: 4,
      timeLimit: 60,
      boundary: 40,
      colors: ['#3459ff', '#04f460', '#f4e404', '#f776fc', '#3cff94', '#3ee9ff'],
      pointsPerKill: 100,
      pointsPerHit: 0,
      pointsPerMiss: -50,
    },
  },
  {
    id: "ball-tracking",
    title: "Ball Tracking",
    description: "Track and control the ball with precision.",
    tags: ["tracking", "control", "intermediate"],
    thumbnail: "from-green-500/20 to-green-500/5",
    icon: "tracking",
    config: {
      numBalls: 1,
      health: 100,
      holdSliderEnabled: true,
      holdSliderSeconds: 1.5,
      movement: FlowMovement,
      size: 3.0,
      timeLimit: 60,
      boundary: 40,
      colors: ["#04f460"],
      pointsPerKill: 500,
      pointsPerHit: 1,
      pointsPerMiss: -10,
    },
  },
  {
    id: "direction-control",
    title: "Direction Control",
    description: "Improve your aerial control and shot direction.",
    tags: ["direction", "control", "intermediate"],
    thumbnail: "from-purple-500/20 to-purple-500/5",
    icon: "precision",
    config: {
      numBalls: 3,
      health: 3,
      size: [3, 5],
      timeLimit: 60,
      boundary: 40,
      colors: ["#f776fc", "#3ee9ff"],
      isStriped: true,
      onHoverEffect: 'none',
      stripedAngle: "random",
      pointsPerKill: 50,
      pointsPerHit: 10,
      pointsPerMiss: -20,
    },
  },
];

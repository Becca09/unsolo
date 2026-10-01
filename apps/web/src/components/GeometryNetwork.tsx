"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface PhotoNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  image: string;
  label: string;
}

const BASE_PHOTOS = [
  { image: "/images/pexels-ron-lach-8922188.jpg", label: "Traveler" },
  { image: "/images/pexels-ron-lach-10318038.jpg", label: "Traveler" },
  { image: "/images/pexels-gustavo-fring-5622109.jpg", label: "Planner" },
  { image: "/images/pexels-alex360-13570626.jpg", label: "Business" },
  { image: "/images/pexels-tahaasamett-9961871.jpg", label: "Traveler" },
  { image: "/images/pexels-bertellifotografia-3752600.jpg", label: "Business" },
  { image: "/images/pexels-bayu-prakosa-243773629-12366304.jpg", label: "Planner" },
  { image: "/images/pexels-charlotteblackcarservice-36377058.jpg", label: "Business" },
  { image: "/images/pexels-mk7-bober-41368449-11169551.jpg", label: "Traveler" },
  { image: "/images/pexels-rebornfilmes-31267002.jpg", label: "Traveler" },
];

const PHOTOS = Array.from({ length: 24 }, (_, i) => BASE_PHOTOS[i % BASE_PHOTOS.length]!);

const NODE_SIZE = 48;
const RADIUS = NODE_SIZE / 2;
const MAX_DISTANCE = 320;

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function GeometryNetwork() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<PhotoNode[]>([]);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const init = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      setDims({ width, height });

      const pad = RADIUS + 24;
      const count = Math.min(PHOTOS.length, Math.max(6, Math.floor((width * height) / 50000)));
      const newNodes: PhotoNode[] = Array.from({ length: count }, (_, i) => {
        const safeWidth = Math.max(pad * 2, width);
        const safeHeight = Math.max(pad * 2, height);
        return {
          id: i,
          x: pad + seededRandom(i * 2) * (safeWidth - pad * 2),
          y: pad + seededRandom(i * 2 + 1) * (safeHeight - pad * 2),
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          image: PHOTOS[i % PHOTOS.length]!.image,
          label: PHOTOS[i % PHOTOS.length]!.label,
        };
      });
      setNodes(newNodes);
    };

    init();
    const handleResize = () => init();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (nodes.length === 0) return;

    const animate = () => {
      setNodes((prev) =>
        prev.map((node) => {
          let nx = node.x + node.vx;
          let ny = node.y + node.vy;
          let nvx = node.vx;
          let nvy = node.vy;
          const pad = RADIUS + 16;

          if (nx < pad || nx > dims.width - pad) nvx *= -1;
          if (ny < pad || ny > dims.height - pad) nvy *= -1;

          nx = Math.max(pad, Math.min(dims.width - pad, nx));
          ny = Math.max(pad, Math.min(dims.height - pad, ny));

          return { ...node, x: nx, y: ny, vx: nvx, vy: nvy };
        }),
      );
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [nodes.length, dims.width, dims.height]);

  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]!;
      const b = nodes[j]!;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DISTANCE) {
        lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full">
        {lines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#6D8D08"
            strokeWidth="1.5"
            strokeOpacity="0.45"
            className="animate-pulse"
          />
        ))}
      </svg>

      {nodes.map((node) => (
        <div
          key={node.id}
          className="border-unsolo-sage bg-unsolo-surface shadow-unsolo-primary/10 absolute flex items-center justify-center rounded-full border-2 shadow-lg"
          style={{
            width: NODE_SIZE,
            height: NODE_SIZE,
            left: node.x - RADIUS,
            top: node.y - RADIUS,
          }}
        >
          <Image
            src={node.image}
            alt={node.label}
            width={NODE_SIZE - 8}
            height={NODE_SIZE - 8}
            className="rounded-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

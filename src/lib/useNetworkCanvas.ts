'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface Node {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  opacity: number;
  connected: boolean;
  phase: number; // 0 = chaos, 1 = discovered, 2 = built, 3 = clarity
}

interface Connection {
  from: number;
  to: number;
  progress: number;
  active: boolean;
}

const LABELS = ['EMAIL', 'EXCEL', 'WHATSAPP', 'CALL', 'PDF', 'CALENDAR', 'NOTES', 'FORMS', 'INVOICES', 'CRM', 'ORDERS', 'REPORTS'];

function createNodes(width: number, height: number): Node[] {
  const nodes: Node[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const gridCols = 4;
  const gridRows = 3;
  const spacingX = Math.min(width * 0.15, 160);
  const spacingY = Math.min(height * 0.15, 120);
  
  LABELS.forEach((label, i) => {
    const row = Math.floor(i / gridCols);
    const col = i % gridCols;
    // Target positions form a clean grid (for clarity phase)
    const targetX = centerX + (col - (gridCols - 1) / 2) * spacingX;
    const targetY = centerY + (row - (gridRows - 1) / 2) * spacingY;
    // Start positions are scattered (chaos)
    const chaosX = Math.random() * width * 0.8 + width * 0.1;
    const chaosY = Math.random() * height * 0.8 + height * 0.1;
    
    nodes.push({
      x: chaosX,
      y: chaosY,
      targetX,
      targetY,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: 4,
      label,
      opacity: 0.6,
      connected: false,
      phase: 0,
    });
  });
  
  return nodes;
}

function createConnections(nodeCount: number): Connection[] {
  const connections: Connection[] = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < 0.3) {
        connections.push({ from: i, to: j, progress: 0, active: false });
      }
    }
  }
  return connections;
}

export function useNetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const progressRef = useRef(0);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    canvas.height = rect.height * (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
    
    nodesRef.current = createNodes(canvas.width, canvas.height);
    connectionsRef.current = createConnections(nodesRef.current.length);
    setIsInitialized(true);
  }, []);

  const updateProgress = useCallback((scrollProgress: number) => {
    progressRef.current = Math.max(0, Math.min(1, scrollProgress));
  }, []);

  const updateMouse = useCallback((x: number, y: number) => {
    mouseRef.current = { x, y };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    
    function animate() {
      if (!ctx || !canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const progress = progressRef.current;
      
      // Clear
      ctx.clearRect(0, 0, w, h);
      
      const nodes = nodesRef.current;
      const connections = connectionsRef.current;
      
      // Phase thresholds
      const phase = progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 3;
      const phaseProgress = (progress % 0.25) / 0.25;
      
      // Update nodes
      nodes.forEach((node, i) => {
        if (phase === 0) {
          // Chaos: random jitter movement
          node.vx += (Math.random() - 0.5) * 0.5;
          node.vy += (Math.random() - 0.5) * 0.5;
          node.vx *= 0.95;
          node.vy *= 0.95;
          node.x += node.vx;
          node.y += node.vy;
          // Boundary bounce
          if (node.x < 50 || node.x > w - 50) node.vx *= -1;
          if (node.y < 50 || node.y > h - 50) node.vy *= -1;
          node.x = Math.max(50, Math.min(w - 50, node.x));
          node.y = Math.max(50, Math.min(h - 50, node.y));
          node.opacity = 0.3 + Math.random() * 0.3;
          node.connected = false;
        } else if (phase === 1) {
          // Discovery: slow down, start showing connections
          node.vx *= 0.92;
          node.vy *= 0.92;
          node.x += node.vx;
          node.y += node.vy;
          node.opacity = 0.5 + phaseProgress * 0.3;
          node.connected = phaseProgress > (i / nodes.length);
        } else if (phase === 2) {
          // Build: move toward targets
          const t = Math.min(1, phaseProgress * 1.5);
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          node.x += (node.targetX - node.x) * eased * 0.08;
          node.y += (node.targetY - node.y) * eased * 0.08;
          node.vx = 0;
          node.vy = 0;
          node.opacity = 0.7 + phaseProgress * 0.3;
          node.connected = true;
        } else {
          // Clarity: at target, subtle float
          const floatX = Math.sin(Date.now() * 0.001 + i) * 2;
          const floatY = Math.cos(Date.now() * 0.0015 + i) * 2;
          node.x += (node.targetX + floatX - node.x) * 0.1;
          node.y += (node.targetY + floatY - node.y) * 0.1;
          node.opacity = 1;
          node.connected = true;
        }
      });
      
      // Draw subtle grid (increases with phase)
      const gridOpacity = Math.min(0.08, phase * 0.025);
      if (gridOpacity > 0) {
        ctx.strokeStyle = `rgba(0, 229, 255, ${gridOpacity})`;
        ctx.lineWidth = 0.5;
        const gridSize = 60 * dpr;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }
      
      // Draw connections
      connections.forEach(conn => {
        const fromNode = nodes[conn.from];
        const toNode = nodes[conn.to];
        if (!fromNode || !toNode) return;
        
        const dist = Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y);
        const maxDist = phase >= 2 ? w * 0.5 : w * 0.25;
        
        if (dist > maxDist) return;
        
        let alpha = 0;
        if (phase === 0) {
          alpha = dist < 150 * dpr ? 0.05 : 0;
        } else if (phase === 1) {
          alpha = (fromNode.connected && toNode.connected) ? 0.15 * phaseProgress : 0.03;
        } else if (phase === 2) {
          alpha = 0.15 + phaseProgress * 0.15;
        } else {
          alpha = 0.3;
        }
        
        if (alpha <= 0) return;
        
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        if (phase >= 2) {
          const gradient = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
          gradient.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
          gradient.addColorStop(0.5, `rgba(124, 58, 237, ${alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(0, 229, 255, ${alpha})`);
          ctx.strokeStyle = gradient;
        } else {
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
        }
        ctx.lineWidth = phase >= 3 ? 1.5 : 1;
        ctx.stroke();
        
        // Signal pulse on connections in build/clarity
        if (phase >= 2 && alpha > 0.1) {
          const pulsePos = (Date.now() * 0.001 + conn.from * 0.5) % 1;
          const px = fromNode.x + (toNode.x - fromNode.x) * pulsePos;
          const py = fromNode.y + (toNode.y - fromNode.y) * pulsePos;
          ctx.beginPath();
          ctx.arc(px, py, 2 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, ${alpha * 2})`;
          ctx.fill();
        }
      });
      
      // Draw nodes
      nodes.forEach((node) => {
        // Outer glow
        const glowRadius = phase >= 2 ? 20 * dpr : 12 * dpr;
        const glowGradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        glowGradient.addColorStop(0, `rgba(0, 229, 255, ${node.opacity * 0.3})`);
        glowGradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Core circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * dpr, 0, Math.PI * 2);
        ctx.fillStyle = phase >= 3 
          ? `rgba(0, 229, 255, ${node.opacity})`
          : `rgba(232, 234, 237, ${node.opacity})`;
        ctx.fill();
        
        // Label (only in build/clarity)
        if (phase >= 2) {
          const labelOpacity = phase === 2 ? phaseProgress * 0.6 : 0.6;
          ctx.font = `${9 * dpr}px "JetBrains Mono", monospace`;
          ctx.fillStyle = `rgba(0, 229, 255, ${labelOpacity})`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + 18 * dpr);
        }
      });
      
      // Central intelligence glow (discovery/build phase)
      if (phase === 1 || phase === 2) {
        const centerX = w / 2;
        const centerY = h / 2;
        const radius = (phase === 1 ? phaseProgress : 1) * Math.min(w, h) * 0.3;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(0, 229, 255, ${phase === 1 ? 0.08 * phaseProgress : 0.05})`);
        gradient.addColorStop(0.5, `rgba(124, 58, 237, ${phase === 1 ? 0.04 * phaseProgress : 0.02})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
      
      // Scan line effect
      if (phase === 1) {
        const scanY = (Date.now() * 0.0003 % 1) * h;
        ctx.fillStyle = `rgba(0, 229, 255, ${0.03 * phaseProgress})`;
        ctx.fillRect(0, scanY - 50 * dpr, w, 100 * dpr);
      }
      
      frameRef.current = requestAnimationFrame(animate);
    }
    
    animate();
    
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isInitialized]);

  return { canvasRef, init, updateProgress, updateMouse };
}

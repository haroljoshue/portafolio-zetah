import { useEffect, useRef } from 'react';

interface ThreeDWordProps {
  text: string;
  color?: 'cyan' | 'purple' | 'emerald';
}

export default function ThreeDWord({ text, color = 'cyan' }: ThreeDWordProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    interface Point3D {
      x: number;
      y: number;
      z: number;
    }

    interface Line3D {
      a: number; // point A index
      b: number; // point B index
    }

    // Centered letter model definitions
    interface LetterDef {
      points: { x: number; y: number }[];
      lines: [number, number][];
    }

    const letterDefs: Record<string, LetterDef> = {
      A: {
        points: [
          { x: -0.35, y: 0.5 },  // 0: bottom left
          { x: 0, y: -0.5 },     // 1: top peak
          { x: 0.35, y: 0.5 },   // 2: bottom right
          { x: -0.18, y: 0.1 },  // 3: crossbar left
          { x: 0.18, y: 0.1 }    // 4: crossbar right
        ],
        lines: [[0, 1], [1, 2], [3, 4]]
      },
      C: {
        points: [
          { x: 0.35, y: -0.5 },
          { x: -0.35, y: -0.5 },
          { x: -0.35, y: 0.5 },
          { x: 0.35, y: 0.5 }
        ],
        lines: [[0, 1], [1, 2], [2, 3]]
      },
      E: {
        points: [
          { x: 0.35, y: -0.5 },
          { x: -0.35, y: -0.5 },
          { x: -0.35, y: 0.5 },
          { x: 0.35, y: 0.5 },
          { x: -0.35, y: 0 },
          { x: 0.2, y: 0 }
        ],
        lines: [[0, 1], [1, 2], [2, 3], [4, 5]]
      },
      H: {
        points: [
          { x: -0.35, y: -0.5 },
          { x: -0.35, y: 0.5 },
          { x: 0.35, y: -0.5 },
          { x: 0.35, y: 0.5 },
          { x: -0.35, y: 0 },
          { x: 0.35, y: 0 }
        ],
        lines: [[0, 1], [2, 3], [4, 5]]
      },
      I: {
        points: [
          { x: 0, y: -0.5 },
          { x: 0, y: 0.5 },
          { x: -0.2, y: -0.5 },
          { x: 0.2, y: -0.5 },
          { x: -0.2, y: 0.5 },
          { x: 0.2, y: 0.5 }
        ],
        lines: [[0, 1], [2, 3], [4, 5]]
      },
      L: {
        points: [
          { x: -0.35, y: -0.5 },
          { x: -0.35, y: 0.5 },
          { x: 0.35, y: 0.5 }
        ],
        lines: [[0, 1], [1, 2]]
      },
      P: {
        points: [
          { x: -0.35, y: 0.5 },
          { x: -0.35, y: -0.5 },
          { x: 0.3, y: -0.5 },
          { x: 0.3, y: 0 },
          { x: -0.35, y: 0 }
        ],
        lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
      },
      T: {
        points: [
          { x: -0.35, y: -0.5 },
          { x: 0.35, y: -0.5 },
          { x: 0, y: -0.5 },
          { x: 0, y: 0.5 }
        ],
        lines: [[0, 1], [2, 3]]
      },
      Y: {
        points: [
          { x: -0.35, y: -0.5 },
          { x: 0.35, y: -0.5 },
          { x: 0, y: 0 },
          { x: 0, y: 0.5 }
        ],
        lines: [[0, 2], [1, 2], [2, 3]]
      },
      Z: {
        points: [
          { x: -0.35, y: -0.5 },
          { x: 0.35, y: -0.5 },
          { x: -0.35, y: 0.5 },
          { x: 0.35, y: 0.5 }
        ],
        lines: [[0, 1], [1, 2], [2, 3]]
      }
    };

    // Construct 3D Word model
    const points: Point3D[] = [];
    const lines: Line3D[] = [];
    const wordWidth = text.length;
    const spacing = 1.0;
    const extrudeDepth = 0.25;

    // Build model by shifting letters
    const charArray = text.toUpperCase().split('');
    let pointOffset = 0;

    charArray.forEach((char, index) => {
      const def = letterDefs[char] || letterDefs['H']; // fallback to H
      const xOffset = (index - (wordWidth - 1) / 2) * spacing;

      // Add points for front and back faces
      def.points.forEach(p => {
        // Front face (z = extrudeDepth)
        points.push({
          x: p.x + xOffset,
          y: p.y,
          z: extrudeDepth
        });
        // Back face (z = -extrudeDepth)
        points.push({
          x: p.x + xOffset,
          y: p.y,
          z: -extrudeDepth
        });
      });

      // Add lines for front face, back face, and depth connectors
      def.lines.forEach(([a, b]) => {
        const frontA = pointOffset + a * 2;
        const frontB = pointOffset + b * 2;
        const backA = pointOffset + a * 2 + 1;
        const backB = pointOffset + b * 2 + 1;

        // Front line
        lines.push({ a: frontA, b: frontB });
        // Back line
        lines.push({ a: backA, b: backB });
      });

      // Connect front and back points for depth
      for (let i = 0; i < def.points.length; i++) {
        const frontIdx = pointOffset + i * 2;
        const backIdx = pointOffset + i * 2 + 1;
        lines.push({ a: frontIdx, b: backIdx });
      }

      pointOffset += def.points.length * 2;
    });

    // Floating particles (Digital dust)
    const particlesCount = 35;
    interface Particle {
      x: number;
      y: number;
      z: number;
      speed: number;
      size: number;
    }
    const particles: Particle[] = [];
    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 3,
        z: (Math.random() - 0.5) * 3,
        speed: 0.0015 + Math.random() * 0.003,
        size: 1 + Math.random() * 1.5
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current.targetX = (x / width) * 2 - 1;
      mouseRef.current.targetY = (y / height) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let angleY = 0;
    let angleX = 0;

    // Projection math constants
    // Auto-scale to fit the canvas width/height
    const scale = Math.min(width, height) * (0.17 / (wordWidth * 0.15 + 0.5));
    const fov = 4.5;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Base auto rotation + mouse drag parallax
      angleY = Date.now() * 0.0006 + mouse.x * 0.8;
      angleX = Math.sin(Date.now() * 0.0003) * 0.1 - mouse.y * 0.4;

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      interface ProjectedPoint {
        x: number;
        y: number;
        z: number;
      }
      const projected: ProjectedPoint[] = [];

      points.forEach(p => {
        // Y-axis rotation
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // X-axis rotation
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Perspective projection
        const perspective = fov / (fov + z2);
        projected.push({
          x: x1 * perspective * scale + width / 2,
          y: y2 * perspective * scale + height / 2,
          z: z2
        });
      });

      // Draw background particles
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -2.2) p.y = 2.2;

        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const perspective = fov / (fov + z2);
        const px = x1 * perspective * scale + width / 2;
        const py = y2 * perspective * scale + height / 2;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.max(0.05, Math.min(0.5, (fov - z2) / (fov * 1.5)));
          ctx.beginPath();
          ctx.arc(px, py, p.size * perspective, 0, Math.PI * 2);
          if (color === 'cyan') ctx.fillStyle = `rgba(0, 210, 255, ${alpha})`;
          else if (color === 'purple') ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
          else ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
          ctx.fill();
        }
      });

      // Draw 3D wireframe lines
      lines.forEach(l => {
        const ptA = projected[l.a];
        const ptB = projected[l.b];

        if (!ptA || !ptB) return;

        const avgZ = (ptA.z + ptB.z) / 2;
        const depthAlpha = Math.max(0.12, Math.min(0.9, (fov - avgZ) / (fov * 1.2)));

        ctx.beginPath();
        ctx.moveTo(ptA.x, ptA.y);
        ctx.lineTo(ptB.x, ptB.y);

        if (color === 'cyan') {
          ctx.strokeStyle = `rgba(0, 210, 255, ${depthAlpha * 0.95})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(0, 210, 255, 0.4)';
          ctx.shadowBlur = 5;
        } else if (color === 'purple') {
          ctx.strokeStyle = `rgba(168, 85, 247, ${depthAlpha * 0.95})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
          ctx.shadowBlur = 5;
        } else {
          ctx.strokeStyle = `rgba(16, 185, 129, ${depthAlpha * 0.95})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
          ctx.shadowBlur = 5;
        }

        ctx.stroke();
      });

      ctx.shadowBlur = 0;

      // Draw futuristic HUD bracket corner frames
      ctx.strokeStyle = color === 'cyan' ? 'rgba(0, 210, 255, 0.15)' : color === 'purple' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)';
      ctx.lineWidth = 1;
      const boxW = scale * (wordWidth * 0.65 + 0.4);
      const boxH = scale * 1.3;
      const bx = width / 2 - boxW / 2;
      const by = height / 2 - boxH / 2;

      ctx.beginPath();
      // top-left
      ctx.moveTo(bx, by + 15); ctx.lineTo(bx, by); ctx.lineTo(bx + 15, by);
      // top-right
      ctx.moveTo(bx + boxW - 15, by); ctx.lineTo(bx + boxW, by); ctx.lineTo(bx + boxW, by + 15);
      // bottom-left
      ctx.moveTo(bx, by + boxH - 15); ctx.lineTo(bx, by + boxH); ctx.lineTo(bx + 15, by + boxH);
      // bottom-right
      ctx.moveTo(bx + boxW - 15, by + boxH); ctx.lineTo(bx + boxW, by + boxH); ctx.lineTo(bx + boxW, by + boxH - 15);
      ctx.stroke();

      // Digital tag
      ctx.fillStyle = color === 'cyan' ? 'rgba(0, 210, 255, 0.4)' : color === 'purple' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)';
      ctx.font = '9px monospace';
      ctx.fillText(`SYSTEM_MODEL: ${text}_3D`, bx + 5, by + 12);
      ctx.fillText(`ROT_Y: ${(angleY % (Math.PI * 2)).toFixed(2)} rad`, bx + 5, by + boxH - 8);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, [text, color]);

  return (
    <div className="three-d-container">
      <canvas ref={canvasRef} className="three-d-canvas" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

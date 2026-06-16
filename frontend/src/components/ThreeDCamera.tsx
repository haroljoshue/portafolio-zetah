import { useEffect, useRef } from 'react';

export default function ThreeDCamera() {
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

    // 3D Point structure
    interface Point3D {
      x: number;
      y: number;
      z: number;
    }

    // 3D Line structure
    interface Line3D {
      a: number; // Index of point A
      b: number; // Index of point B
      color?: string;
    }

    // Construct DSLR Camera 3D wireframe
    const points: Point3D[] = [];
    const lines: Line3D[] = [];

    // --- 1. Camera Body (Box) ---
    // Back face (z = -0.5)
    points.push({ x: -1.2, y: -0.7, z: -0.5 }); // 0
    points.push({ x: 1.2, y: -0.7, z: -0.5 });  // 1
    points.push({ x: 1.2, y: 0.7, z: -0.5 });   // 2
    points.push({ x: -1.2, y: 0.7, z: -0.5 });  // 3
    // Front face (z = 0.5)
    points.push({ x: -1.2, y: -0.7, z: 0.5 });  // 4
    points.push({ x: 1.2, y: -0.7, z: 0.5 });   // 5
    points.push({ x: 1.2, y: 0.7, z: 0.5 });    // 6
    points.push({ x: -1.2, y: 0.7, z: 0.5 });   // 7

    // Connect body boxes
    lines.push({ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }, { a: 3, b: 0 }); // Back
    lines.push({ a: 4, b: 5 }, { a: 5, b: 6 }, { a: 6, b: 7 }, { a: 7, b: 4 }); // Front
    lines.push({ a: 0, b: 4 }, { a: 1, b: 5 }, { a: 2, b: 6 }, { a: 3, b: 7 }); // Depths

    // --- 2. Pentaprism (Top Viewfinder block) ---
    points.push({ x: -0.4, y: -0.7, z: -0.4 }); // 8
    points.push({ x: 0.4, y: -0.7, z: -0.4 });  // 9
    points.push({ x: 0.0, y: -1.0, z: -0.2 });  // 10 (Apex back)
    points.push({ x: -0.4, y: -0.7, z: 0.4 });  // 11
    points.push({ x: 0.4, y: -0.7, z: 0.4 });   // 12
    points.push({ x: 0.0, y: -1.0, z: 0.2 });   // 13 (Apex front)

    lines.push({ a: 8, b: 10 }, { a: 9, b: 10 }, { a: 11, b: 13 }, { a: 12, b: 13 });
    lines.push({ a: 10, b: 13 });
    lines.push({ a: 8, b: 11 }, { a: 9, b: 12 });

    // --- 3. Grip details (Right side bumps) ---
    points.push({ x: -1.4, y: -0.6, z: 0.4 }); // 14
    points.push({ x: -1.4, y: 0.6, z: 0.4 });  // 15
    points.push({ x: -1.4, y: -0.6, z: 0.1 }); // 16
    points.push({ x: -1.4, y: 0.6, z: 0.1 });  // 17
    lines.push({ a: 4, b: 14 }, { a: 7, b: 15 }, { a: 14, b: 15 });
    lines.push({ a: 14, b: 16 }, { a: 15, b: 17 }, { a: 16, b: 17 });

    // --- 4. Lens cylinder (Front) ---
    // Lens base circle (z = 0.5) and lens front circle (z = 1.3)
    const lensSegments = 12;
    const lensRadiusBase = 0.6;
    const lensRadiusTip = 0.55;
    const zBase = 0.5;
    const zMiddle = 0.9;
    const zTip = 1.3;

    const baseStartIdx = points.length;
    // Base ring (z = 0.5)
    for (let i = 0; i < lensSegments; i++) {
      const angle = (i / lensSegments) * Math.PI * 2;
      points.push({
        x: Math.cos(angle) * lensRadiusBase,
        y: Math.sin(angle) * lensRadiusBase + 0.05,
        z: zBase
      });
    }

    const midStartIdx = points.length;
    // Middle ring (z = 0.9)
    for (let i = 0; i < lensSegments; i++) {
      const angle = (i / lensSegments) * Math.PI * 2;
      points.push({
        x: Math.cos(angle) * lensRadiusBase,
        y: Math.sin(angle) * lensRadiusBase + 0.05,
        z: zMiddle
      });
    }

    const tipStartIdx = points.length;
    // Tip ring (z = 1.3)
    for (let i = 0; i < lensSegments; i++) {
      const angle = (i / lensSegments) * Math.PI * 2;
      points.push({
        x: Math.cos(angle) * lensRadiusTip,
        y: Math.sin(angle) * lensRadiusTip + 0.05,
        z: zTip
      });
    }

    // Connect ring circles & draw cylinder tubes
    for (let i = 0; i < lensSegments; i++) {
      const next = (i + 1) % lensSegments;
      // Connect rings
      lines.push({ a: baseStartIdx + i, b: baseStartIdx + next, color: 'cyan' });
      lines.push({ a: midStartIdx + i, b: midStartIdx + next, color: 'purple' });
      lines.push({ a: tipStartIdx + i, b: tipStartIdx + next, color: 'cyan' });

      // Connect rings depths
      lines.push({ a: baseStartIdx + i, b: midStartIdx + i });
      lines.push({ a: midStartIdx + i, b: tipStartIdx + i, color: 'cyan' });
    }

    // --- 5. Shutter button (Angle mount) ---
    points.push({ x: -1.0, y: -0.72, z: 0.3 }); // shutter base left
    points.push({ x: -0.8, y: -0.72, z: 0.3 }); // shutter base right
    points.push({ x: -0.9, y: -0.82, z: 0.3 }); // button tip
    lines.push({ a: 0, b: points.length - 3 });
    lines.push({ a: points.length - 3, b: points.length - 2 });
    lines.push({ a: points.length - 3, b: points.length - 1 });
    lines.push({ a: points.length - 2, b: points.length - 1 });

    // Floating particles (Digital dust)
    const particlesCount = 40;
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
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
        z: (Math.random() - 0.5) * 3,
        speed: 0.002 + Math.random() * 0.005,
        size: 1 + Math.random() * 2
      });
    }

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Map to values between -1 and 1
      mouseRef.current.targetX = (x / width) * 2 - 1;
      mouseRef.current.targetY = (y / height) * 2 - 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler (Width change only to prevent mobile scrollbars resize loop)
    let lastWidth = canvas.offsetWidth;
    const handleResize = () => {
      const currentWidth = canvas.offsetWidth;
      if (currentWidth !== lastWidth) {
        lastWidth = currentWidth;
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    // Auto-rotation variables
    let angleY = 0;
    let angleX = 0;

    // Projection constants
    const scale = Math.min(width, height) * 0.22;
    const fov = 3.5; // Field of view

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse tracking
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Base rotation (auto-rotate) plus mouse drag parallax
      angleY = Date.now() * 0.0004 + mouse.x * 0.8;
      angleX = Math.sin(Date.now() * 0.0002) * 0.15 - mouse.y * 0.6;

      // Rotate trig values
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Project and store vertices
      interface ProjectedPoint {
        x: number;
        y: number;
        z: number;
      }
      const projected: ProjectedPoint[] = [];

      points.forEach(p => {
        // Rotate Y axis
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;

        // Rotate X axis
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        // Perspective projection formula
        const perspective = fov / (fov + z2);
        projected.push({
          x: x1 * perspective * scale + width / 2,
          y: y2 * perspective * scale + height / 2,
          z: z2
        });
      });

      // Draw floating digital dust (background particles)
      particles.forEach(p => {
        // Slowly float upward/rotate
        p.y -= p.speed;
        if (p.y < -2) p.y = 2;

        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.x * sinY + p.z * cosY;
        let y2 = p.y * cosX - z1 * sinX;
        let z2 = p.y * sinX + z1 * cosX;

        const perspective = fov / (fov + z2);
        const px = x1 * perspective * scale + width / 2;
        const py = y2 * perspective * scale + height / 2;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.max(0.05, Math.min(0.6, (fov - z2) / (fov * 1.5)));
          ctx.beginPath();
          ctx.arc(px, py, p.size * perspective, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 210, 255, ${alpha})`;
          ctx.fill();
        }
      });

      // Draw camera lines
      lines.forEach(l => {
        const ptA = projected[l.a];
        const ptB = projected[l.b];

        // Draw with fading depth
        const avgZ = (ptA.z + ptB.z) / 2;
        const depthAlpha = Math.max(0.1, Math.min(0.95, (fov - avgZ) / (fov * 1.2)));

        ctx.beginPath();
        ctx.moveTo(ptA.x, ptA.y);
        ctx.lineTo(ptB.x, ptB.y);

        // Styling based on wire type
        if (l.color === 'cyan') {
          ctx.strokeStyle = `rgba(0, 210, 255, ${depthAlpha * 0.95})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(0, 210, 255, 0.4)';
          ctx.shadowBlur = 6;
        } else if (l.color === 'purple') {
          ctx.strokeStyle = `rgba(168, 85, 247, ${depthAlpha * 0.95})`;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
          ctx.shadowBlur = 6;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${depthAlpha * 0.45})`;
          ctx.lineWidth = 1.0;
          ctx.shadowBlur = 0;
        }

        ctx.stroke();
      });

      // Reset shadows
      ctx.shadowBlur = 0;

      // Draw Futuristic HUD Reticle Overlay
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
      ctx.lineWidth = 1;
      
      // Target Box
      const boxSize = scale * 1.4;
      const boxX = width / 2 - boxSize / 2;
      const boxY = height / 2 - boxSize / 2;
      
      // Corner brackets
      ctx.beginPath();
      // Top Left
      ctx.moveTo(boxX, boxY + 20); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + 20, boxY);
      // Top Right
      ctx.moveTo(boxX + boxSize - 20, boxY); ctx.lineTo(boxX + boxSize, boxY); ctx.lineTo(boxX + boxSize, boxY + 20);
      // Bottom Left
      ctx.moveTo(boxX, boxY + boxSize - 20); ctx.lineTo(boxX, boxY + boxSize); ctx.lineTo(boxX + 20, boxY + boxSize);
      // Bottom Right
      ctx.moveTo(boxX + boxSize - 20, boxY + boxSize); ctx.lineTo(boxX + boxSize, boxY + boxSize); ctx.lineTo(boxX + boxSize, boxY + boxSize - 20);
      ctx.stroke();

      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(width / 2 - 10, height / 2); ctx.lineTo(width / 2 + 10, height / 2);
      ctx.moveTo(width / 2, height / 2 - 10); ctx.lineTo(width / 2, height / 2 + 10);
      ctx.stroke();

      // Digital values overlay (cyberpunk DSLR stats)
      ctx.fillStyle = 'rgba(0, 210, 255, 0.4)';
      ctx.font = '10px monospace';
      ctx.fillText('REC 4K 60FPS', boxX + 10, boxY + 20);
      ctx.fillText('SHUTTER: 1/125s', boxX + 10, boxY + boxSize - 25);
      ctx.fillText('ISO: 400', boxX + 10, boxY + boxSize - 10);
      
      // Floating metrics tracking the lens tip
      const tipPoint = projected[tipStartIdx]; // Tip of lens
      if (tipPoint) {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.6)';
        ctx.fillText('LENS_FOCUS_TRACK', tipPoint.x + 12, tipPoint.y - 12);
        
        ctx.beginPath();
        ctx.arc(tipPoint.x, tipPoint.y, 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(tipPoint.x, tipPoint.y);
        ctx.lineTo(tipPoint.x + 10, tipPoint.y - 10);
        ctx.lineTo(tipPoint.x + 80, tipPoint.y - 10);
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.stroke();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="three-d-container">
      <canvas ref={canvasRef} className="three-d-canvas" />
    </div>
  );
}

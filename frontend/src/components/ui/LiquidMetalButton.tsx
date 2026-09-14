/**
 * Source: https://21st.dev/@johuniq/components/liquid-metal-button
 * Author: johuniq (MIT License)
 * Extended with responsive props, custom icons, and fallback handling for Apple Store cards.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export interface LiquidMetalButtonProps {
  label?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
}

export function LiquidMetalButton({
  label = 'Chọn mua',
  onClick,
  icon = <ArrowRight className="w-3.5 h-3.5" />,
  width = 124,
  height = 42,
  className = '',
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const dimensions = useMemo(() => {
    return {
      width,
      height,
      innerWidth: width - 4,
      innerHeight: height - 4,
      shaderWidth: width,
      shaderHeight: height,
    };
  }, [width, height]);

  useEffect(() => {
    const styleId = 'shader-canvas-style-liquid-metal';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .shader-container-liquid-metal canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: inherit !important;
        }
        @keyframes liquid-ripple {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    let isMounted = true;

    const loadShader = async () => {
      try {
        const { liquidMetalFragmentShader, ShaderMount } = await import('@paper-design/shaders');

        if (!isMounted || !shaderRef.current) return;

        if (shaderMount.current?.destroy) {
          shaderMount.current.destroy();
        }

        shaderMount.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.45,
            u_shiftRed: 0.25,
            u_shiftBlue: 0.35,
            u_distortion: 0.05,
            u_contour: 0.1,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          0.7
        );
      } catch (error) {
        console.warn('Liquid metal shader load fallback:', error);
      }
    };

    loadShader();

    return () => {
      isMounted = false;
      if (shaderMount.current?.destroy) {
        shaderMount.current.destroy();
        shaderMount.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    shaderMount.current?.setSpeed?.(1.4);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    shaderMount.current?.setSpeed?.(0.7);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.8);
      setTimeout(() => {
        if (isHovered) {
          shaderMount.current?.setSpeed?.(1.4);
        } else {
          shaderMount.current?.setSpeed?.(0.7);
        }
      }, 350);
    }

    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.(e);
  };

  return (
    <div className={`relative inline-block select-none ${className}`}>
      <div
        style={{
          perspective: '1000px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            transformStyle: 'preserve-3d',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: 'none',
          }}
        >
          {/* Top Content Layer (Text & Icon) */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transformStyle: 'preserve-3d',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: 'translateZ(20px)',
              zIndex: 30,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: '#ffffff',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                textShadow: '0px 1px 3px rgba(0, 0, 0, 0.8)',
                transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: 'scale(1)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
            {icon && (
              <span
                style={{
                  color: '#ffffff',
                  filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'transform 0.3s ease',
                  transform: isHovered ? 'translateX(2px)' : 'none',
                }}
              >
                {icon}
              </span>
            )}
          </div>

          {/* Middle Core Base Layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: 'preserve-3d',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: `translateZ(10px) ${
                isPressed ? 'translateY(1px) scale(0.97)' : 'translateY(0) scale(1)'
              }`,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: `${dimensions.innerWidth}px`,
                height: `${dimensions.innerHeight}px`,
                margin: '2px',
                borderRadius: '100px',
                background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
                boxShadow: isPressed
                  ? 'inset 0px 2px 4px rgba(0, 0, 0, 0.6), inset 0px 1px 2px rgba(0, 0, 0, 0.4)'
                  : 'inset 0px 1px 1px rgba(255, 255, 255, 0.15)',
                transition: 'all 0.3s ease',
              }}
            />
          </div>

          {/* Outer Liquid Metal Shader Ring & Surface */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              transformStyle: 'preserve-3d',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: `translateZ(0px) ${
                isPressed ? 'translateY(1px) scale(0.97)' : 'translateY(0) scale(1)'
              }`,
              zIndex: 10,
            }}
          >
            <div
              style={{
                height: `${dimensions.height}px`,
                width: `${dimensions.width}px`,
                borderRadius: '100px',
                boxShadow: isPressed
                  ? '0px 0px 0px 1px rgba(0, 0, 0, 0.6), 0px 1px 2px 0px rgba(0, 0, 0, 0.3)'
                  : isHovered
                  ? '0px 0px 0px 1px rgba(255, 255, 255, 0.25), 0px 8px 16px 0px rgba(0, 0, 0, 0.25), 0px 2px 6px 0px rgba(0, 0, 0, 0.15)'
                  : '0px 0px 0px 1px rgba(255, 255, 255, 0.12), 0px 4px 10px 0px rgba(0, 0, 0, 0.12), 0px 1px 3px 0px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 100%)',
              }}
            >
              <div
                ref={shaderRef}
                className="shader-container-liquid-metal"
                style={{
                  borderRadius: '100px',
                  overflow: 'hidden',
                  position: 'relative',
                  width: `${dimensions.shaderWidth}px`,
                  maxWidth: `${dimensions.shaderWidth}px`,
                  height: `${dimensions.shaderHeight}px`,
                }}
              />
            </div>
          </div>

          {/* Interactive Hit Button with Ripple Effect */}
          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              outline: 'none',
              zIndex: 40,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(25px)',
              overflow: 'hidden',
              borderRadius: '100px',
            }}
            aria-label={label}
          >
            {ripples.map((ripple) => (
              <span
                key={ripple.id}
                style={{
                  position: 'absolute',
                  left: `${ripple.x}px`,
                  top: `${ripple.y}px`,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)',
                  pointerEvents: 'none',
                  animation: 'liquid-ripple 0.6s ease-out',
                }}
              />
            ))}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiquidMetalButton;

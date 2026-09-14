"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import { MapPin } from "lucide-react"

// Create a simple dot icon for the mini map
const miniMarkerIcon = L.divIcon({
  className: 'mini-leaflet-marker',
  html: `<div class="w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
})

function MiniMapUpdater({ coord }: { coord: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coord, 15);
  }, [coord, map]);
  return null;
}

interface LocationMapProps {
  location?: string
  address?: string
  coord?: [number, number]
  className?: string
  autoExpand?: boolean
}

export function LocationMap({
  location = "Customer",
  address = "Address",
  coord = [10.7769, 106.7009],
  className,
  autoExpand = false
}: LocationMapProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isExpanded, setIsExpanded] = useState(autoExpand)
  const [showMap, setShowMap] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsExpanded(autoExpand);
    // Delay rendering the actual map slightly for the expansion animation to finish
    if (autoExpand) {
      const timer = setTimeout(() => setShowMap(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowMap(false);
    }
  }, [autoExpand]);

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useTransform(mouseY, [-50, 50], [8, -8])
  const rotateY = useTransform(mouseX, [-50, 50], [-8, 8])

  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 })
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      ref={containerRef}
      className={`relative cursor-default select-none ${className}`}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-black/40 border border-white/10 map-container-custom"
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          width: "100%",
          height: isExpanded ? 240 : 100,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 z-10 pointer-events-none" />

        <AnimatePresence>
          {isExpanded && showMap && (
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* REAL MAP */}
              <MapContainer 
                center={coord} 
                zoom={15} 
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                className="w-full h-full bg-transparent"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MiniMapUpdater coord={coord} />
                <Marker position={coord} icon={miniMarkerIcon} />
              </MapContainer>

              {/* Sci-Fi Scanning Overlay */}
              <motion.div 
                className="absolute left-0 right-0 h-1 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-20 pointer-events-none"
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Info Overlaid on Map */}
        <div className="relative z-30 h-full flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex items-start justify-between">
            <motion.div 
              className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10"
              animate={{ filter: isHovered ? "drop-shadow(0 0 8px rgba(52, 211, 153, 0.6))" : "drop-shadow(0 0 0px rgba(0,0,0,0))" }} 
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
            </motion.div>
            
            <motion.div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10" animate={{ scale: isHovered ? 1.05 : 1 }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">Location Data</span>
            </motion.div>
          </div>

          <div className="space-y-1 bg-black/40 backdrop-blur-md p-2 rounded-xl border border-white/10 inline-block w-max max-w-full">
            <motion.h3 className="text-white font-medium text-sm tracking-tight" animate={{ x: isHovered ? 4 : 0 }}>
              {location}
            </motion.h3>
            <AnimatePresence>
              {isExpanded && (
                <motion.p className="text-emerald-400/80 text-xs font-mono truncate" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  {address}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}

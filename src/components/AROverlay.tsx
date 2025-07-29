import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Location, POIMarker } from '../types';
import { mapService } from '../services/mapService';

// Utility: Distance in meters between two points
function haversineDistance(loc1: Location, loc2: Location) {
  const R = 6371000; // meters
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  const lat1 = toRad(loc1.latitude);
  const lat2 = toRad(loc2.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface AROverlayProps {
  currentLocation: Location;
  destination: Location;
  currentHeading: number;
  markers: POIMarker[]; // Array of POIs to check proximity
  proximityRadius?: number; // meters, default 25
  className?: string;
}

const DetailCard: React.FC<{ marker: POIMarker; onClose: () => void }> = ({ marker, onClose }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 rounded-t-xl shadow-2xl p-6 max-w-lg mx-auto">
    <div className="flex justify-between items-center mb-3">
      <h2 className="font-bold text-lg">{marker.name}</h2>
      <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
    </div>
    {marker.imageUrl && (
      <img src={marker.imageUrl} alt={marker.name} className="rounded-lg mb-2 max-h-36 object-cover w-full" />
    )}
    {marker.type && (
      <span className="inline-block px-3 py-1 mb-2 rounded-full bg-blue-100 text-blue-800 text-xs">{marker.type}</span>
    )}
    <p className="text-gray-600 text-sm">{marker.address}</p>
    <p className="mt-2">{marker.description}</p>
  </div>
);

export const AROverlay: React.FC<AROverlayProps> = ({
  currentLocation,
  destination,
  currentHeading,
  markers,
  proximityRadius = 25,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const arrowRef = useRef<THREE.Group | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeMarker, setActiveMarker] = useState<POIMarker | null>(null);

  // --- Three.js Initialization ---
  useEffect(() => {
    if (!mountRef.current || isInitialized) return;
    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true, premultipliedAlpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio ?? 1);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.pointerEvents = 'none';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Build the 3D arrow
    const arrowGroup = new THREE.Group();
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.9 }),
    );
    shaft.position.y = 0.4; arrowGroup.add(shaft);
    const head = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.3, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.95 }),
    );
    head.position.y = 0.95; arrowGroup.add(head);
    const glow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 }),
    );
    glow.position.y = 0.5; arrowGroup.add(glow);
    arrowGroup.position.set(0, 0, -2);
    arrowGroup.rotation.x = Math.PI / 2;
    scene.add(arrowGroup);
    arrowRef.current = arrowGroup;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (arrowRef.current) {
        const t = Date.now() * 0.001;
        arrowRef.current.position.y = Math.sin(t * 2) * 0.10;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Resize handling
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const newWidth = mountRef.current.clientWidth, newHeight = mountRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);
    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
    // eslint-disable-next-line
  }, [isInitialized]);

  // --- Arrow Direction Update ---
  useEffect(() => {
    if (!arrowRef.current || !currentLocation || !destination) return;
    const bearing = mapService.calculateBearing(currentLocation, destination);
    const adjustedBearing = (bearing - currentHeading + 360) % 360;
    const rotationY = (adjustedBearing * Math.PI) / 180;
    arrowRef.current.rotation.copy(new THREE.Euler(Math.PI / 2, rotationY, 0));
  }, [currentLocation, destination, currentHeading]);

  // --- POI Entry Detection ---
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    const found = markers.find(marker =>
      haversineDistance(currentLocation, marker) < proximityRadius
    );
    setActiveMarker(found ?? null);
  }, [currentLocation, markers, proximityRadius]);

  // --- 2D Arrow SVG Overlay (static, for clarity) ---
  const Arrow2D = () => (
    <svg
      width={80}
      height={80}
      viewBox="0 0 80 80"
      className="absolute left-1/2 top-2/3 z-50 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      style={{ filter: 'drop-shadow(0 2px 8px #3B82F6aa)' }}
    >
      <polygon
        points="40,10 65,60 40,45 15,60"
        fill="#3B82F6"
        stroke="#fff"
        strokeWidth={3}
        opacity={0.95}
      />
    </svg>
  );

  return (
    <div
      ref={mountRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 10 }}
    >
      {/* Static 2D Arrow Mark Overlay */}
      <Arrow2D />
      {/* Detail Card Overlay */}
      {activeMarker && (
        <DetailCard marker={activeMarker} onClose={() => setActiveMarker(null)} />
      )}
    </div>
  );
};

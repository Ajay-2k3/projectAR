import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Location } from '../types';
import { mapService } from '../services/mapService';

interface AROverlayProps {
  currentLocation: Location;
  destination: Location;
  currentHeading: number;
  className?: string;
}

/**
 * AR overlay component that renders a 3D arrow pointing towards the destination
 * Uses Three.js for 3D rendering and real-time orientation updates
 */
export const AROverlay: React.FC<AROverlayProps> = ({
  currentLocation,
  destination,
  currentHeading,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const arrowRef = useRef<THREE.Group | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || isInitialized) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      premultipliedAlpha: false 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.domElement.style.pointerEvents = 'none';
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create 3D arrow
    const createArrow = () => {
      const arrowGroup = new THREE.Group();

      // Arrow shaft (cylinder)
      const shaftGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
      const shaftMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9
      });
      const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
      shaft.position.y = 0.4;
      arrowGroup.add(shaft);

      // Arrow head (cone)
      const headGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
      const headMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.9
      });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.y = 0.95;
      arrowGroup.add(head);

      // Glowing effect
      const glowGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = 0.5;
      arrowGroup.add(glow);

      // Position arrow in front of camera
      arrowGroup.position.set(0, 0, -2);
      arrowGroup.rotation.x = Math.PI / 2; // Point forward initially

      return arrowGroup;
    };

    const arrow = createArrow();
    scene.add(arrow);
    arrowRef.current = arrow;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Add subtle floating animation
      if (arrowRef.current) {
        const time = Date.now() * 0.001;
        arrowRef.current.position.y = Math.sin(time * 2) * 0.1;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mount || !camera || !renderer) return;
      
      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [isInitialized]);

  // Update arrow direction based on destination and heading
  useEffect(() => {
    if (!arrowRef.current || !currentLocation || !destination) return;

    // Calculate bearing to destination
    const bearing = mapService.calculateBearing(currentLocation, destination);
    
    // Adjust for device heading
    const adjustedBearing = (bearing - currentHeading + 360) % 360;
    
    // Convert to radians and apply rotation
    const rotationY = (adjustedBearing * Math.PI) / 180;
    
    // Smooth rotation animation
    const targetRotation = new THREE.Euler(Math.PI / 2, rotationY, 0);
    
    // Apply rotation
    arrowRef.current.rotation.copy(targetRotation);
    
  }, [currentLocation, destination, currentHeading]);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 10 }}
    />
  );
};
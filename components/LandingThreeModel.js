import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function LandingThreeModel() {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene, camera, renderer
    const scene = new THREE.Scene();
    scene.background = null; // Set to null for transparent background
    
    const camera = new THREE.PerspectiveCamera(
      65, // Wider field of view
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Setting camera position to match the zoomed-in view
    camera.position.z = 8; // Increased distance to view wider layout
    camera.position.y = 0.5; // Slight elevation for better view
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);
    
    const dirLight2 = new THREE.DirectionalLight(0x0088ff, 1);
    dirLight2.position.set(-5, -5, -5);
    scene.add(dirLight2);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Disable zooming to keep fixed size
    controls.enableZoom = false;
    // Limit rotation slightly
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 1.5;
    
    // Create the outer TEE Cubes (3 cubes)
    const cubeGeometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    
    // Materials for the TEE cubes - white & blue theme
    const cubeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    
    // Blue edges for cubes
    const createCubeWithEdges = (position) => {
      // Create main cube
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.copy(position);
      scene.add(cube);
      
      // Create edges
      const edgesGeometry = new THREE.EdgesGeometry(cubeGeometry);
      const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0x0088ff, 
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
      cube.add(edges);
      
      // Add glow effect
      const glowMaterial = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: new THREE.Color(0x0088ff) },
          intensity: { value: 0.3 }
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vNormal;
          uniform vec3 glowColor;
          uniform float intensity;
          void main() {
            float intensity = pow(0.8 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
            gl_FragColor = vec4(glowColor, intensity * 0.5);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
      
      const glowCube = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.4, 2.4),
        glowMaterial
      );
      cube.add(glowCube);
      
      return cube;
    };
    
    // Create the three TEE cubes with increased spacing
    const cube1 = createCubeWithEdges(new THREE.Vector3(-6, 0, 0));
    const cube2 = createCubeWithEdges(new THREE.Vector3(0, 0, 0));
    const cube3 = createCubeWithEdges(new THREE.Vector3(6, 0, 0));
    
    // Create the inner AI shard models
    const headGeometry = new THREE.SphereGeometry(0.6, 24, 24);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0066ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const headShard = new THREE.Mesh(headGeometry, headMaterial);
    cube1.add(headShard);
    
    // Add glowing particles around the head
    const headParticles = new THREE.Group();
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const particleGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({ 
        color: 0x00aaff, 
        transparent: true, 
        opacity: 0.7 
      });
      const particle = new THREE.Mesh(particleGeo, particleMat);
      
      const radius = 0.8;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.y = Math.sin(angle) * radius;
      
      // Store initial position and angle for animation
      particle.userData = { 
        angle: angle,
        radius: radius,
        speed: 0.01 + Math.random() * 0.01,
        verticalSpeed: 0.005 + Math.random() * 0.005,
        verticalOffset: Math.random() * Math.PI * 2
      };
      
      headParticles.add(particle);
    }
    cube1.add(headParticles);
    
    // Create body shard (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 1, 24);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0066ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const bodyShard = new THREE.Mesh(bodyGeometry, bodyMaterial);
    cube2.add(bodyShard);
    
    // Add circuit pattern to body
    const bodyCircuit = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const circuitGeo = new THREE.BoxGeometry(0.3, 0.03, 0.03);
      const circuitMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const circuit = new THREE.Mesh(circuitGeo, circuitMat);
      circuit.position.y = -0.4 + i * 0.2;
      circuit.position.z = 0.3;
      bodyCircuit.add(circuit);
    }
    cube2.add(bodyCircuit);
    
    // Create legs shard
    const legsGroup = new THREE.Group();
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 16);
    const legMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0066ff,
      emissive: 0x0044aa,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, -0.2, 0);
    legsGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, -0.2, 0);
    legsGroup.add(rightLeg);
    
    cube3.add(legsGroup);
    
    // Create DNA-like helix connections between cubes with mixed particle shapes and fade effects
    const createDNAHelix = (start, end) => {
      const particleGroup = new THREE.Group();
      const particleCount = 150; // More particles for denser flow
      
      // Shared geometries for particles
      const sphereGeometry = new THREE.SphereGeometry(0.06, 8, 8);
      const boxGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
      
      // Create particles floating between the cubes
      for (let i = 0; i < particleCount; i++) {
        // Randomly choose between sphere and cube
        const isBox = Math.random() > 0.5;
        const particleGeo = isBox ? boxGeometry : sphereGeometry;
        
        // Color gradient from blue to white
        const blueAmount = 0.5 + Math.random() * 0.5;
        const particleColor = new THREE.Color(blueAmount, blueAmount, 1.0);
        
        const particleMat = new THREE.MeshPhongMaterial({ 
          color: particleColor,
          emissive: particleColor.clone().multiplyScalar(0.2),
          transparent: true,
          opacity: 0.8,
          shininess: 90
        });
        
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        // Randomize initial position between start and end
        const progress = Math.random(); // Random position along the path
        const xPos = start.x + (end.x - start.x) * progress;
        
        // Add some randomness to vertical and depth positions
        const yPos = (Math.random() - 0.5) * 0.8;
        const zPos = (Math.random() - 0.5) * 0.8;
        
        particle.position.set(xPos, yPos, zPos);
        
        // Store particle properties for animation
        particle.userData = {
          // Initial and range values for position
          startX: start.x,
          endX: end.x,
          centerY: yPos,
          centerZ: zPos,
          
          // Movement parameters
          speed: (0.2 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1), // Random speed and direction
          verticalAmplitude: 0.1 + Math.random() * 0.2,
          verticalFrequency: 0.5 + Math.random() * 1.0,
          depthAmplitude: 0.1 + Math.random() * 0.2,
          depthFrequency: 0.5 + Math.random() * 1.0,
          
          // Phase offsets for varied movement
          phaseOffset: Math.random() * Math.PI * 2,
          verticalPhase: Math.random() * Math.PI * 2,
          
          // Visual effects
          pulseSpeed: 0.05 + Math.random() * 0.05,
          pulseOffset: Math.random() * Math.PI * 2,
          
          // Shape swapping
          isBox: isBox,
          refreshTimer: Math.random() * 5,
          
          // Fading effect
          fadeSpeed: 0.2 + Math.random() * 0.3,
          fadeOffset: Math.random() * Math.PI * 2,
          minOpacity: 0.2,
          maxOpacity: 0.9
        };
        
        particleGroup.add(particle);
      }
      
      scene.add(particleGroup);
      return particleGroup;
    };
    
    // Create particle flows between the cubes with updated positions
    const particleFlow1 = createDNAHelix(
      new THREE.Vector3(-5, 0, 0),  // From cube1
      new THREE.Vector3(-1, 0, 0)   // To cube2
    );
    
    const particleFlow2 = createDNAHelix(
      new THREE.Vector3(1, 0, 0),   // From cube2
      new THREE.Vector3(5, 0, 0)    // To cube3
    );
    
    // Geometries for particle shape swapping
    const sphereGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const boxGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    
    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();
      
      // Rotate the cubes slightly
      cube1.rotation.y += 0.003;
      cube1.rotation.x += 0.001;
      
      cube2.rotation.y += 0.004;
      cube2.rotation.x += 0.002;
      
      cube3.rotation.y += 0.002;
      cube3.rotation.x += 0.001;
      
      // Animate head particles
      if (headParticles) {
        headParticles.children.forEach(particle => {
          const userData = particle.userData;
          userData.angle += userData.speed;
          particle.position.x = Math.cos(userData.angle) * userData.radius;
          particle.position.y = Math.sin(userData.angle) * userData.radius;
          
          // Add vertical oscillation
          particle.position.y += Math.sin(elapsedTime * userData.verticalSpeed * 10 + userData.verticalOffset) * 0.05;
        });
      }
      
      // Animate free-flowing particles
      [particleFlow1, particleFlow2].forEach(flow => {
        flow.children.forEach(particle => {
          const data = particle.userData;
          
          // Update refresh timer for potential shape swapping
          data.refreshTimer -= delta;
          
          // Chance to swap geometry shape (square to sphere or vice versa)
          if (data.refreshTimer <= 0) {
            // Reset timer
            data.refreshTimer = 3 + Math.random() * 5;
            
            // Small chance to swap geometry
            if (Math.random() < 0.1) {
              // Swap geometry while preserving all other properties
              particle.geometry = data.isBox ? sphereGeometry : boxGeometry;
              data.isBox = !data.isBox;
            }
          }
          
          // Main horizontal movement (back and forth)
          particle.position.x += data.speed * delta;
          
          // If particle reaches either end, reverse direction
          if (particle.position.x <= data.startX || particle.position.x >= data.endX) {
            data.speed = -data.speed; // Reverse direction
            
            // Add small random variation to speed when changing direction
            const speedAdjust = 0.9 + Math.random() * 0.2;
            data.speed *= speedAdjust;
          }
          
          // Vertical movement (up and down)
          particle.position.y = data.centerY + 
            Math.sin(elapsedTime * data.verticalFrequency + data.verticalPhase) * data.verticalAmplitude;
          
          // Depth movement (forward and back)
          particle.position.z = data.centerZ + 
            Math.cos(elapsedTime * data.depthFrequency + data.phaseOffset) * data.depthAmplitude;
            
          // Subtle pulsing effect
          const pulse = Math.sin(elapsedTime * data.pulseSpeed + data.pulseOffset) * 0.2 + 0.8;
          particle.scale.set(pulse, pulse, pulse);
          
          // Apply fade effect
          const fadeValue = (Math.sin(elapsedTime * data.fadeSpeed + data.fadeOffset) + 1) / 2;
          const opacity = data.minOpacity + fadeValue * (data.maxOpacity - data.minOpacity);
          particle.material.opacity = opacity;
          
          // Add rotation to particles
          if (data.isBox) {
            particle.rotation.x += 0.01;
            particle.rotation.y += 0.01;
            particle.rotation.z += 0.01;
          }
        });
      });
      
      // Update controls
      controls.update();
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose geometries and materials
      cubeGeometry.dispose();
      cubeMaterial.dispose();
      headGeometry.dispose();
      headMaterial.dispose();
      bodyGeometry.dispose();
      bodyMaterial.dispose();
      legGeometry.dispose();
      legMaterial.dispose();
      sphereGeometry.dispose();
      boxGeometry.dispose();
    };
  }, []);
  
  return (
    <div 
      ref={mountRef} 
      className="w-full h-screen"
      style={{ background: 'transparent' }}
    />
  );
} 
import { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber'; // Added extend
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Shaders
const vertexShader = `
  uniform float size;
  uniform sampler2D elevTexture;
  uniform vec2 mouseUV;

  varying vec2 vUv;
  varying float vVisible;
  varying float vDist;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    float elv = texture2D(elevTexture, vUv).r;
    vec3 vNormal = normalMatrix * normal;
    vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
    mvPosition.z += 0.35 * elv;

    float dist = distance(mouseUV, vUv);
    float zDisp = 0.0;
    float thresh = 0.04;
    if (dist < thresh) {
      zDisp = (thresh - dist) * 10.0;
    }
    vDist = dist;
    mvPosition.z += zDisp;

    gl_PointSize = size;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform sampler2D colorTexture;
  uniform sampler2D alphaTexture;
  uniform sampler2D otherTexture;

  varying vec2 vUv;
  varying float vVisible;
  varying float vDist;

  void main() {
    if (floor(vVisible + 0.1) == 0.0) discard;
    float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
    vec3 color = texture2D(colorTexture, vUv).rgb;
    vec3 other = texture2D(otherTexture, vUv).rgb;
    float thresh = 0.04;
    if (vDist < thresh) {
      color = mix(color, other, (thresh - vDist) * 50.0);
    }
    gl_FragColor = vec4(color, alpha);
  }
`;

function Starfield({ numStars = 2000 }) {
    const starSprite = useTexture('/textures/circle.png');

    // Generate star positions
    const { positions, colors } = useMemo(() => {
        const positions = [];
        const colors = [];
        const color = new THREE.Color();

        for (let i = 0; i < numStars; i++) {
            const radius = Math.random() * 25 + 25;
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);

            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );

            const hue = 0.6; // Blue/Purple tint
            color.setHSL(hue, 0.2, Math.random());
            colors.push(color.r, color.g, color.b);
        }

        return {
            positions: new Float32Array(positions),
            colors: new Float32Array(colors)
        };
    }, [numStars]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={positions.length / 3}
                    array={positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-color"
                    count={colors.length / 3}
                    array={colors}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.2}
                vertexColors
                map={starSprite}
                transparent
                depthWrite={false}
            />
        </points>
    );
}

function EarthGroup() {
    const groupRef = useRef<THREE.Group>(null!);
    const meshRef = useRef<THREE.Mesh>(null!);
    const pointsRef = useRef<THREE.Points>(null!);

    // Load textures
    const [colorMap, elevMap, alphaMap, otherMap] = useTexture([
        '/textures/00_earthmap1k.jpg',
        '/textures/01_earthbump1k.jpg',
        '/textures/02_earthspec1k.jpg',
        '/textures/04_rainbow1k.jpg'
    ]);

    // Uniforms ref for the shader
    const uniforms = useMemo(() => ({
        size: { value: 4.0 },
        colorTexture: { value: colorMap },
        elevTexture: { value: elevMap },
        alphaTexture: { value: alphaMap },
        otherTexture: { value: otherMap },
        mouseUV: { value: new THREE.Vector2(0, 0) }
    }), [colorMap, elevMap, alphaMap, otherMap]);

    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.002;
        }
    });

    const handlePointerMove = (e: any) => {
        // Update mouseUV uniform when hovering over the invisible wireframe mesh
        if (e.uv) {
            uniforms.mouseUV.value.copy(e.uv);
        }
    };

    return (
        <group ref={groupRef} rotation={[0, 0, Math.PI / 6]}>
            {/* Earth Mesh Group (same as before) */}
            <mesh
                ref={meshRef}
                onPointerMove={handlePointerMove}
            >
                <icosahedronGeometry args={[1, 16]} />
                <meshBasicMaterial
                    color="#0099ff"
                    wireframe
                    transparent
                    opacity={0.1} // Visible wireframe
                />
            </mesh>

            {/* Shader Points Mesh */}
            <points ref={pointsRef}>
                <icosahedronGeometry args={[1, 128]} />
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent
                />
            </points>
        </group>
    );
}

export default function VertexEarth() {
    return (
        <div className="absolute inset-0 z-0 bg-black">
            <Canvas camera={{ position: [0, 0, 4] }} dpr={[1, 2]}> {/* Increased distance to 4 matching original */}
                <ambientLight intensity={0.5} />
                <Starfield />
                <EarthGroup />
                <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} />
            </Canvas>
            {/* Post-processing overlay for better UI contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 pointer-events-none" />
        </div>
    );
}

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Fresnel Shader Material (Ported from getFresnelMat.js)
const fresnelVertexShader = `
  uniform float fresnelBias;
  uniform float fresnelScale;
  uniform float fresnelPower;
  
  varying float vReflectionFactor;
  
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  
    vec3 worldNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
  
    vec3 I = worldPosition.xyz - cameraPosition;
  
    vReflectionFactor = fresnelBias + fresnelScale * pow( 1.0 + dot( normalize( I ), worldNormal ), fresnelPower );
  
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fresnelFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  
  varying float vReflectionFactor;
  
  void main() {
    float f = clamp( vReflectionFactor, 0.0, 1.0 );
    gl_FragColor = vec4(mix(color2, color1, vec3(f)), f);
  }
`;

function Starfield({ numStars = 2000 }) {
    const starSprite = useTexture('/textures/circle.png');
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
            color.setHSL(0.6, 0.2, Math.random());
            colors.push(color.r, color.g, color.b);
        }
        return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
    }, [numStars]);

    return (
        <points>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.2} vertexColors map={starSprite} transparent depthWrite={false} />
        </points>
    );
}

function EarthGroup() {
    const earthRef = useRef<THREE.Group>(null!);
    const cloudsRef = useRef<THREE.Mesh>(null!);
    const lightsRef = useRef<THREE.Mesh>(null!);

    const [
        colorMap,
        specMap,
        bumpMap,
        lightsMap,
        cloudMap,
        cloudAlphaMap,
        moonColorMap,
        moonBumpMap
    ] = useTexture([
        '/textures/00_earthmap1k.jpg',
        '/textures/02_earthspec1k.jpg',
        '/textures/01_earthbump1k.jpg',
        '/textures/03_earthlights1k.jpg',
        '/textures/04_earthcloudmap.jpg',
        '/textures/05_earthcloudmaptrans.jpg',
        '/textures/06_moonmap4k.jpg',
        '/textures/07_moonbump4k.jpg'
    ]);

    const fresnelUniforms = useMemo(() => ({
        color1: { value: new THREE.Color(0x0088ff) }, // Rim
        color2: { value: new THREE.Color(0x000000) }, // Facing
        fresnelBias: { value: 0.1 },
        fresnelScale: { value: 1.0 },
        fresnelPower: { value: 4.0 },
    }), []);

    useFrame((state, delta) => {
        const scrollY = window.scrollY;

        // Interactive Scroll Rotation: Spin faster as user scrolls down
        const rotationSpeed = 0.0005 + (scrollY * 0.000005);
        const cloudSpeed = 0.0007 + (scrollY * 0.000005);

        if (earthRef.current) {
            earthRef.current.rotation.y += rotationSpeed;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += cloudSpeed;
        }
        if (lightsRef.current) {
            lightsRef.current.rotation.y += rotationSpeed;
        }
    });

    return (
        <group position={[0, -1.8, 0]} rotation={[0.2, 0, 0]}> {/* Move Earth down and tilt slightly */}
            {/* Main Earth Group */}
            <group ref={earthRef} scale={[2.5, 2.5, 2.5]}> {/* Make Earth Larger */}
                {/* 1. Base Earth */}
                <mesh>
                    <icosahedronGeometry args={[1, 64]} /> {/* Increased segments for smoothness at large scale */}
                    <meshPhongMaterial
                        map={colorMap}
                        specularMap={specMap}
                        bumpMap={bumpMap}
                        bumpScale={0.04}
                    />
                </mesh>

                {/* 2. City Lights (Night side) */}
                <mesh ref={lightsRef}>
                    <icosahedronGeometry args={[1, 64]} />
                    <meshBasicMaterial
                        map={lightsMap}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>

                {/* 3. Clouds */}
                <mesh ref={cloudsRef} scale={[1.003, 1.003, 1.003]}>
                    <icosahedronGeometry args={[1, 64]} />
                    <meshStandardMaterial
                        map={cloudMap}
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                        alphaMap={cloudAlphaMap}
                    />
                </mesh>

                {/* 4. Atmosphere Glow (Fresnel) */}
                <mesh scale={[1.02, 1.02, 1.02]}>
                    <icosahedronGeometry args={[1, 64]} />
                    <shaderMaterial
                        uniforms={fresnelUniforms}
                        vertexShader={fresnelVertexShader}
                        fragmentShader={fresnelFragmentShader}
                        transparent
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            </group>

            {/* 5. Moon Orbit - Adjusted Scale and Distance relative to the larger Earth */}
            {/* Since Earth is scale 2.5, Moon needs to be further out to not clip or look tiny */}
            <Moon colorMap={moonColorMap} bumpMap={moonBumpMap} />
        </group>
    );
}

function Moon({ colorMap, bumpMap }: { colorMap: THREE.Texture, bumpMap: THREE.Texture }) {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.02; // Much slower orbit (was 0.1)
        }
    });

    return (
        <group ref={groupRef} rotation={[0.4, 0, 0]}> {/* Tilted orbit plane */}
            {/* Moon position pushed out. Earth radius is effectively 2.5. Orbit at ~4/5? */}
            <mesh position={[4.5, 1, 0]} scale={[0.5, 0.5, 0.5]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial map={colorMap} bumpMap={bumpMap} bumpScale={0.05} />
            </mesh>
        </group>
    );
}

export default function RealisticEarth() {
    return (
        <div className="absolute inset-0 z-0 bg-transparent">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.LinearSRGBColorSpace, alpha: true }}>
                <ambientLight intensity={0.1} />
                <directionalLight position={[-3, 2, 2]} intensity={3} />
                <Starfield />
                <EarthGroup />
                {/* Removed OrbitControls to lock the "Hero Perspective" */}
            </Canvas>
            {/* Overlays removed to allow layering behind Earth */}
        </div>
    );
}

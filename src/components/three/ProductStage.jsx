import { useCallback, useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, RoundedBox, ContactShadows } from "@react-three/drei"
import * as THREE from "three"

const ORANGE = "#ff6d00"
const PAD = 0.28

function MouseParallax({ children }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const { x, y } = state.pointer
    ref.current.rotation.y = x * 0.25
    ref.current.rotation.x = -y * 0.15
  })
  return <group ref={ref}>{children}</group>
}

function ProductCard({ url, onError }) {
  const [texture, setTexture] = useState(null)
  const groupRef = useRef()

  useEffect(() => {
    let cancelled = false
    let loaded = null
    const loader = new THREE.TextureLoader()
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        loaded = tex
        setTexture(tex)
      },
      undefined,
      () => {
        if (!cancelled) onError?.()
      }
    )
    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [url, onError])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = Math.sin(t * 0.45) * 0.28
    groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.1
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.12
  })

  if (!texture) return null

  const img = texture.image
  const aspect = img && img.width && img.height ? img.height / img.width : 1
  const w = 4.4
  const h = w * aspect
  const cardW = w + PAD * 2
  const cardH = h + PAD * 2

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.7}>
      <group ref={groupRef}>
        <RoundedBox args={[cardW + 0.1, cardH + 0.1, 0.1]} radius={0.2} smoothness={4} position={[0, 0, -0.06]}>
          <meshStandardMaterial color={ORANGE} metalness={0.55} roughness={0.3} />
        </RoundedBox>
        <RoundedBox args={[cardW, cardH, 0.12]} radius={0.18} smoothness={4}>
          <meshStandardMaterial color="#ffffff" metalness={0.12} roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0, 0.07]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  )
}

export default function ProductStage({ image }) {
  const [texFailed, setTexFailed] = useState(false)
  const handleError = useCallback(() => setTexFailed(true), [])

  if (!image || texFailed) return null

  return (
    <div className="pd-stage" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 5]} intensity={1.4} color="#fff8ee" />
        <directionalLight position={[-5, -2, -3]} intensity={0.45} color="#ffb066" />
        <MouseParallax>
          <ProductCard url={image} onError={handleError} />
        </MouseParallax>
        <ContactShadows
          position={[0, -2.4, 0]}
          opacity={0.35}
          scale={9}
          blur={2.6}
          far={4}
          color="#1a1a2e"
        />
      </Canvas>
    </div>
  )
}

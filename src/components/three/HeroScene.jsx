import { useEffect, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import * as THREE from "three"
import shoesUrl from "../../images/shoes.png"

const SHOES_W = 5.4
const SHOES_H = SHOES_W * (408 / 612)

function MouseParallax({ children }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const { x, y } = state.pointer
    ref.current.rotation.y = x * 0.3
    ref.current.rotation.x = -y * 0.18
    ref.current.position.x = x * 0.25
    ref.current.position.y = y * 0.18
  })
  return <group ref={ref}>{children}</group>
}

function ShoesImage() {
  const groupRef = useRef()
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    let cancelled = false
    let loaded = null
    const loader = new THREE.TextureLoader()
    loader.load(shoesUrl, (tex) => {
      if (cancelled) {
        tex.dispose()
        return
      }
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      loaded = tex
      setTexture(tex)
    })
    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.y = Math.sin(t * 0.45) * 0.28
    groupRef.current.rotation.x = Math.sin(t * 0.35) * 0.1
    groupRef.current.position.y = Math.sin(t * 0.8) * 0.12
  })

  return (
    <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.7}>
      <group ref={groupRef}>
        {texture && (
          <mesh>
            <planeGeometry args={[SHOES_W, SHOES_H]} />
            <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </Float>
  )
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 6, 4]} intensity={1.3} color="#fff5e6" />
      <directionalLight position={[-6, -2, -4]} intensity={0.55} color="#ff8a3d" />
    </>
  )
}

export default function HeroScene() {
  return (
    <div className="hero-scene" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Lights />
        <MouseParallax>
          <ShoesImage />
        </MouseParallax>
      </Canvas>
    </div>
  )
}

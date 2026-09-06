'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { StockPulseVectorLogo } from './stockpulse-vector-logo'

interface StockPulse3DLogoProps {
  className?: string
  interactive?: boolean
  showTelemetryHUD?: boolean
}

/**
 * StockPulse Interactive 3D Isometric Warehouse Cube
 *
 * Requirements:
 * - A sharp, geometric 3D inventory warehouse box/cube viewed isometrically from an angle.
 * - The front facet of the cube is cut with a sharp, glowing pulse/heartbeat line that
 *   seamlessly traces along its edge, symbolizing live real-time stock monitoring and concurrency locks.
 * - Primary: Warm Amber / Burnt Copper (#F59E0B / #D97706)
 * - Secondary: Deep Walnut & Dark Charcoal (#1F1A17 / #2B2118)
 * - Accent: Crisp Gold (#FBBF24)
 */
export function StockPulse3DLogo({
  className = '',
  interactive = true,
  showTelemetryHUD = true,
}: StockPulse3DLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [activeLock, setActiveLock] = useState<'IDLE' | 'ACQUIRING' | 'LOCKED'>('LOCKED')
  const [pingsCount, setPingsCount] = useState(1482)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 1. WebGL Support Test
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch (e) {
      console.warn('WebGL not supported, falling back to vector mark:', e)
      setWebGLSupported(false)
      return
    }

    const width = container.clientWidth || 420
    const height = container.clientHeight || 420
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)

    // 2. Scene & Isometric Camera Setup
    const scene = new THREE.Scene()

    // Isometric Orthographic Camera for perfect architectural angles
    const aspect = width / height
    const frustumSize = 7.5
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    )

    // Classical Isometric position: (x=10, y=10, z=10) looking at origin
    camera.position.set(10, 10, 10)
    camera.lookAt(0, 0, 0)

    // Master Group for hover & oscillation
    const rootGroup = new THREE.Group()
    scene.add(rootGroup)

    // 3. Precision Materials (Deep Walnut, Dark Charcoal, Warm Amber, Crisp Gold)
    const walnutTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x33261e,
      roughness: 0.35,
      metalness: 0.4,
    })

    const charcoalLeftMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f1a17,
      roughness: 0.5,
      metalness: 0.5,
    })

    const charcoalRightMaterial = new THREE.MeshStandardMaterial({
      color: 0x241d18,
      roughness: 0.45,
      metalness: 0.55,
    })

    const innerCoreMaterial = new THREE.MeshStandardMaterial({
      color: 0x120f0d,
      roughness: 0.8,
      metalness: 0.2,
    })

    const bevelGoldMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.8,
    })

    // 4. Warehouse Cube Geometry & Construction
    // Main Cube dimensions
    const cubeSize = 3.2
    const cubeGroup = new THREE.Group()
    rootGroup.add(cubeGroup)

    // Create multi-material chamfered cube
    const cubeMaterials = [
      charcoalRightMaterial, // +X
      charcoalLeftMaterial,  // -X
      walnutTopMaterial,      // +Y
      innerCoreMaterial,      // -Y
      charcoalRightMaterial, // +Z
      charcoalLeftMaterial,  // -Z
    ]
    const boxGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
    const mainBox = new THREE.Mesh(boxGeometry, cubeMaterials)
    mainBox.castShadow = true
    mainBox.receiveShadow = true
    cubeGroup.add(mainBox)

    // Warehouse architectural accents: Cargo Pod framing lines & beveled edge highlights
    const edgesGeom = new THREE.EdgesGeometry(boxGeometry)
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.25,
      linewidth: 1,
    })
    const wireframeEdges = new THREE.LineSegments(edgesGeom, edgesMaterial)
    cubeGroup.add(wireframeEdges)

    // Top Facet Modular Cargo Ribs
    const ribGeom = new THREE.PlaneGeometry(2.4, 0.08)
    const ribMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.7,
    })
    for (let i = -1; i <= 1; i++) {
      const rib = new THREE.Mesh(ribGeom, ribMat)
      rib.rotation.x = -Math.PI / 2
      rib.position.set(0, cubeSize / 2 + 0.005, i * 0.7)
      cubeGroup.add(rib)
    }

    // Top Center Telemetry Node
    const centerNodeGeom = new THREE.CylinderGeometry(0.3, 0.35, 0.12, 6)
    const centerNodeMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a17,
      roughness: 0.3,
      metalness: 0.8,
    })
    const centerNode = new THREE.Mesh(centerNodeGeom, centerNodeMat)
    centerNode.position.set(0, cubeSize / 2 + 0.06, 0)
    cubeGroup.add(centerNode)

    const centerNodeLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    )
    centerNodeLens.position.set(0, cubeSize / 2 + 0.14, 0)
    cubeGroup.add(centerNodeLens)

    // 5. The Sharp Glowing Pulse / Heartbeat Cut along the Front Facet and Edge
    // We construct a sharp 3D pulse waveform that sweeps across the front facet and traces its edge
    const half = cubeSize / 2
    const pulseOffset = half + 0.04 // slightly protruding for crisp 3D visibility

    const pulsePoints: THREE.Vector3[] = [
      // Starts on the left facet
      new THREE.Vector3(-half, 0.4, 0.4),
      new THREE.Vector3(-0.8, 0.4, half),
      // Approaches front face center
      new THREE.Vector3(-0.4, 0.4, pulseOffset),
      new THREE.Vector3(-0.25, 0.4, pulseOffset),
      // Sharp ECG Heartbeat spike upwards
      new THREE.Vector3(-0.08, 1.15, pulseOffset),
      // Sharp plunge downwards into concurrency trough
      new THREE.Vector3(0.12, -0.95, pulseOffset),
      // Rebound stabilization
      new THREE.Vector3(0.32, 0.65, pulseOffset),
      new THREE.Vector3(0.48, 0.4, pulseOffset),
      // Continues along front right facet
      new THREE.Vector3(0.9, 0.4, pulseOffset),
      // Traces seamlessly along front-right corner edge downwards
      new THREE.Vector3(half, 0.4, half),
      new THREE.Vector3(half, -0.6, half),
      new THREE.Vector3(half, -half, 0.6),
    ]

    const pulseCurve = new THREE.CatmullRomCurve3(pulsePoints, false, 'catmullrom', 0.1)

    // Recessed Dark Slot/Trench Geometry behind the pulse
    const trenchGeom = new THREE.TubeGeometry(pulseCurve, 128, 0.1, 8, false)
    const trenchMat = new THREE.MeshBasicMaterial({
      color: 0x0a0807,
    })
    const trenchMesh = new THREE.Mesh(trenchGeom, trenchMat)
    trenchMesh.position.set(0, 0, -0.015)
    cubeGroup.add(trenchMesh)

    // Glowing Neon Pulse Heartbeat Tube
    const pulseTubeGeom = new THREE.TubeGeometry(pulseCurve, 128, 0.045, 12, false)
    const pulseTubeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.2,
    })
    const pulseMesh = new THREE.Mesh(pulseTubeGeom, pulseTubeMat)
    cubeGroup.add(pulseMesh)

    // Inner White-Gold Luminous Core Filament
    const coreFilamentGeom = new THREE.TubeGeometry(pulseCurve, 128, 0.018, 8, false)
    const coreFilamentMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
    })
    const coreFilamentMesh = new THREE.Mesh(coreFilamentGeom, coreFilamentMat)
    cubeGroup.add(coreFilamentMesh)

    // 6. Animated Energy Pulse Comet (Live real-time telemetry traveler)
    const cometSphereGeom = new THREE.SphereGeometry(0.11, 16, 16)
    const cometSphereMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
    })
    const cometMesh = new THREE.Mesh(cometSphereGeom, cometSphereMat)
    cubeGroup.add(cometMesh)

    // Comet Glow Halo
    const cometHaloGeom = new THREE.SphereGeometry(0.24, 16, 16)
    const cometHaloMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.45,
    })
    const cometHaloMesh = new THREE.Mesh(cometHaloGeom, cometHaloMat)
    cubeGroup.add(cometHaloMesh)

    // Dynamic Point Light attached to the traveling comet for facet cast reflections!
    const cometLight = new THREE.PointLight(0xf59e0b, 3.5, 3.5)
    cubeGroup.add(cometLight)

    // 7. Concurrency Lock Status Nodes (Pivots with pulsing rings)
    const lockNodesGroup = new THREE.Group()
    cubeGroup.add(lockNodesGroup)

    const nodePositions = [
      new THREE.Vector3(-0.08, 1.15, pulseOffset), // Peak Node
      new THREE.Vector3(0.12, -0.95, pulseOffset), // Trough Node
      new THREE.Vector3(half, half, half),          // Corner Lock Node
      new THREE.Vector3(-half, half, half),         // Left Corner Node
      new THREE.Vector3(half, -half, half),         // Lower Right Node
    ]

    const nodeMeshes: THREE.Mesh[] = []
    const nodeRings: THREE.Mesh[] = []

    nodePositions.forEach((pos, idx) => {
      const nodeMesh = new THREE.Mesh(
        new THREE.SphereGeometry(idx === 0 ? 0.09 : 0.065, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          emissive: 0xd97706,
          emissiveIntensity: 3.0,
          roughness: 0.1,
        })
      )
      nodeMesh.position.copy(pos)
      lockNodesGroup.add(nodeMesh)
      nodeMeshes.push(nodeMesh)

      // Surrounding concurrency ring
      const ringGeom = new THREE.RingGeometry(0.11, 0.15, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
      const ringMesh = new THREE.Mesh(ringGeom, ringMat)
      ringMesh.position.copy(pos)
      ringMesh.position.z += 0.02
      lockNodesGroup.add(ringMesh)
      nodeRings.push(ringMesh)
    })

    // 8. Expanding Shockwave Ring (Triggers on click or telemetry ping)
    const shockwaveGeom = new THREE.RingGeometry(0.1, 0.22, 48)
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    const shockwaveMesh = new THREE.Mesh(shockwaveGeom, shockwaveMat)
    shockwaveMesh.position.set(-0.08, 1.15, pulseOffset + 0.03)
    cubeGroup.add(shockwaveMesh)

    // 9. Floating Telemetry Amber Particles (Warehouse dust & data packets)
    const particleCount = 45
    const particleGeom = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)
    const particleScales = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 8
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 8
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 8
      particleScales[i] = Math.random() * 0.05 + 0.02
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

    const particleMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeom, particleMat)
    rootGroup.add(particles)

    // 10. Studio Lighting Setup
    // Warm Key Light (Top-Right-Front)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2)
    keyLight.position.set(12, 18, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 1024
    keyLight.shadow.mapSize.height = 1024
    scene.add(keyLight)

    // Crisp Gold Rim Light
    const goldRimLight = new THREE.DirectionalLight(0xfbbf24, 2.5)
    goldRimLight.position.set(-10, 8, -10)
    scene.add(goldRimLight)

    // Burnt Copper Fill Light (Soft warm bounce from below)
    const copperFillLight = new THREE.DirectionalLight(0xd97706, 1.4)
    copperFillLight.position.set(0, -10, 8)
    scene.add(copperFillLight)

    // Ambient Warmth
    const ambientLight = new THREE.AmbientLight(0x2b2118, 1.8)
    scene.add(ambientLight)

    // 11. Mouse Tilt & Parallax Variables
    let mouseX = 0
    let mouseY = 0
    let targetRotX = 0
    let targetRotY = 0
    let isDragging = false
    let prevPointerX = 0
    let prevPointerY = 0

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      mouseX = nx
      mouseY = ny

      if (isDragging) {
        const deltaX = e.clientX - prevPointerX
        const deltaY = e.clientY - prevPointerY
        targetRotY += deltaX * 0.008
        targetRotX += deltaY * 0.008
        prevPointerX = e.clientX
        prevPointerY = e.clientY
      }
    }

    const handlePointerDown = (e: MouseEvent) => {
      isDragging = true
      prevPointerX = e.clientX
      prevPointerY = e.clientY
      triggerTelemetryPing()
    }

    const handlePointerUp = () => {
      isDragging = false
    }

    let shockwaveProgress = 1
    const triggerTelemetryPing = () => {
      shockwaveProgress = 0
      setPingsCount((prev) => prev + 1)
      setActiveLock('ACQUIRING')
      setTimeout(() => setActiveLock('LOCKED'), 400)
    }

    container.addEventListener('mousemove', handlePointerMove)
    container.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('mouseup', handlePointerUp)

    // 12. Animation Loop
    let animationFrameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Idle Harmonic Levitation (Floating bobbing)
      rootGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.16

      // Base isometric resting angle + mouse tilt response
      if (!isDragging) {
        targetRotY = mouseX * 0.28
        targetRotX = -mouseY * 0.22
      }

      // Smooth Lerp Damping
      rootGroup.rotation.y += (targetRotY - rootGroup.rotation.y) * 0.05
      rootGroup.rotation.x += (targetRotX - rootGroup.rotation.x) * 0.05

      // Subtly rotate particle cloud
      particles.rotation.y = elapsedTime * 0.05

      // Traveling Energy Pulse Comet along the Heartbeat Path
      // Loops smoothly every 2.4 seconds
      const cometSpeed = 0.42
      const cometProgress = (elapsedTime * cometSpeed) % 1
      const cometPos = pulseCurve.getPointAt(cometProgress)
      cometMesh.position.copy(cometPos)
      cometHaloMesh.position.copy(cometPos)
      cometLight.position.copy(cometPos)

      // Pulse the glow intensity dynamically as comet approaches the peak spike
      const isNearSpike = cometProgress > 0.25 && cometProgress < 0.55
      const pulseIntensity = isNearSpike
        ? 3.8 + Math.sin(elapsedTime * 18) * 1.2
        : 2.2 + Math.sin(elapsedTime * 4) * 0.5

      pulseTubeMat.emissiveIntensity = pulseIntensity
      cometLight.intensity = isNearSpike ? 5.0 : 3.0

      // Animate Concurrency Lock Rings
      nodeRings.forEach((ring, idx) => {
        const ringScale = 1 + Math.sin(elapsedTime * 3 + idx) * 0.15
        ring.scale.set(ringScale, ringScale, 1)
      })

      // Animate Shockwave Flare if active
      if (shockwaveProgress < 1) {
        shockwaveProgress += 0.045
        const scale = 1 + shockwaveProgress * 7
        shockwaveMesh.scale.set(scale, scale, 1)
        shockwaveMat.opacity = Math.max(0, 1 - shockwaveProgress) * 0.85
      }

      renderer.render(scene, camera)
    }

    animate()

    // 13. Window / Container Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        if (newWidth === 0 || newHeight === 0) return

        const newAspect = newWidth / newHeight
        camera.left = (-frustumSize * newAspect) / 2
        camera.right = (frustumSize * newAspect) / 2
        camera.top = frustumSize / 2
        camera.bottom = -frustumSize / 2
        camera.updateProjectionMatrix()

        renderer.setSize(newWidth, newHeight)
      }
    })
    resizeObserver.observe(container)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      container.removeEventListener('mousemove', handlePointerMove)
      container.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('mouseup', handlePointerUp)

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
      boxGeometry.dispose()
      pulseTubeGeom.dispose()
      coreFilamentGeom.dispose()
      cometSphereGeom.dispose()
      cometHaloGeom.dispose()
      shockwaveGeom.dispose()
      particleGeom.dispose()
    }
  }, [])

  if (!webGLSupported) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <StockPulseVectorLogo size={260} animated showGlow />
      </div>
    )
  }

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[380px] sm:min-h-[460px] cursor-grab active:cursor-grabbing"
      />

      {/* Ambient Radial Backlight Glow Behind Cube */}
      <div
        className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-[#D97706]/15 via-[#F59E0B]/20 to-[#FBBF24]/10 blur-3xl opacity-60" />
      </div>

      {/* Floating Telemetry HUD Overlay */}
      {showTelemetryHUD && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 pointer-events-none flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Real-time Concurrency Lock Telemetry */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1F1A17] border border-amber-500/30 text-amber-200/90 shadow-md">
            <span className="relative flex size-2">
              <span className="size-2 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            </span>
            <span className="font-semibold tracking-wide">PULSE TELEMETRY:</span>
            <span className="text-[#FBBF24] font-bold">
              {activeLock === 'LOCKED' ? 'ATOMIC_LOCK_ACTIVE' : 'SYNCHRONIZING...'}
            </span>
          </div>

          {/* Interactive Hint */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1F1A17] border border-white/10 text-stone-300">
            <span>Drag / Hover to rotate 3D Isometric View</span>
            <span className="size-1 rounded-full bg-amber-500/50" />
            <span>Pings: {pingsCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}

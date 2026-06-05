/* eslint-disable react/no-unknown-property */
"use client";

import { Environment, Lightformer, useGLTF, useTexture } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RigidBodyProps,
} from "@react-three/rapier";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { contactProfile } from "@/data/site";

const cardGLB = "/lanyard/card.glb";
const bandTexture = "/lanyard/lanyard.png";

extend({ MeshLineGeometry, MeshLineMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshLineGeometry: JSX.IntrinsicElements["mesh"] & {
        setPoints?: (points: THREE.Vector3[]) => void;
      };
      meshLineMaterial: JSX.IntrinsicElements["mesh"] & {
        color?: string;
        depthTest?: boolean;
        lineWidth?: number;
        map?: THREE.Texture;
        repeat?: [number, number];
        resolution?: [number, number];
        useMap?: boolean;
      };
    }
  }
}

type GLTFResult = {
  nodes: {
    card: THREE.Mesh;
    clip: THREE.Mesh;
    clamp: THREE.Mesh;
  };
  materials: {
    base: THREE.MeshPhysicalMaterial;
    metal: THREE.MeshStandardMaterial;
  };
};

export function LanyardScene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 24], fov: 20 }}
      dpr={[1, isMobile ? 1.5 : 2]}
      gl={{ alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
    >
      <ambientLight intensity={Math.PI} />
      <Physics gravity={[0, -40, 0]} timeStep={isMobile ? 1 / 30 : 1 / 60}>
        <Band isMobile={isMobile} />
      </Physics>
      <Environment blur={0.75}>
        <Lightformer
          color="white"
          intensity={2}
          position={[0, -1, 5]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          color="white"
          intensity={3}
          position={[-1, -1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          color="white"
          intensity={3}
          position={[1, 1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          color="white"
          intensity={10}
          position={[-10, 0, 14]}
          rotation={[0, Math.PI / 2, Math.PI / 3]}
          scale={[100, 10, 1]}
        />
      </Environment>
    </Canvas>
  );
}

function Band({
  isMobile = false,
  maxSpeed = 50,
  minSpeed = 0,
}: {
  isMobile?: boolean;
  maxSpeed?: number;
  minSpeed?: number;
}) {
  const band = useRef<THREE.Mesh>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = new THREE.Vector3();
  const ang = new THREE.Vector3();
  const rot = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const segmentProps = {
    angularDamping: 4,
    canSleep: true,
    colliders: undefined,
    linearDamping: 4,
    type: "dynamic" as RigidBodyProps["type"],
  };

  const { nodes, materials } = useGLTF(cardGLB) as unknown as GLTFResult;
  const texture = useTexture(bandTexture) as THREE.Texture;
  const cardTexture = useMemo(
    () => createContactCardTexture(contactProfile.wechat, contactProfile.email),
    [],
  );
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]),
  );
  const [dragged, drag] = useState<false | THREE.Vector3>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0],
  ]);

  useEffect(() => {
    if (!hovered) {
      return;
    }

    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  useEffect(() => {
    return () => cardTexture.dispose();
  }, [cardTexture]);

  useFrame((state, delta) => {
    if (dragged && typeof dragged !== "boolean") {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current && j1.current && j2.current && j3.current && card.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) {
          ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        }

        const clampedDistance = Math.max(
          0.1,
          Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())),
        );
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)),
        );
      });

      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());

      const geometry = band.current?.geometry as MeshLineGeometry | undefined;
      geometry?.setPoints(curve.getPoints(isMobile ? 16 : 32));

      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = "chordal";
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            onPointerDown={(event) => {
              event.stopPropagation();
              (event.target as Element).setPointerCapture(event.pointerId);
              drag(new THREE.Vector3().copy(event.point).sub(vec.copy(card.current.translation())));
            }}
            onPointerOut={() => hover(false)}
            onPointerOver={() => hover(true)}
            onPointerUp={(event) => {
              event.stopPropagation();
              (event.target as Element).releasePointerCapture(event.pointerId);
              drag(false);
            }}
            position={[0, -1.2, -0.05]}
            scale={2.25}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                map={cardTexture}
                map-anisotropy={16}
                metalness={0.8}
                roughness={0.9}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="#315B46"
          depthTest={false}
          lineWidth={1}
          map={texture}
          repeat={[-4, 1]}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
        />
      </mesh>
    </>
  );
}

useGLTF.preload(cardGLB);

function createContactCardTexture(wechat: string, email: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = "#050706";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "rgba(255,255,255,0.12)");
  gradient.addColorStop(0.42, "rgba(255,255,255,0.02)");
  gradient.addColorStop(1, "rgba(49,80,68,0.18)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(247,240,228,0.08)";
  ctx.lineWidth = 2;
  for (let y = 500; y < 780; y += 36) {
    ctx.beginPath();
    ctx.moveTo(190, y);
    ctx.lineTo(512, y + 110);
    ctx.lineTo(834, y);
    ctx.stroke();
  }

  drawPremiumBlackFront(ctx, wechat, email);
  drawBackQr(ctx, 512, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

function drawTextureLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: string,
  isWechat: boolean,
) {
  ctx.fillStyle = "rgba(247,240,228,0.09)";
  roundedRect(ctx, x, y, 424, 150, 30);
  ctx.fill();

  ctx.strokeStyle = "rgba(247,240,228,0.18)";
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, 424, 150, 30);
  ctx.stroke();

  ctx.fillStyle = "rgba(221,229,217,0.13)";
  roundedRect(ctx, x + 25, y + 27, 96, 96, 26);
  ctx.fill();

  ctx.strokeStyle = "#f7f0e4";
  ctx.lineWidth = 7;
  if (isWechat) {
    drawWechatIcon(ctx, x + 73, y + 76);
  } else {
    ctx.strokeRect(x + 49, y + 64, 48, 34);
    ctx.beginPath();
    ctx.moveTo(x + 49, y + 66);
    ctx.lineTo(x + 73, y + 86);
    ctx.lineTo(x + 97, y + 66);
    ctx.stroke();
  }

  ctx.textAlign = "left";
  ctx.fillStyle = "#f7f0e4";
  ctx.font = isWechat ? "900 58px 'Microsoft YaHei', sans-serif" : "800 31px 'Microsoft YaHei', sans-serif";
  ctx.fillText(value, x + 145, y + 91);
}

function drawPremiumBlackFront(
  ctx: CanvasRenderingContext2D,
  wechat: string,
  email: string,
) {
  const centerX = 256;

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(246,246,246,0.72)";
  ctx.font = "700 38px 'Microsoft YaHei', Arial, sans-serif";
  ctx.fillText("微信", centerX, 226);

  ctx.strokeStyle = "rgba(201,111,50,0.88)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX - 34, 262);
  ctx.lineTo(centerX + 34, 262);
  ctx.stroke();

  const nameGradient = ctx.createLinearGradient(0, 292, 0, 390);
  nameGradient.addColorStop(0, "#ffffff");
  nameGradient.addColorStop(0.55, "#f2f2f2");
  nameGradient.addColorStop(1, "#b9b9b9");
  ctx.fillStyle = nameGradient;
  ctx.font = "900 86px Inter, Arial, 'Microsoft YaHei', sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillText(wechat || "微信号", centerX, 382);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  drawDivider(ctx, centerX, 486);

  ctx.fillStyle = "rgba(246,246,246,0.64)";
  ctx.font = "700 34px 'Microsoft YaHei', Arial, sans-serif";
  ctx.fillText("邮箱", centerX, 574);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "800 33px Inter, Arial, sans-serif";
  ctx.fillText(email || "邮箱", centerX, 638);
}

function drawWechatIcon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x - 43, y - 35);
  ctx.scale(0.72, 0.72);
  ctx.fillStyle = "#f7f7f7";
  ctx.shadowColor = "rgba(0,0,0,0.42)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 5;
  ctx.fill(
    new Path2D(
      "M47.5 8C23.5 8 4 24.2 4 44.2C4 55.8 10.6 66.1 20.8 72.7L16.9 86.5L31.6 79.1C36.5 80.4 41.9 81.1 47.5 81.1C71.5 81.1 91 64.9 91 44.9C91 24.9 71.5 8 47.5 8Z",
    ),
  );
  ctx.fill(
    new Path2D(
      "M82.5 36.5C63.9 36.5 48.8 49.1 48.8 64.6C48.8 80.1 63.9 92.7 82.5 92.7C86.7 92.7 90.7 92.1 94.4 90.9L106.1 96L103 85.4C111.1 80.2 116.2 72.7 116.2 64.6C116.2 49.1 101.1 36.5 82.5 36.5Z",
    ),
  );
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.arc(34.5, 38, 4.6, 0, Math.PI * 2);
  ctx.arc(61.5, 38, 4.6, 0, Math.PI * 2);
  ctx.arc(73.5, 61.5, 3.8, 0, Math.PI * 2);
  ctx.arc(94.5, 61.5, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDivider(ctx: CanvasRenderingContext2D, centerX: number, y: number) {
  const gradient = ctx.createLinearGradient(centerX - 165, y, centerX + 165, y);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.28, "rgba(255,255,255,0.22)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.62)");
  gradient.addColorStop(0.72, "rgba(255,255,255,0.22)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 165, y);
  ctx.lineTo(centerX + 165, y);
  ctx.stroke();

  ctx.save();
  ctx.translate(centerX, y);
  ctx.rotate(Math.PI / 4);
  const gemGradient = ctx.createLinearGradient(-10, -10, 10, 10);
  gemGradient.addColorStop(0, "#ffffff");
  gemGradient.addColorStop(1, "#8d8d8d");
  ctx.fillStyle = gemGradient;
  ctx.shadowColor = "rgba(255,255,255,0.24)";
  ctx.shadowBlur = 14;
  roundedRect(ctx, -9, -9, 18, 18, 2);
  ctx.fill();
  ctx.restore();
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  const chars = Array.from(text);
  const widths = chars.map((char) => ctx.measureText(char).width);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0) + spacing * (chars.length - 1);
  let cursor = x - totalWidth / 2;

  chars.forEach((char, index) => {
    ctx.fillText(char, cursor + widths[index] / 2, y);
    cursor += widths[index] + spacing;
  });
}

function drawBackQr(ctx: CanvasRenderingContext2D, areaX: number, areaY: number) {
  const size = 330;
  const x = areaX + 91;
  const y = areaY + 210;

  ctx.fillStyle = "#fbf7ef";
  roundedRect(ctx, x, y, size, size, 32);
  ctx.fill();

  const matrix = [
    "111001011101",
    "100001010001",
    "101101110101",
    "100001001001",
    "111001111101",
    "000111000000",
    "101010111011",
    "001110010100",
    "111011101101",
    "100010001001",
    "101111101101",
    "111000101111",
  ];
  const cell = size / 18.5;
  const dot = cell * 0.62;
  const startX = x + size * 0.18;
  const startY = y + size * 0.18;

  ctx.fillStyle = "#20392f";
  matrix.forEach((row, rowIndex) => {
    row.split("").forEach((item, colIndex) => {
      if (item === "1") {
        roundedRect(ctx, startX + colIndex * cell, startY + rowIndex * cell, dot, dot, 4);
        ctx.fill();
      }
    });
  });

  ctx.fillStyle = "#20392f";
  roundedRect(ctx, x + size / 2 - 38, y + size / 2 - 38, 76, 76, 18);
  ctx.fill();
  ctx.fillStyle = "#f7f0e4";
  ctx.font = "700 28px 'Microsoft YaHei', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("微信", x + size / 2, y + size / 2 + 9);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

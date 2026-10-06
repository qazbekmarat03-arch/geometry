"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type Solid = "cube" | "sphere" | "tetrahedron";

/** Isolated decorative WebGL. All calculations and controls remain accessible HTML. */
export default function GeometryScene({
  variant = "hero",
  solid = "cube",
  size = 3,
  paused = false,
}: {
  variant?: "hero" | "lab";
  solid?: Solid;
  size?: number;
  paused?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const scale = useRef(size);
  useEffect(() => {
    scale.current = size;
  }, [size]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const mobile = window.matchMedia("(max-width: 700px)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !mobile,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.6),
    );
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    element.dataset.ready = "true";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
    camera.position.set(0, 0.2, variant === "hero" ? 9.8 : 7.5);
    scene.add(new THREE.AmbientLight(0xc2ffe4, 2.2));
    const key = new THREE.DirectionalLight(0xe0fff4, 5);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0x2ee59d, 35, 20);
    rim.position.set(-3, -1, 3);
    scene.add(rim);
    const group = new THREE.Group();
    scene.add(group);
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const glass = (geometry: THREE.BufferGeometry) => {
      geometries.push(geometry);
      const body = new THREE.MeshPhysicalMaterial({
        color: 0x2ee59d,
        metalness: 0.32,
        roughness: 0.14,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
        clearcoat: 1,
      });
      const edges = new THREE.EdgesGeometry(geometry, 20);
      const line = new THREE.LineBasicMaterial({
        color: 0x72ffc3,
        transparent: true,
        opacity: 0.75,
      });
      materials.push(body, line);
      geometries.push(edges);
      const object = new THREE.Group();
      object.add(
        new THREE.Mesh(geometry, body),
        new THREE.LineSegments(edges, line),
      );
      return object;
    };
    const geometry =
      variant === "hero"
        ? new THREE.IcosahedronGeometry(1.65, 0)
        : solid === "sphere"
          ? new THREE.SphereGeometry(1.3, 24, 16)
          : solid === "tetrahedron"
            ? new THREE.TetrahedronGeometry(1.65)
            : new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const main = glass(geometry);
    main.rotation.set(0.2, 0.4, -0.16);
    group.add(main);
    const satellites: THREE.Group[] = [];
    if (variant === "hero") {
      [
        new THREE.BoxGeometry(0.7, 0.7, 0.7),
        new THREE.TetrahedronGeometry(0.65),
        new THREE.TorusGeometry(0.45, 0.13, 10, 36),
      ].forEach((shape, i) => {
        const object = glass(shape);
        object.position.set(
          i === 0 ? -2 : i === 1 ? 1.85 : 1.65,
          i === 0 ? 1.6 : i === 1 ? -1.5 : 1.6,
          -0.3,
        );
        object.rotation.set(0.6, 0.5, 0.4);
        group.add(object);
        satellites.push(object);
      });
      const orbitGeometry = new THREE.TorusGeometry(2.5, 0.008, 4, 100);
      const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x2ee59d,
        transparent: true,
        opacity: 0.24,
      });
      geometries.push(orbitGeometry);
      materials.push(orbitMaterial);
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.set(1.2, 0.2, -0.5);
      group.add(orbit);
      const dots = new Float32Array((mobile ? 18 : 45) * 3);
      for (let i = 0; i < dots.length; i++)
        dots[i] = Math.sin(i * 127.1 + 31.7) * 4;
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute("position", new THREE.BufferAttribute(dots, 3));
      const dustMaterial = new THREE.PointsMaterial({
        color: 0xa7f3d0,
        size: 0.025,
        transparent: true,
        opacity: 0.6,
      });
      geometries.push(dustGeometry);
      materials.push(dustMaterial);
      scene.add(new THREE.Points(dustGeometry, dustMaterial));
    }
    let visible = false,
      pointerX = 0,
      pointerY = 0,
      scrollProgress = 0,
      elapsed = 0,
      previous = 0;
    const render = (time = 0) => {
      const dt = previous ? Math.min((time - previous) / 1000, 0.04) : 0;
      previous = time;
      const moving = !reduced.matches && !paused;
      if (moving) elapsed += dt;
      main.rotation.y =
        0.4 + elapsed * 0.13 + (moving ? scrollProgress * 0.6 : 0);
      main.rotation.x = 0.2 + Math.sin(elapsed * 0.25) * 0.12;
      group.rotation.y +=
        ((moving ? pointerX * 0.12 : 0) - group.rotation.y) * 0.06;
      group.rotation.x +=
        ((moving ? pointerY * 0.08 : 0) - group.rotation.x) * 0.06;
      main.position.y = Math.sin(elapsed * 0.6) * 0.09;
      main.scale.setScalar(
        variant === "lab"
          ? scale.current / 3
          : 1 + Math.sin(scrollProgress * Math.PI) * 0.08,
      );
      satellites.forEach((object, i) => {
        object.rotation.y = elapsed * 0.17 + i;
      });
      renderer.render(scene, camera);
    };
    const updateLoop = () => {
      previous = 0;
      renderer.setAnimationLoop(
        visible && !document.hidden && !reduced.matches && !paused
          ? render
          : null,
      );
      render();
    };
    const resize = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    });
    resize.observe(element);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateLoop();
    });
    intersection.observe(element);
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = element.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / rect.width - 0.5;
      pointerY = (event.clientY - rect.top) / rect.height - 0.5;
    };
    const scroll = () => {
      scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);
    };
    const input = () => {
      requestAnimationFrame(() => render());
    };
    element.addEventListener("pointermove", pointer);
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("visibilitychange", updateLoop);
    document.addEventListener("input", input);
    reduced.addEventListener("change", updateLoop);
    return () => {
      renderer.setAnimationLoop(null);
      resize.disconnect();
      intersection.disconnect();
      element.removeEventListener("pointermove", pointer);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("visibilitychange", updateLoop);
      document.removeEventListener("input", input);
      reduced.removeEventListener("change", updateLoop);
      geometries.forEach((item) => item.dispose());
      materials.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      delete element.dataset.ready;
    };
  }, [variant, solid, paused]);
  return (
    <div ref={host} className="gm-scene" aria-hidden="true">
      <svg className="gm-scene-fallback" viewBox="0 0 400 400" fill="none">
        <path
          d="M200 48 350 145 310 310 130 348 45 180Z M200 48 130 348 350 145 45 180 310 310Z M200 48 310 310 M45 180 130 348"
          stroke="#2ee59d"
          strokeWidth="1.5"
          fill="#14b87a18"
        />
      </svg>
    </div>
  );
}

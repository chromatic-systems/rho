import Globe from 'globe.gl';
import * as THREE from 'three';

const world = Globe({ animateIn: false })
  (document.getElementById('globeViz'))
  .globeImageUrl('/apps/globe3/blue-marble.jpg')
  .bumpImageUrl('/apps/globe3/topo.png');

// Auto-rotate
world.controls().autoRotate = true;
world.controls().autoRotateSpeed = 0.35;

// Add clouds sphere
const CLOUDS_ALT = 0.02;
const CLOUDS_ROTATION_SPEED = -0.010; // deg/frame

new THREE.TextureLoader().load("/k/images/clouds.png", cloudsTexture => {
  const clouds = new THREE.Mesh(
    new THREE.SphereBufferGeometry(world.getGlobeRadius() * (1 + CLOUDS_ALT), 75, 75),
    new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true })
  );
  world.scene().add(clouds);

  (function rotateClouds() {
    clouds.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
    requestAnimationFrame(rotateClouds);
  })();
});
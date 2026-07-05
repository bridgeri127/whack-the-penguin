import * as THREE from 'three';
import { GROUND_BASE, LEDGE_X, LEDGE_Y_3D, COLORS } from './constants.js';

function getTerrainY(x) {
  return Math.sin(x * 0.005) * 18 + Math.sin(x * 0.021) * 6;
}

// --- Terrain ---
function createTerrain(scene) {
  // Large plane extending far right for the flight distance
  const width = 3000;
  const depth = 60;
  const segmentsX = 300;
  const segmentsZ = 6;

  const geo = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);
  geo.rotateX(-Math.PI / 2); // Lay flat on XZ plane

  // Displace vertices for terrain undulation
  const positions = geo.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const y = getTerrainY(x + width / 2);
    positions.setY(i, y);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: COLORS.snow,
    flatShading: true,
  });

  const terrain = new THREE.Mesh(geo, mat);
  terrain.position.set(width / 2, 0, 0);
  terrain.receiveShadow = true;
  scene.add(terrain);

  return terrain;
}

// --- Cliff ---
function createCliff(scene) {
  const group = new THREE.Group();

  // Rock face — tall wall from ground up
  const rockGeo = new THREE.BoxGeometry(75, LEDGE_Y_3D + 40, 5);
  const rockMat = new THREE.MeshStandardMaterial({
    color: COLORS.cliffRock,
    flatShading: true,
  });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.set(37.5, LEDGE_Y_3D / 2, 0);
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  // Rocky texture details — scattered small boxes
  const detailMat = new THREE.MeshStandardMaterial({
    color: COLORS.cliffRockDark,
    flatShading: true,
  });
  const detailPositions = [
    [15, 200, 2.6], [50, 300, 2.6], [30, 100, 2.6],
    [60, 150, -2.6], [20, 350, -2.6], [45, 250, 2.6],
    [10, 120, -2.6], [65, 320, 2.6], [35, 180, -2.6],
  ];
  for (const [x, y, z] of detailPositions) {
    const dGeo = new THREE.BoxGeometry(8 + Math.random() * 6, 4 + Math.random() * 3, 0.5);
    const d = new THREE.Mesh(dGeo, detailMat);
    d.position.set(x, y, z);
    group.add(d);
  }

  // Snow cap on cliff top
  const snowGeo = new THREE.BoxGeometry(77, 6, 6);
  const snowMat = new THREE.MeshStandardMaterial({
    color: COLORS.cliffSnow,
    flatShading: true,
  });
  const snow = new THREE.Mesh(snowGeo, snowMat);
  snow.position.set(37.5, LEDGE_Y_3D + 38, 0);
  group.add(snow);

  // Ledge platform
  const ledgeGeo = new THREE.BoxGeometry(100, 3, 5);
  const ledgeMat = new THREE.MeshStandardMaterial({
    color: COLORS.cliffLedge,
    flatShading: true,
  });
  const ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
  ledge.position.set(50, LEDGE_Y_3D, 0);
  ledge.castShadow = true;
  ledge.receiveShadow = true;
  group.add(ledge);

  // Snow on ledge surface
  const ledgeSnowGeo = new THREE.BoxGeometry(100, 1, 5.5);
  const ledgeSnow = new THREE.Mesh(ledgeSnowGeo, snowMat);
  ledgeSnow.position.set(50, LEDGE_Y_3D + 2, 0);
  group.add(ledgeSnow);

  // Icicles hanging below ledge
  const icicleMat = new THREE.MeshStandardMaterial({
    color: COLORS.icicle,
    flatShading: true,
    transparent: true,
    opacity: 0.85,
  });
  const iciclePositions = [80, 90, 95, 100];
  for (const x of iciclePositions) {
    const h = 4 + Math.random() * 8;
    const iGeo = new THREE.ConeGeometry(1.5, h, 4);
    const icicle = new THREE.Mesh(iGeo, icicleMat);
    icicle.position.set(x, LEDGE_Y_3D - h / 2 - 1.5, 0);
    group.add(icicle);
  }

  scene.add(group);
  return group;
}

// --- Mountains ---
function createMountains(scene) {
  const group = new THREE.Group();

  const mountainData = {
    back: {
      color: COLORS.mountainBack,
      z: -250,
      peaks: [
        { x: -100, h: 180 }, { x: 50, h: 220 }, { x: 200, h: 190 },
        { x: 380, h: 250 }, { x: 550, h: 200 }, { x: 750, h: 230 },
        { x: 950, h: 210 }, { x: 1150, h: 260 }, { x: 1400, h: 240 },
        { x: 1700, h: 220 }, { x: 2000, h: 250 }, { x: 2400, h: 230 },
      ],
    },
    front: {
      color: COLORS.mountainFront,
      z: -150,
      peaks: [
        { x: 20, h: 130 }, { x: 150, h: 160 }, { x: 300, h: 140 },
        { x: 450, h: 170 }, { x: 620, h: 150 }, { x: 800, h: 180 },
        { x: 980, h: 145 }, { x: 1180, h: 175 }, { x: 1380, h: 155 },
        { x: 1600, h: 170 }, { x: 1850, h: 160 }, { x: 2100, h: 175 },
        { x: 2350, h: 140 }, { x: 2600, h: 165 },
      ],
    },
  };

  for (const [layerName, data] of Object.entries(mountainData)) {
    const layerGroup = new THREE.Group();
    layerGroup.userData.parallaxFactor = layerName === 'back' ? 0.2 : 0.4;

    const mat = new THREE.MeshStandardMaterial({
      color: data.color,
      flatShading: true,
    });
    const snowMat = new THREE.MeshStandardMaterial({
      color: COLORS.mountainSnow,
      flatShading: true,
    });

    for (const peak of data.peaks) {
      // Mountain cone
      const radius = 30 + Math.random() * 20;
      const mGeo = new THREE.ConeGeometry(radius, peak.h, 5);
      const mountain = new THREE.Mesh(mGeo, mat);
      mountain.position.set(peak.x, peak.h / 2, data.z);
      layerGroup.add(mountain);

      // Snow cap — smaller cone on top
      const sGeo = new THREE.ConeGeometry(radius * 0.45, peak.h * 0.2, 5);
      const cap = new THREE.Mesh(sGeo, snowMat);
      cap.position.set(peak.x, peak.h * 0.85, data.z);
      layerGroup.add(cap);
    }

    group.add(layerGroup);
  }

  scene.add(group);
  return group;
}

// --- Distance Markers ---
function createDistanceMarkers(scene) {
  const group = new THREE.Group();

  const postMat = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    flatShading: true,
  });
  const flagMat = new THREE.MeshStandardMaterial({
    color: COLORS.gold,
    flatShading: true,
  });

  for (let x = 100; x < 2500; x += 100) {
    const terrainY = getTerrainY(x);
    const isMajor = x % 200 === 0;
    const height = isMajor ? 12 : 7;

    // Post
    const postGeo = new THREE.BoxGeometry(1, height, 1);
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(x, terrainY + height / 2, 0);
    group.add(post);

    // Flag on major markers
    if (isMajor) {
      const flagGeo = new THREE.BoxGeometry(5, 3, 0.2);
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(x + 2.5, terrainY + height - 1, 0);
      group.add(flag);
    }
  }

  scene.add(group);
  return group;
}

// --- Main ---
export function createEnvironment(scene) {
  const terrain = createTerrain(scene);
  const cliff = createCliff(scene);
  const mountains = createMountains(scene);
  const markers = createDistanceMarkers(scene);

  return { terrain, cliff, mountains, markers };
}

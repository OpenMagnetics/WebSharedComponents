<script setup>
import { markRaw, toRaw } from 'vue';
import { MeshPhysicalMaterial, Object3D, Group, Mesh, Box3, Vector3 } from 'three';
import { Camera, Renderer, SpotLight, Scene, AmbientLight } from 'troisjs';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { deepCopy, hexToRgb } from '../assets/js/utils.js';
import { initMvbWorker, buildCoreSTL, buildSpacersSTL, buildBobbinSTL, buildTurnsSTL, buildFR4BoardSTL, terminateWorker } from '../assets/js/mvbRuntime.js';
</script>

<script>
// Component colors - matching MKF Painter colors from Settings.cpp
const COMPONENT_COLORS = {
  // Core/ferrite color
  ferrite: '#7b7c7d',
  // Bobbin color
  bobbin: '#539796',
  // Copper conductor color
  copper: '#b87333',
  // Spacer color (bakelite - brownish amber)
  spacer: '#8B4513',
};

// Wire coating colors by type - matching MKF Settings.h Painter colors
const COATING_COLORS = {
  enamelled: '#c63032',   // Enamelled wire coating (enamel)
  enamel: '#c63032',      // Alias for enamelled
  insulated: '#fff05b',   // Generic insulation
  insulation: '#fff05b',  // Alias for insulated
  fep: '#252525',         // FEP coating
  etfe: '#b42811',        // ETFE coating
  tca: '#696969',         // TCA coating
  pfa: '#edbe1c',         // PFA coating
  silk: '#e7e7e8',        // Served/silk coating
  served: '#e7e7e8',      // Alias for silk
  fr4: '#008000',         // FR4 (for planar)
  margin: '#fff05b',      // Margin tape
  bare: '#b87333',        // Bare copper (no coating)
  copper: '#b87333',      // Copper conductor color
};

/**
 * Get the color for a wire turn based on its coating
 * @param {Object} turnData - Turn description data
 * @param {Object} coil - Coil data with functional description
 * @param {number} windingIndex - Index of the winding
 * @returns {string} Hex color for the wire
 */
function getWireColorFromCoating(turnData, coil, windingIndex) {
  // Try to find the wire info from functionalDescription
  const windingName = turnData.winding;
  const functionalDesc = coil?.functionalDescription;
  
  if (functionalDesc && windingName) {
    const windingData = functionalDesc.find(w => w.name === windingName);
    
    // Check wire type first - foil wires should be copper colored
    const wireType = windingData?.wire?.type?.toLowerCase();
    if (wireType === 'foil') {
      return COMPONENT_COLORS.copper;
    }
    
    if (windingData?.wire?.coating) {
      const coating = windingData.wire.coating;
      // Check coating material first (e.g., "ETFE", "FEP")
      // coating.material may be a string or a full material object
      const rawMaterial = coating.material;
      const materialStr = typeof rawMaterial === 'string' ? rawMaterial : rawMaterial?.name ?? rawMaterial?.material ?? '';
      const material = materialStr?.toLowerCase();
      if (material && COATING_COLORS[material]) {
        return COATING_COLORS[material];
      }
      // Check coating type (e.g., "enamelled", "insulated")
      const type = coating.type?.toLowerCase();
      if (type && COATING_COLORS[type]) {
        return COATING_COLORS[type];
      }
    }
  }
  
  // Fallback to winding colors array
  return WINDING_COLORS[windingIndex % WINDING_COLORS.length] || COMPONENT_COLORS.copper;
}

// Default winding colors for multi-winding visualization
const WINDING_COLORS = [
  '#b87333',  // Copper
  '#cc5500',  // Dark copper
  '#ff6b35',  // Orange
  '#ffd700',  // Gold
  '#cd7f32',  // Bronze
];

export default {
  emits: ["errorInDimensions", "buildComplete"],
  props: {
    dataTestLabel: {
      type: String,
      default: '',
    },
    magnetic: {
      type: Object,
      required: true,
    },
    forceUpdate: {
      type: Number,
      default: 0
    },
    showCore: {
      type: Boolean,
      default: true,
    },
    showTurns: {
      type: Boolean,
      default: true,
    },
    showBobbin: {
      type: Boolean,
      default: true,
    },
    coreColor: {
      type: String,
      default: COMPONENT_COLORS.ferrite,
    },
    bobbinColor: {
      type: String,
      default: COMPONENT_COLORS.bobbin,
    },
    turnsColor: {
      type: String,
      default: COMPONENT_COLORS.copper,
    },
    bobbinOpacity: {
      type: Number,
      default: 0.7,
    },
    offset: {
      type: Number,
      default: 1,
    },
    loadingGif: {
      type: String,
      default: `${import.meta.env.BASE_URL}/images/loading.gif`,
    },
    backgroundColor: {
      type: String,
      default: "#1a1a1a",
    },
    buttonColor: {
      type: String,
      default: "white",
    },
  },
  components: {
    Camera,
    Renderer,
    SpotLight,
    Scene,
    AmbientLight,
  },
  data() {
    return {
      currentGroup: null,
      coreMesh: null,
      bobbinMesh: null,
      turnsMeshes: [],
      building: false,
      updating: true,
      recentChange: false,
      tryingToSend: false,
      currentMagnetic: null,
      mvbInitialized: false,
      theme: this.getTheme(),
      isMounted: false,
      // Internal visibility state (can be toggled by UI)
      internalShowCore: this.showCore,
      internalShowBobbin: this.showBobbin,
      internalShowTurns: this.showTurns,
    };
  },
  watch: {
    'forceUpdate': {
      handler(newValue, oldValue) {
        this.triggerUpdate();
      },
    },
    'magnetic': {
      handler(newValue, oldValue) {
        // Only trigger if magnetic actually changed
        if (JSON.stringify(newValue) !== JSON.stringify(this.currentMagnetic)) {
          this.triggerUpdate();
        }
      },
      deep: true
    },
    // Sync internal state with prop changes
    showCore(newVal) {
      this.internalShowCore = newVal;
    },
    showBobbin(newVal) {
      this.internalShowBobbin = newVal;
    },
    showTurns(newVal) {
      this.internalShowTurns = newVal;
    },
    // React to internal state changes
    internalShowCore(newVal) {
      if (this.coreMesh) {
        this.coreMesh.visible = newVal;
      }
    },
    internalShowBobbin(newVal) {
      if (this.bobbinMesh) {
        this.bobbinMesh.visible = newVal;
      }
    },
    internalShowTurns(newVal) {
      for (const mesh of this.turnsMeshes) {
        mesh.visible = newVal;
      }
    },
  },
  computed: {
    hasMagneticLoaded() {
      // Check if there's a valid magnetic with core data
      const core = this.magnetic?.core;
      const hasProcessedCore = core?.processedDescription?.columns?.length > 0 ||
                               core?.geometricalDescription?.length > 0;
      const hasFunctionalCore = core?.functionalDescription?.shape?.name;
      return hasProcessedCore || hasFunctionalCore;
    }
  },
  methods: {
    getTheme() {
      const style = getComputedStyle(document.body);
      return {
        primary: style.getPropertyValue('--bs-primary'),
        secondary: style.getPropertyValue('--bs-secondary'),
        success: style.getPropertyValue('--bs-success'),
        info: style.getPropertyValue('--bs-info'),
        warning: style.getPropertyValue('--bs-warning'),
        danger: style.getPropertyValue('--bs-danger'),
        light: style.getPropertyValue('--bs-light'),
        dark: style.getPropertyValue('--bs-dark'),
        white: style.getPropertyValue('--bs-white'),
      };
    },

    clearScene() {
      if (this.currentGroup) {
        this.removeObject3D(this.currentGroup);
        this.currentGroup = null;
      }
      this.coreMesh = null;
      this.bobbinMesh = null;
      this.turnsMeshes = [];
    },

    removeObject3D(object3D) {
      if (!(object3D instanceof Object3D)) return false;

      if (object3D.geometry) object3D.geometry.dispose();

      if (object3D.material) {
        if (object3D.material instanceof Array) {
          object3D.material.forEach(material => material.dispose());
        } else {
          object3D.material.dispose();
        }
      }
      
      // Recursively clean children
      while (object3D.children.length > 0) {
        this.removeObject3D(object3D.children[0]);
      }
      
      object3D.removeFromParent();
      return true;
    },

    createMaterial(hexColor, options = {}) {
      const color = hexToRgb(hexColor);
      const material = new MeshPhysicalMaterial();
      material.color.r = color.r / 255;
      material.color.g = color.g / 255;
      material.color.b = color.b / 255;
      material.specularColor.r = 0.2;
      material.specularColor.g = 0.2;
      material.specularColor.b = 0.2;
      
      if (options.metalness !== undefined) {
        material.metalness = options.metalness;
      }
      if (options.roughness !== undefined) {
        material.roughness = options.roughness;
      }
      if (options.transparent) {
        material.transparent = true;
        material.opacity = options.opacity || 0.7;
      }
      
      // Mark as raw to prevent Vue reactivity issues with Three.js objects
      return markRaw(material);
    },

    addMeshFromSTL(stlArrayBuffer, color, options = {}) {
      const scene = this.$refs.scene?.scene;
      if (!scene) return null;

      const loader = new STLLoader();
      const geometry = markRaw(loader.parse(stlArrayBuffer));
      const material = this.createMaterial(color, options);
      const mesh = markRaw(new Mesh(geometry, material));
      
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.y = 0;
      mesh.rotation.z = 0;
      
      return mesh;
    },

    fitCameraToCenteredObject(camera, object, offset, offsetY, orbitControls) {
      const boundingBox = new Box3();
      boundingBox.setFromObject(object);

      const size = new Vector3();
      boundingBox.getSize(size);

      const fov = camera.fov * (Math.PI / 180);
      const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
      let dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
      let dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
      let cameraZ = Math.max(dx, dy);
      let cameraY = size.y;

      if (offset !== undefined && offset !== 0) cameraZ *= offset;
      if (offsetY !== undefined && offsetY !== 0) cameraY *= offsetY;

      camera.position.set(0, cameraY, cameraZ);

      const minZ = boundingBox.min.z;
      const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;

      camera.far = cameraToFarEdge * 30;
      camera.updateProjectionMatrix();

      if (orbitControls !== undefined) {
        orbitControls.target = new Vector3(0, 0, 0);
        orbitControls.maxDistance = cameraToFarEdge * 20;
      }
    },

    async buildMagnetic() {
      if (this.building || !this.isMounted) return;

      const magnetic = this.magnetic;
      if (!magnetic) {
        this.updating = false;
        return;
      }

      this.clearScene();

      const core = magnetic.core;
      if (!core?.functionalDescription?.shape || !core?.functionalDescription?.material) {
        this.updating = false;
        return;
      }

      try {
        this.building = true;

        if (!this.mvbInitialized) {
          await initMvbWorker();
          this.mvbInitialized = true;
        }

        if (!this.isMounted) {
          this.building = false;
          this.updating = false;
          return;
        }

        const scene = this.$refs.scene?.scene;
        const camera = this.$refs.camera?.camera;

        if (!scene || !camera) {
          this.building = false;
          this.updating = false;
          return;
        }

        // Pass full magnetic to WASM — it runs magnetic_autocomplete_safe internally.
        // Deep-clone to strip Vue reactive proxies before postMessage.
        const mag = JSON.parse(JSON.stringify(magnetic));
        const stlOpts = { tolMm: 0.5, angTol: 0.5, binary: true };

        const group = markRaw(new Group());

        // Detect toroidal from functional shape family
        const shapeFamily = core.functionalDescription?.shape?.family?.toLowerCase() ?? '';
        const isToroidal = shapeFamily === 't' || shapeFamily === 'toroidal';

        if (this.showCore) {
          try {
            const buf = await buildCoreSTL(mag, stlOpts);
            if (buf) {
              this.coreMesh = this.addMeshFromSTL(buf, this.coreColor, { metalness: 0.1, roughness: 0.9 });
              if (this.coreMesh) { this.coreMesh.visible = this.internalShowCore; group.add(this.coreMesh); }
            }
          } catch (err) { console.warn('Could not build core:', err.message); }

          try {
            const buf = await buildSpacersSTL(mag, stlOpts);
            if (buf) {
              const m = this.addMeshFromSTL(buf, COMPONENT_COLORS.spacer, { metalness: 0.1, roughness: 0.6 });
              if (m) { m.visible = this.internalShowCore; group.add(m); }
            }
          } catch (err) { /* no spacers — normal */ }
        }

        const coil = magnetic.coil || {};
        const isDummyBobbin = coil.bobbin === 'Dummy' || coil.bobbin === '' || coil.bobbin == null;
        const hasBobbinData = coil.bobbin?.processedDescription &&
          Object.keys(coil.bobbin.processedDescription).length > 0;

        if (this.showBobbin && !isToroidal && !isDummyBobbin && hasBobbinData) {
          try {
            const buf = await buildBobbinSTL(mag, stlOpts);
            if (buf) {
              this.bobbinMesh = this.addMeshFromSTL(buf, this.bobbinColor, { metalness: 0.1, roughness: 0.7 });
              if (this.bobbinMesh) { this.bobbinMesh.visible = this.internalShowBobbin; group.add(this.bobbinMesh); }
            }
          } catch (err) { console.warn('Could not build bobbin:', err.message); }
        }

        const hasTurnsData = coil.turnsDescription?.length > 0;
        const hasPlanarWires = coil.functionalDescription?.some(
          w => w?.wire?.type?.toLowerCase() === 'planar'
        );
        const shouldBuildFR4 = coil.groupsDescription?.some(
          g => g.type === 'Printed' || g.type?.toLowerCase() === 'printed'
        ) || hasPlanarWires;

        if (this.showTurns && shouldBuildFR4) {
          try {
            const buf = await buildFR4BoardSTL(mag, stlOpts);
            if (buf) {
              const m = this.addMeshFromSTL(buf, COATING_COLORS.fr4, { metalness: 0.0, roughness: 0.8, transparent: true, opacity: 0.4 });
              if (m) { m.visible = this.internalShowTurns; group.add(m); this.turnsMeshes.push(m); }
            }
          } catch (err) { console.warn('Could not build FR4 boards:', err.message); }
        }

        if (this.showTurns && hasTurnsData) {
          try {
            const buf = await buildTurnsSTL(mag, stlOpts);
            if (buf) {
              const m = this.addMeshFromSTL(buf, this.turnsColor, { metalness: 0.2, roughness: 0.6 });
              if (m) { m.visible = this.internalShowTurns; group.add(m); this.turnsMeshes.push(m); }
            }
          } catch (err) { console.warn('Could not build turns:', err.message); }
        }

        // Add group to scene
        if (group.children.length > 0) {
          scene.add(group);
          this.currentGroup = group;
          this.fitCameraToCenteredObject(camera, group, this.offset, 1.5);
        }

        this.$emit("buildComplete");

      } catch (error) {
        console.error('Error building magnetic:', error);
        this.$emit("errorInDimensions");
      } finally {
        if (this.isMounted) {
          this.building = false;
          this.updating = false;
        }
      }
    },

    tryToSend() {
      if (!this.tryingToSend) {
        this.recentChange = false;
        this.tryingToSend = true;
        setTimeout(() => {
          if (!this.isMounted) {
            this.tryingToSend = false;
            return;
          }
          if (this.recentChange) {
            this.tryingToSend = false;
            this.tryToSend();
          } else {
            this.tryingToSend = false;
            this.buildMagnetic();
          }
        }, this.$settingsStore?.waitingTimeForPlottingAfterChange || 500);
      }
    },

    triggerUpdate() {
      this.updating = true;
      this.clearScene();
      this.currentMagnetic = deepCopy(this.magnetic);
      this.tryToSend();
    },
  },

  mounted() {
    this.isMounted = true;
    this.tryToSend();
  },

  beforeUnmount() {
    this.isMounted = false;
    this.clearScene();
  },
};
</script>

<template>
  <div class="magnetic-3d-visualizer-container">
    <img 
      :data-cy="`${dataTestLabel}-loading`" 
      v-if="updating" 
      class="loading-overlay" 
      alt="loading" 
      :src="loadingGif"
    >
    <Renderer 
      :data-cy="`${dataTestLabel}-canvas`" 
      ref="renderer" 
      resize=true 
      :orbit-ctrl="{ enableDamping: true, dampingFactor: 0.05, autoRotate: true }" 
      shadow 
      class="p-0 m-0"
    >
      <Camera ref="camera" />
      <Scene ref="scene" :background="backgroundColor">
        <SpotLight :color="'white'" :intensity="50" :position="{ y: 150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
        <SpotLight :color="'white'" :intensity="50" :position="{ y: -150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
        <SpotLight :color="'white'" :intensity="50" :position="{ x: 150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
        <SpotLight :color="'white'" :intensity="50" :position="{ x: -150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
      </Scene>
    </Renderer>

    <!-- Visibility toggle buttons below canvas -->
    <div class="visibility-controls" v-if="!updating && hasMagneticLoaded">
      <button 
        :class="['btn btn-sm visibility-btn', internalShowCore ? 'active' : '']"
        :style="{ color: buttonColor, borderColor: buttonColor }"
        @click="internalShowCore = !internalShowCore"
        title="Toggle Core visibility"
      >
        <i :class="['bi', internalShowCore ? 'bi-eye' : 'bi-eye-slash']"></i> Core
      </button>
      <button 
        :class="['btn btn-sm visibility-btn', internalShowBobbin ? 'active' : '']"
        :style="{ color: buttonColor, borderColor: buttonColor }"
        @click="internalShowBobbin = !internalShowBobbin"
        title="Toggle Bobbin visibility"
      >
        <i :class="['bi', internalShowBobbin ? 'bi-eye' : 'bi-eye-slash']"></i> Bobbin
      </button>
      <button 
        :class="['btn btn-sm visibility-btn', internalShowTurns ? 'active' : '']"
        :style="{ color: buttonColor, borderColor: buttonColor }"
        @click="internalShowTurns = !internalShowTurns"
        title="Toggle Turns visibility"
      >
        <i :class="['bi', internalShowTurns ? 'bi-eye' : 'bi-eye-slash']"></i> Turns
      </button>
    </div>
  </div>
</template>

<style scoped>
.magnetic-3d-visualizer-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  height: auto;
  max-width: 100%;
}

.visibility-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0;
  background: transparent;
  z-index: 5;
}

.visibility-controls .btn {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.visibility-btn {
  background: transparent;
}

.visibility-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.visibility-btn.active {
}

.visibility-btn:not(.active) {
}
</style>

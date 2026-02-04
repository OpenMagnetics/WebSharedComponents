<script setup>
import { markRaw } from 'vue';
import { MeshPhysicalMaterial, Object3D, Group, Mesh, Box3, Vector3 } from 'three';
import { Camera, Renderer, SpotLight, Scene, AmbientLight } from 'troisjs';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { deepCopy, hexToRgb } from '../assets/js/utils.js';
import { waitForMkf } from '../assets/js/mkfRuntime.js';
import { initMvbWorker, buildCoreSTL, buildSpacersSTL, buildBobbinSTL, buildTurnSTL, buildFR4BoardSTL, terminateWorker } from '../assets/js/mvbRuntime.js';
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
      const material = coating.material?.toLowerCase();
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
      if (this.building) return;
      
      const magnetic = this.magnetic;
      if (!magnetic) {
        this.updating = false;
        return;
      }

      // Clear scene before building new magnetic to prevent old designs from persisting
      this.clearScene();

      // Need core data with shape and material
      const core = magnetic.core;
      if (!core?.functionalDescription?.shape || !core?.functionalDescription?.material) {
        this.updating = false;
        return;
      }

      try {
        this.building = true;

        // Initialize MVB worker if needed
        if (!this.mvbInitialized) {
          await initMvbWorker();
          this.mvbInitialized = true;
        }

        // Get MKF to compute core data
        const mkf = await waitForMkf();
        
        // Prepare core data
        const coreAux = deepCopy(core);
        coreAux.geometricalDescription = null;
        coreAux.processedDescription = null;
        
        if (typeof coreAux.functionalDescription.shape === 'string') {
          coreAux.functionalDescription.shape = JSON.parse(
            await mkf.get_shape_data(coreAux.functionalDescription.shape)
          );
        }

        if (coreAux.functionalDescription.shape?.familySubtype) {
          coreAux.functionalDescription.shape.familySubtype = 
            String(coreAux.functionalDescription.shape.familySubtype);
        }

        const coreResult = await mkf.calculate_core_data(JSON.stringify(coreAux), false);
        
        if (coreResult.startsWith("Exception")) {
          console.error(coreResult);
          this.$emit("errorInDimensions");
          this.building = false;
          this.updating = false;
          return;
        }

        const processedCore = JSON.parse(coreResult);
        
        // Build components in scene
        const scene = this.$refs.scene?.scene;
        const camera = this.$refs.camera?.camera;
        
        if (!scene || !camera) {
          this.building = false;
          this.updating = false;
          return;
        }

        const group = markRaw(new Group());
        const stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true };

        // Build core - only if core data is valid
        const isCoreValid = processedCore.geometricalDescription?.length > 0;
        if (this.showCore && isCoreValid) {
          try {
            const coreArrayBuffer = await buildCoreSTL(processedCore.geometricalDescription, stlOptions);
            
            if (coreArrayBuffer) {
              this.coreMesh = this.addMeshFromSTL(coreArrayBuffer, this.coreColor, {
                metalness: 0.1,
                roughness: 0.9
              });
              if (this.coreMesh) {
                this.coreMesh.visible = this.internalShowCore;
                group.add(this.coreMesh);
              }
            }
          } catch (err) {
            console.warn('Could not build core:', err.message);
          }

          // Build spacers separately (different color)
          try {
            const spacersArrayBuffer = await buildSpacersSTL(processedCore.geometricalDescription, stlOptions);
            
            if (spacersArrayBuffer) {
              const spacersMesh = this.addMeshFromSTL(spacersArrayBuffer, COMPONENT_COLORS.spacer, {
                metalness: 0.1,
                roughness: 0.6
              });
              if (spacersMesh) {
                spacersMesh.visible = this.internalShowCore;
                group.add(spacersMesh);
              }
            }
          } catch (err) {
            console.warn('Could not build spacers:', err.message);
          }
        }

        // Check if toroidal
        const isToroidal = processedCore.geometricalDescription?.some(
          part => part.type === 'toroidal' || part.shape?.family?.toLowerCase() === 't'
        );

        // Build bobbin - only if valid, not toroidal, and not a dummy bobbin
        const coil = magnetic.coil || {};
        const isDummyBobbin = coil.bobbin === "Dummy" || coil.bobbin === "" || coil.bobbin == null;
        const hasBobbinData = coil.bobbin?.processedDescription && Object.keys(coil.bobbin.processedDescription).length > 0;
        
        if (this.showBobbin && !isToroidal && !isDummyBobbin && hasBobbinData) {
          try {
            // Deep clone to remove Vue reactivity and circular references
            const bobbinProcessed = JSON.parse(JSON.stringify(coil.bobbin.processedDescription));
            const bobbinArrayBuffer = await buildBobbinSTL(bobbinProcessed, stlOptions);
              
            if (bobbinArrayBuffer) {
              this.bobbinMesh = this.addMeshFromSTL(bobbinArrayBuffer, this.bobbinColor, {
                metalness: 0.1,
                roughness: 0.7
              });
              if (this.bobbinMesh) {
                this.bobbinMesh.visible = this.internalShowBobbin;
                group.add(this.bobbinMesh);
              }
            }
          } catch (err) {
            console.warn('Could not build bobbin:', err.message);
          }
        }

        // Build turns - only if coil.turnsDescription is not null, has data, and bobbin data is valid
        const hasTurnsData = coil.turnsDescription != null && coil.turnsDescription.length > 0;
        const hasValidBobbinForTurns = coil.bobbin?.processedDescription && 
          coil.bobbin.processedDescription.columnDepth !== undefined &&
          coil.bobbin.processedDescription.columnWidth !== undefined;
        
        // Check if any wire is planar type (as fallback if groupsDescription type isn't set correctly)
        const hasPlanarWires = coil.functionalDescription?.some(
          winding => winding?.wire?.type?.toLowerCase() === 'planar'
        );
        
        // Build FR4 boards for planar transformer groups
        const hasGroupsDescription = coil.groupsDescription != null && coil.groupsDescription.length > 0;
        
        if (this.showTurns && hasGroupsDescription && hasValidBobbinForTurns) {
          try {
            const bobbinProcessed = JSON.parse(JSON.stringify(coil.bobbin.processedDescription));
            
            for (let i = 0; i < coil.groupsDescription.length; i++) {
              const groupDesc = coil.groupsDescription[i];
              
              // Build FR4 for PCB/planar groups:
              // - Explicit type === "Printed"
              // - OR hasPlanarWires as fallback (MKF might not set type correctly)
              const shouldBuildFR4 = groupDesc.type === "Printed" || hasPlanarWires;
              
              if (shouldBuildFR4) {
                try {
                  // Deep clone groupDesc to remove Vue reactivity (required for Worker postMessage)
                  const groupDescClone = JSON.parse(JSON.stringify(groupDesc));
                  const fr4ArrayBuffer = await buildFR4BoardSTL(
                    groupDescClone,
                    bobbinProcessed,
                    null, // Use default board thickness from group
                    hasPlanarWires // forceBuild = true if planar wires detected
                  );
                  
                  if (fr4ArrayBuffer) {
                    const fr4Mesh = this.addMeshFromSTL(fr4ArrayBuffer, COATING_COLORS.fr4, {
                      metalness: 0.0,
                      roughness: 0.8,
                      transparent: true,
                      opacity: 0.4
                    });
                    if (fr4Mesh) {
                      fr4Mesh.visible = this.internalShowTurns;
                      group.add(fr4Mesh);
                      this.turnsMeshes.push(fr4Mesh);
                    }
                  }
                } catch (err) {
                  console.warn(`Could not build FR4 board for group ${i}:`, err.message);
                  console.error(err);
                }
              }
            }
          } catch (err) {
            console.warn('Could not build FR4 boards:', err.message);
          }
        }
        
        if (this.showTurns && hasTurnsData && hasValidBobbinForTurns) {
          try {
            // Deep clone to remove Vue reactivity and circular references
            const turnsData = JSON.parse(JSON.stringify(coil.turnsDescription));
            const bobbinProcessed = JSON.parse(JSON.stringify(coil.bobbin.processedDescription));
            
            for (let i = 0; i < turnsData.length; i++) {
              const turnData = turnsData[i];
              const windingIndex = turnData.windingIndex || 0;
              const turnColor = getWireColorFromCoating(turnData, coil, windingIndex);
              
              try {
                const turnArrayBuffer = await buildTurnSTL(
                  turnData, 
                  turnData, // wireDesc same as turnData for now
                  bobbinProcessed, 
                  isToroidal, 
                  stlOptions
                );
                
                if (turnArrayBuffer) {
                  const turnMesh = this.addMeshFromSTL(turnArrayBuffer, turnColor, {
                    metalness: 0.2,
                    roughness: 0.6
                  });
                  if (turnMesh) {
                    turnMesh.visible = this.internalShowTurns;
                    group.add(turnMesh);
                    this.turnsMeshes.push(turnMesh);
                  }
                }
              } catch (err) {
                console.warn(`Could not build turn ${i}:`, err.message);
              }
            }
          } catch (err) {
            console.warn('Could not build turns:', err.message);
          }        } else if (this.showTurns && hasTurnsData && !hasValidBobbinForTurns) {
          console.warn('Cannot build turns: missing valid bobbin processedDescription');        }

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
        this.building = false;
        this.updating = false;
      }
    },

    tryToSend() {
      if (!this.tryingToSend) {
        this.recentChange = false;
        this.tryingToSend = true;
        setTimeout(() => {
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
    this.tryToSend();
  },

  beforeUnmount() {
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
        @click="internalShowCore = !internalShowCore"
        title="Toggle Core visibility"
      >
        <i :class="['bi', internalShowCore ? 'bi-eye' : 'bi-eye-slash']"></i> Core
      </button>
      <button 
        :class="['btn btn-sm visibility-btn', internalShowBobbin ? 'active' : '']"
        @click="internalShowBobbin = !internalShowBobbin"
        title="Toggle Bobbin visibility"
      >
        <i :class="['bi', internalShowBobbin ? 'bi-eye' : 'bi-eye-slash']"></i> Bobbin
      </button>
      <button 
        :class="['btn btn-sm visibility-btn', internalShowTurns ? 'active' : '']"
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
  color: white;
  border-color: white;
  background: transparent;
}

.visibility-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.visibility-btn.active {
  color: white;
  border-color: white;
}

.visibility-btn:not(.active) {
  color: rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 0.5);
}
</style>

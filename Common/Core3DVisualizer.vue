<script setup>
import { FileLoader, MeshPhysicalMaterial, Object3D, MathUtils, MeshBasicMaterial, Mesh, BoxGeometry, MeshStandardMaterial, LoadingManager, TextureLoader, PointLight, Box3, Vector3} from 'three';
import {Camera, EffectComposer, InstancedMesh, PhongMaterial, Renderer, RenderPass, SphereGeometry, SpotLight, Scene, UnrealBloomPass, AmbientLight} from 'troisjs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clean, deepCopy, hexToRgb } from '../assets/js/utils.js'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
</script>

<script>

export default {
    emits: ["errorInDimensions"],
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        core: {
            type: Object,
            required: true,
        },
        fullCoreModel: {
            type: Boolean,
            default: true,
        },
        offset: {
            type: Number,
            default: 1,
        },
        loadingGif: {
            type: String,
            default: "/images/loading.gif",
        },
        backgroundColor: {
            type: String,
            default: "#1a1a1a",
        },
    },
    components: {
        Camera,
        EffectComposer,
        InstancedMesh,
        PhongMaterial,
        Renderer,
        RenderPass,
        SphereGeometry,
        SpotLight,
        Scene,
        AmbientLight,
    },
    data() {
        const current3dObject = null
        const posting = false
        const updating = false
        const recentChange = false
        const tryingToSend = false
        const style = getComputedStyle(document.body);
        const currentCore = null;

        const theme = {
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
        return {
            current3dObject,
            posting,
            updating,
            recentChange,
            tryingToSend,
            theme,
            currentCore,
        }
    },
    watch: {
        'core': {
            handler(newValue, oldValue) {
                if (JSON.stringify(newValue) !== JSON.stringify(this.currentCore)) {
                    this.tryToSend();
                    this.updating = true;
                    this.removeObject3D(this.current3dObject);
                    this.currentCore = deepCopy(newValue);
                }
            },
          deep: true
        }
    },
    methods: {
        base64ToArrayBuffer(base64) {
            var binaryString = atob(base64);
            var bytes = new Uint8Array(binaryString.length);
            for (var i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        },
        removeObject3D(object3D) {
            if (!(object3D instanceof Object3D)) return false;

            // for better memory management and performance
            if (object3D.geometry) object3D.geometry.dispose();

            if (object3D.material) {
                if (object3D.material instanceof Array) {
                    // for better memory management and performance
                    object3D.material.forEach(material => material.dispose());
                } else {
                    // for better memory management and performance
                    object3D.material.dispose();
                }
            }
            object3D.removeFromParent(); // the parent might be the scene or another Object3D, but it is sure to be removed this way
            return true;
        },
        getPiece(sourceObject) {            
            const scene = this.$refs.scene.scene;
            const camera = this.$refs.camera.camera;
            const loader = new STLLoader()

            const geometry = loader.parse(this.base64ToArrayBuffer(sourceObject));
            const color = hexToRgb("#7b7c7d")
            const material = new MeshPhysicalMaterial()
            material.color.r = color.r / 255
            material.color.g = color.g / 255
            material.color.b = color.b / 255
            material.specularColor.r = 0.2
            material.specularColor.g = 0.2
            material.specularColor.b = 0.2
            const mesh = new Mesh(geometry, material)
            mesh.rotation.x = -Math.PI / 2
            mesh.rotation.y = 0
            mesh.rotation.z = 0

            scene.add(mesh)
            this.current3dObject = mesh
            if (this.fullCoreModel) {
                this.fitCameraToCenteredObject(camera, mesh, this.offset, 1.5)
            }
            else {

                if (this.core['functionalDescription']['shape']['family'] == 't') {
                    this.fitCameraToCenteredObject(camera, mesh, 1, 1.5)
                }
                else {
                    this.fitCameraToCenteredObject(camera, mesh, 1, 3)
                }
            }

        },
        fitCameraToCenteredObject(camera, object, offset, offsetY, orbitControls) {
            const boundingBox = new Box3();
            boundingBox.setFromObject( object );

            var middle = new Vector3();
            var size = new Vector3();
            boundingBox.getSize(size);

            // figure out how to fit the box in the view:
            // 1. figure out horizontal FOV (on non-1.0 aspects)
            // 2. figure out distance from the object in X and Y planes
            // 3. select the max distance (to fit both sides in)
            //
            // The reason is as follows:
            //
            // Imagine a bounding box (BB) is centered at (0,0,0).
            // Camera has vertical FOV (camera.fov) and horizontal FOV
            // (camera.fov scaled by aspect, see fovh below)
            //
            // Therefore if you want to put the entire object into the field of view,
            // you have to compute the distance as: z/2 (half of Z size of the BB
            // protruding towards us) plus for both X and Y size of BB you have to
            // figure out the distance created by the appropriate FOV.
            //
            // The FOV is always a triangle:
            //
            //  (size/2)
            // +--------+
            // |       /
            // |      /
            // |     /
            // | F° /
            // |   /
            // |  /
            // | /
            // |/
            //
            // F° is half of respective FOV, so to compute the distance (the length
            // of the straight line) one has to: `size/2 / Math.tan(F)`.
            //
            // FTR, from https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
            // the camera.fov is the vertical FOV.

            const fov = camera.fov * ( Math.PI / 180 );
            const fovh = 2*Math.atan(Math.tan(fov/2) * camera.aspect);
            let dx = size.z / 2 + Math.abs( size.x / 2 / Math.tan( fovh / 2 ) );
            let dy = size.z / 2 + Math.abs( size.y / 2 / Math.tan( fov / 2 ) );
            let cameraZ = Math.max(dx, dy);
            let cameraY = size.y;

            // offset the camera, if desired (to avoid filling the whole canvas)
            if( offset !== undefined && offset !== 0 ) cameraZ *= offset;
            if( offsetY !== undefined && offsetY !== 0 ) cameraY *= offsetY;

            camera.position.set( 0, cameraY, cameraZ );

            // set the far plane of the camera so that it easily encompasses the whole object
            const minZ = boundingBox.min.z;
            const cameraToFarEdge = ( minZ < 0 ) ? -minZ + cameraZ : cameraZ - minZ;

            camera.far = cameraToFarEdge * 30;
            camera.updateProjectionMatrix();

            if ( orbitControls !== undefined ) {
                // set camera to rotate around the center
                orbitControls.target = new THREE.Vector3(0, 0, 0);

                // prevent camera from zooming out far enough to create far plane cutoff
                orbitControls.maxDistance = cameraToFarEdge * 20;
            }
        },
        computeShape() {
            if (!this.posting && this.core['functionalDescription']['shape'] != "") {
                this.$mkf.ready.then(_ => {

                    const aux = deepCopy(this.core);
                    aux['geometricalDescription'] = null;
                    aux['processedDescription'] = null;
                    if (typeof(aux['functionalDescription']['shape']) == "string") {
                        aux['functionalDescription']['shape'] = JSON.parse(this.$mkf.get_shape_data(aux['functionalDescription']['shape']));

                    }


                    if ('familySubtype' in aux['functionalDescription']['shape']){
                        aux['functionalDescription']['shape']['familySubtype'] = String(aux['functionalDescription']['shape']['familySubtype']);
                    }
                    var core = JSON.parse(this.$mkf.calculate_core_data(JSON.stringify(aux), false));
                    this.posting = true;

                    var url;
                    var data;
                    if (this.fullCoreModel) {
                        data = core;
                        url = import.meta.env.VITE_API_ENDPOINT + '/core_compute_core_3d_model';
                    }
                    else {
                        data = core.functionalDescription.shape;
                        url = import.meta.env.VITE_API_ENDPOINT + '/core_compute_shape';
                    }

                    this.hasFreeCADError = false;
                    this.removeObject3D(this.current3dObject);
                    core = clean(core);

                    if (core.functionalDescription.gapping == undefined) {
                        core.functionalDescription.gapping = []
                    }

                    this.$axios.post(url, data)
                    .then(response => {
                        this.posting = false
                        this.updating = false
                        this.getPiece(response.data);
                    })
                    .catch(error => {
                        this.posting = false
                        this.updating = false
                        this.hasFreeCADError = true
                        console.error(error);
                        this.$emit("errorInDimensions");
                    });

                }).catch(error => {
                    console.error(error);
                });
            }
        },

        tryToSend() {
            if (!this.tryingToSend) {
                this.recentChange = false
                this.tryingToSend = true
                setTimeout(() => {
                    if (!this.hasError) {
                        if (this.recentChange) {
                            this.tryingToSend = false
                            this.tryToSend()
                        }
                        else {
                            this.tryingToSend = false
                            this.computeShape()
                        }
                    }
                }
                , this.$settingsStore.waitingTimeForPlottingAfterChange);
            }
        },

    },
    mounted() {
        this.tryToSend();
    },
    computed: {
    },
};
</script>

<template>
    <img data-cy="CoreShapeArtisanVisualizer-loading" v-if="updating" class="mx-auto d-block col-12" alt="loading" style="height: auto;" :src="loadingGif">
    <Renderer  data-cy="CoreShapeArtisanVisualizer-canvas" ref="renderer" resize=true :orbit-ctrl="{ enableDamping: true, dampingFactor: 0.05, autoRotate : true }" shadow class="p-0 m-0">
        <Camera ref="camera" />
        <Scene ref="scene" :background="backgroundColor">
            <SpotLight :color="'white'" :intensity="50" :position="{ y: 150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
            <SpotLight :color="'white'" :intensity="50" :position="{ y: -150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
            <SpotLight :color="'white'" :intensity="50" :position="{ x: 150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
            <SpotLight :color="'white'" :intensity="50" :position="{ x: -150, z: 100 }" :cast-shadow="true" :shadow-map-size="{ width: 1024, height: 1024 }" />
        </Scene>
    </Renderer>
</template>

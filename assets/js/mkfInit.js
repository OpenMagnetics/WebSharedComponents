// mkfInit.js - Helper to initialize MKF in either main-thread or worker mode
import { initWorker, setMkf, waitForMkf, isWorkerMode } from '/WebSharedComponents/assets/js/mkfRuntime';

/**
 * Initialize MKF WASM module
 * @param {Object} options Configuration options
 * @param {boolean} options.useWorker - Whether to use Web Worker (non-blocking) mode
 * @param {Function} options.onReady - Callback when MKF is ready
 * @param {Function} options.onProgress - Callback for loading progress
 * @param {Object} options.app - Vue app instance (for setting $mkf)
 * @param {string} options.baseUrl - Base URL for assets
 * @returns {Promise<Object>} The MKF instance/proxy
 */
export async function initMkf(options = {}) {
    const {
        useWorker = false,
        onReady = () => {},
        onProgress = () => {},
        app = null,
        baseUrl = '/',
    } = options;

    let mkf;

    if (useWorker) {
        // Worker mode - non-blocking
        onProgress('Initializing Web Worker...');
        
        const wasmJsUrl = new URL('/src/assets/js/libMKF.wasm.js', window.location.origin).href;
        mkf = await initWorker(wasmJsUrl);
        
        if (app) {
            app.config.globalProperties.$mkf = mkf;
        }
        
        onProgress('Loading data...');
        // Data loading happens async in worker
        
    } else {
        // Main-thread mode - legacy behavior
        onProgress('Loading WASM module...');
        
        // Dynamic import to avoid loading if using worker
        const { default: Module } = await import('/src/assets/js/libMKF.wasm.js');
        
        mkf = await new Promise((resolve) => {
            Module({
                onRuntimeInitialized() {
                    const instance = Object.assign(this, {
                        ready: Promise.resolve()
                    });
                    setMkf(instance);
                    resolve(instance);
                }
            });
        });
        
        if (app) {
            app.config.globalProperties.$mkf = mkf;
        }
    }

    onReady(mkf);
    return mkf;
}

/**
 * Load MKF data files (core materials, shapes, wires, etc.)
 * Works in both main-thread and worker modes
 * @param {Object} mkf - MKF instance or proxy
 * @param {Object} options - Loading options
 */
export async function loadMkfData(mkf, options = {}) {
    const {
        baseUrl = '/',
        loadAllParts = true,
        loadExternalParts = false,
        settingsStore = null,
        onProgress = () => {},
    } = options;

    // In worker mode, all calls are already async
    // In main-thread mode, they block but return immediately
    
    try {
        onProgress('Loading core materials...');
        const coreMaterialsData = await fetch(`${baseUrl}core_materials.ndjson`).then(r => r.text());
        if (loadAllParts) {
            await mkf.load_core_materials("");
        }
        if (loadExternalParts && !coreMaterialsData.startsWith("<")) {
            await mkf.load_core_materials(coreMaterialsData);
        }
    } catch (error) {
        console.error('Error loading core materials:', error);
    }

    try {
        onProgress('Loading core shapes...');
        const coreShapesData = await fetch(`${baseUrl}core_shapes.ndjson`).then(r => r.text());
        if (loadAllParts) {
            await mkf.load_core_shapes("");
        }
        if (loadExternalParts && !coreShapesData.startsWith("<")) {
            await mkf.load_core_shapes(coreShapesData);
        }
    } catch (error) {
        console.error('Error loading core shapes:', error);
    }

    try {
        onProgress('Loading wires...');
        const wiresData = await fetch(`${baseUrl}wires.ndjson`).then(r => r.text()).catch(() => 
            fetch(`${baseUrl}lab_osma_wires.ndjson`).then(r => r.text())
        );
        if (loadAllParts) {
            await mkf.load_wires("");
        }
        if (loadExternalParts && !wiresData.startsWith("<")) {
            await mkf.load_wires(wiresData);
        }
    } catch (error) {
        console.error('Error loading wires:', error);
    }

    try {
        onProgress('Loading cores...');
        const coresData = await fetch(`${baseUrl}lab_osma_cores.ndjson`).then(r => r.text()).catch(() => null);
        if (coresData && loadExternalParts && !coresData.startsWith("<") && settingsStore) {
            await mkf.load_cores(
                coresData, 
                settingsStore.adviserSettings?.allowToroidalCores ?? true, 
                settingsStore.adviserSettings?.useOnlyCoresInStock ?? false
            );
        }
    } catch (error) {
        // This file may not exist in all builds
        console.debug('No cores data found:', error);
    }

    onProgress('Ready!');
}

/**
 * Check if MKF is ready
 */
export async function isMkfReady() {
    try {
        const mkf = await waitForMkf();
        return mkf != null;
    } catch {
        return false;
    }
}

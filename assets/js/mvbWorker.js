// src/assets/js/mvbWorker.js
// Web Worker for MVB.js (OpenMagnetics Virtual Builder)
// Runs OpenCASCADE/Replicad WASM in a separate thread to avoid blocking the main UI
//
// This worker imports all dependencies directly - ES modules work in modern browsers.

import * as Comlink from 'comlink';

let OC = null;
let replicadModule = null;
let builder = null;
let getCoreFn = null;
let getSpacersFn = null;
let isReady = false;
let initError = null;
let resolveReadyPromise;
const readyPromise = new Promise(resolve => { resolveReadyPromise = resolve; });

/**
 * Initialize OpenCASCADE and Replicad in the worker
 * This is called automatically when the worker starts, or can be called
 * manually from the main thread to get initialization status.
 */
async function init() {
    if (isReady) return { success: true, message: 'Already initialized' };
    if (initError) throw initError;

    console.log('[MVB Worker] Initializing OpenCASCADE...');

    try {
        // Import all dependencies directly in the worker
        const [opencascadeModule, replicad, mvb] = await Promise.all([
            import('replicad-opencascadejs/src/replicad_single.js'),
            import('replicad'),
            import('@openmagnetics/magnetic-virtual-builder')
        ]);
        
        // Get WASM URL - Vite handles this with ?url suffix
        const wasmUrlModule = await import('replicad-opencascadejs/src/replicad_single.wasm?url');
        const wasmUrl = wasmUrlModule.default;

        // Initialize OpenCASCADE with WASM
        const opencascadeFactory = opencascadeModule.default;
        OC = await opencascadeFactory({
            locateFile: () => wasmUrl
        });

        // Store replicad module and set OpenCASCADE
        replicadModule = replicad;
        replicad.setOC(OC);
        
        // Store MVB exports
        getCoreFn = mvb.getCore;
        getSpacersFn = mvb.getSpacers;

        // Create builder instance
        builder = new mvb.ReplicadBuilder(replicadModule);

        isReady = true;
        resolveReadyPromise({ success: true });
        console.log('[MVB Worker] Initialized successfully');
        
        return { success: true, message: 'Initialized successfully' };
    } catch (error) {
        console.error('[MVB Worker] Initialization failed:', error);
        initError = error;
        throw error;
    }
}

/**
 * Wait for worker to be ready
 */
async function waitReady() {
    if (initError) throw initError;
    return readyPromise;
}

/**
 * Check if the worker is ready
 */
function isInitialized() {
    return isReady;
}

/**
 * Build core geometry from geometrical description
 * @param {Array} geometricalDescription
 * @returns {ArrayBuffer} STL data
 */
async function buildCore(geometricalDescription, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    await waitReady();
    
    const shape = getCoreFn(replicadModule, geometricalDescription);
    
    if (!shape) return null;
    
    const blob = shape.blobSTL(stlOptions);
    return await blob.arrayBuffer();
}

/**
 * Build spacers geometry from geometrical description
 * Spacers are built separately so they can be rendered with a different color.
 * @param {Array} geometricalDescription
 * @returns {ArrayBuffer} STL data or null if no spacers
 */
async function buildSpacers(geometricalDescription, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    await waitReady();
    
    const shape = getSpacersFn(replicadModule, geometricalDescription);
    
    if (!shape) return null;
    
    const blob = shape.blobSTL(stlOptions);
    return await blob.arrayBuffer();
}

/**
 * Build bobbin geometry
 * @param {Object} bobbinProcessed
 * @returns {ArrayBuffer} STL data
 */
async function buildBobbin(bobbinProcessed, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    await waitReady();
    
    const shape = builder.getBobbin(bobbinProcessed);
    
    if (!shape) return null;
    
    const blob = shape.blobSTL(stlOptions);
    return await blob.arrayBuffer();
}

/**
 * Build turn geometry
 * @param {Object} turnDesc
 * @param {Object} wireDesc
 * @param {Object} bobbinProcessed
 * @param {boolean} isToroidal
 * @returns {ArrayBuffer} STL data
 */
async function buildTurn(turnDesc, wireDesc, bobbinProcessed, isToroidal, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    await waitReady();
    
    const shape = builder.getTurn(turnDesc, wireDesc, bobbinProcessed, isToroidal);
    
    if (!shape) return null;
    
    const blob = shape.blobSTL(stlOptions);
    return await blob.arrayBuffer();
}

/**
 * Build FR4 board geometry for planar transformers
 * @param {Object} groupDesc - Group description data
 * @param {Object} bobbinProcessed - Bobbin processed description
 * @param {number} boardThickness - Optional board thickness override
 * @param {boolean} forceBuild - If true, skip PCB type check
 * @param {Object} stlOptions - STL export options
 * @returns {ArrayBuffer} STL data or null if not a PCB group
 */
async function buildFR4Board(groupDesc, bobbinProcessed, boardThickness, forceBuild = false, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    await waitReady();
    
    const shape = builder.getFR4Board(groupDesc, bobbinProcessed, boardThickness, forceBuild);
    
    if (!shape) {
        return null;
    }
    
    const blob = shape.blobSTL(stlOptions);
    const buffer = await blob.arrayBuffer();
    return buffer;
}

/**
 * Build complete magnetic assembly
 * @param {Object} magneticData - Full magnetic data with core, coil, etc.
 * @param {string} projectName - Project name for export
 * @returns {ArrayBuffer} STL data
 */
async function buildMagnetic(magneticData, projectName, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    await waitReady();
    
    const shape = builder.getMagnetic(magneticData, projectName);
    
    if (!shape) return null;
    
    const blob = shape.blobSTL(stlOptions);
    return await blob.arrayBuffer();
}

/**
 * Generic method caller for any builder method
 */
async function callBuilderMethod(methodName, ...args) {
    await waitReady();
    
    if (typeof builder[methodName] !== 'function') {
        throw new Error(`Unknown builder method: ${methodName}`);
    }
    
    return builder[methodName](...args);
}

// Expose API via Comlink
Comlink.expose({
    init,
    waitReady,
    isInitialized,
    buildCore,
    buildSpacers,
    buildBobbin,
    buildTurn,
    buildFR4Board,
    buildMagnetic,
    callBuilderMethod
});

// Auto-initialize when worker starts
init().catch(err => {
    console.error('[MVB Worker] Auto-init failed:', err);
});

// src/assets/js/mvbRuntime.js
// Runtime for MVB.js (OpenMagnetics Virtual Builder) with Web Worker support
// Runs OpenCASCADE/replicad in a background thread to avoid blocking the main UI
//
// REQUIRED DEPENDENCIES (must be installed in main project):
// - replicad
// - replicad-opencascadejs  
// - open-magnetics-virtual-builder (MVB.js)
// - comlink

import * as Comlink from 'comlink';

let worker = null;
let workerApi = null;
let isInitialized = false;
let initPromise = null;

/**
 * Initialize MVB in a Web Worker
 * OpenCASCADE WASM runs in a background thread to avoid blocking the main UI.
 * @returns {Promise<Object>} Comlink-wrapped API object with build methods
 */
export async function initMvbWorker() {
    // Return existing promise if initialization is in progress
    if (initPromise) {
        return initPromise;
    }
    
    // Return existing API if already initialized
    if (isInitialized && workerApi) {
        return workerApi;
    }
    
    initPromise = (async () => {
        console.log('[MVB Runtime] Starting Web Worker...');
        
        try {
            // Create the worker with module type for ES module imports
            // The ?worker&url suffix tells Vite to handle this as a worker
            const WorkerConstructor = await import('./mvbWorker.js?worker');
            worker = new WorkerConstructor.default();
            
            // Wrap with Comlink
            workerApi = Comlink.wrap(worker);
            
            // Wait for worker to initialize OpenCASCADE
            console.log('[MVB Runtime] Waiting for OpenCASCADE initialization...');
            await workerApi.waitReady();
            
            isInitialized = true;
            console.log('[MVB Runtime] Worker initialized successfully');
            
            return workerApi;
        } catch (error) {
            console.error('[MVB Runtime] Worker initialization failed:', error);
            initPromise = null;
            throw error;
        }
    })();
    
    return initPromise;
}

/**
 * Wait for MVB worker to be ready
 * @returns {Promise<Object>} API object with build methods
 */
export async function waitForMvb() {
    if (!initPromise) {
        return initMvbWorker();
    }
    return initPromise;
}

/**
 * Terminate the worker
 */
export function terminateWorker() {
    if (worker) {
        worker.terminate();
        worker = null;
        workerApi = null;
        isInitialized = false;
        initPromise = null;
        console.log('[MVB Runtime] Worker terminated');
    }
}

/**
 * Check if worker is initialized
 */
export function isMvbReady() {
    return isInitialized;
}

/**
 * Build core geometry and return STL ArrayBuffer
 * @param {Array} geometricalDescription - Core geometrical description from MKF
 * @param {Object} stlOptions - STL export options
 * @returns {Promise<ArrayBuffer>} STL data as ArrayBuffer
 */
export async function buildCoreSTL(geometricalDescription, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    const api = await waitForMvb();
    return await api.buildCore(geometricalDescription, stlOptions);
}

/**
 * Build spacers geometry and return STL ArrayBuffer
 * Spacers are built separately so they can be rendered with a different color.
 * @param {Array} geometricalDescription - Core geometrical description from MKF
 * @param {Object} stlOptions - STL export options
 * @returns {Promise<ArrayBuffer|null>} STL data as ArrayBuffer or null if no spacers
 */
export async function buildSpacersSTL(geometricalDescription, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    const api = await waitForMvb();
    return await api.buildSpacers(geometricalDescription, stlOptions);
}

/**
 * Build bobbin geometry and return STL ArrayBuffer
 * @param {Object} bobbinProcessed - Bobbin processed description
 * @param {Object} stlOptions - STL export options
 * @returns {Promise<ArrayBuffer>} STL data as ArrayBuffer
 */
export async function buildBobbinSTL(bobbinProcessed, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    const api = await waitForMvb();
    return await api.buildBobbin(bobbinProcessed, stlOptions);
}

/**
 * Build turn geometry and return STL ArrayBuffer
 * @param {Object} turnDesc - Turn description
 * @param {Object} wireDesc - Wire description
 * @param {Object} bobbinProcessed - Bobbin processed description
 * @param {boolean} isToroidal - Whether core is toroidal
 * @param {Object} stlOptions - STL export options
 * @returns {Promise<ArrayBuffer>} STL data as ArrayBuffer
 */
export async function buildTurnSTL(turnDesc, wireDesc, bobbinProcessed, isToroidal, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    const api = await waitForMvb();
    return await api.buildTurn(turnDesc, wireDesc, bobbinProcessed, isToroidal, stlOptions);
}

/**
 * Build complete magnetic assembly and return STL ArrayBuffer
 * @param {Object} magneticData - Full magnetic data with core, coil, etc.
 * @param {string} projectName - Project name for export
 * @param {Object} stlOptions - STL export options
 * @returns {Promise<ArrayBuffer>} STL data as ArrayBuffer
 */
export async function buildMagneticSTL(magneticData, projectName, stlOptions = { tolerance: 0.5, angularTolerance: 0.5, binary: true }) {
    const api = await waitForMvb();
    return await api.buildMagnetic(magneticData, projectName, stlOptions);
}


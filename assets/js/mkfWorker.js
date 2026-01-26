// mkfWorker.js - Web Worker that runs MKF WASM in background thread
// 
// This worker provides a clean interface to the MKF WASM module, automatically
// converting Embind types (vectors, booleans, numbers) to plain JS types that
// can be serialized via postMessage/Comlink.
//
// All MKF methods are accessible via the generic callMethod() function.
// Only essential startup methods (load_*) are defined explicitly.

import * as Comlink from 'comlink';

let mkf = null;
let readyResolve = null;
const ready = new Promise((resolve) => { readyResolve = resolve; });

/**
 * Convert Embind vector to JS array (recursive for nested vectors)
 */
function vectorToArray(vec) {
    if (vec == null) return null;
    if (typeof vec.size !== 'function') return vec;
    
    const arr = [];
    for (let i = 0; i < vec.size(); i++) {
        const item = vec.get(i);
        arr.push(convertEmbindResult(item));
    }
    return arr;
}

/**
 * Convert any Embind result to a plain JS value that can be serialized via postMessage.
 * Handles: vectors, booleans, numbers, strings, and nested structures.
 */
function convertEmbindResult(result) {
    // Null/undefined pass through
    if (result == null) {
        return result;
    }
    
    // Embind vectors have .size() and .get() methods
    if (typeof result.size === 'function' && typeof result.get === 'function') {
        return vectorToArray(result);
    }
    
    // Embind booleans - ensure they're plain JS booleans
    if (typeof result === 'boolean' || result === true || result === false) {
        return Boolean(result);
    }
    
    // Embind numbers - ensure they're plain JS numbers
    if (typeof result === 'number') {
        return Number(result);
    }
    
    // Strings are fine as-is
    if (typeof result === 'string') {
        return result;
    }
    
    // For objects, check if they might be Embind class instances
    if (typeof result === 'object') {
        if (typeof result.delete === 'function') {
            console.warn('[MKF Worker] Embind class instance returned - may not serialize properly');
        }
    }
    
    return result;
}

// The API exposed to the main thread
const workerApi = {
    /**
     * Initialize the WASM module
     * @param {string} wasmJsUrl - URL to the libMKF.wasm.js file
     */
    async init(wasmJsUrl) {
        if (mkf) {
            return true; // Already initialized
        }

        try {
            const baseUrl = wasmJsUrl.substring(0, wasmJsUrl.lastIndexOf('/') + 1);
            
            // Dynamically import the WASM module
            const response = await fetch(wasmJsUrl);
            const moduleCode = await response.text();
            
            const blob = new Blob([moduleCode], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            
            const ModuleFactory = (await import(/* @vite-ignore */ blobUrl)).default;
            URL.revokeObjectURL(blobUrl);

            return new Promise((resolve, reject) => {
                ModuleFactory({
                    locateFile(path) {
                        if (path.endsWith('.wasm')) {
                            return baseUrl + path;
                        }
                        return path;
                    },
                    onRuntimeInitialized() {
                        mkf = this;
                        readyResolve(mkf);
                        resolve(true);
                    }
                });
            });
        } catch (error) {
            console.error('[MKF Worker] Init error:', error);
            throw error;
        }
    },

    /**
     * Wait for the WASM module to be ready
     */
    async waitReady() {
        await ready;
        return true;
    },

    /**
     * Get list of all available methods from the MKF WASM module.
     * Useful for debugging or dynamic method discovery.
     */
    async getAvailableMethods() {
        await ready;
        const methods = Object.keys(mkf).filter(key => typeof mkf[key] === 'function');
        return methods;
    },

    /**
     * Generic method caller - handles ANY MKF method dynamically.
     * Automatically converts Embind types to plain JS types for Comlink serialization.
     * 
     * @param {string} methodName - Name of the MKF method to call
     * @param {...any} args - Arguments to pass to the method
     * @returns {any} The result, converted to plain JS types
     */
    async callMethod(methodName, ...args) {
        await ready;
        
        if (!mkf[methodName]) {
            throw new Error(`[MKF Worker] Method not found: ${methodName}`);
        }

        try {
            const result = mkf[methodName](...args);
            return convertEmbindResult(result);
        } catch (error) {
            // Convert Embind exception to a serializable Error object
            // Embind exceptions may not be serializable through Comlink's postMessage
            const message = error?.message || (typeof error === 'string' ? error : `Error calling ${methodName}`);
            console.error(`[MKF Worker] Error calling ${methodName}:`, message);
            throw new Error(message);
        }
    },

    // ==========================================
    // Essential startup methods
    // These are called during app initialization before the full
    // proxy mechanism is set up, so they need explicit definitions.
    // ==========================================

    async load_core_materials(data) {
        await ready;
        return mkf.load_core_materials(data);
    },

    async load_core_shapes(data) {
        await ready;
        return mkf.load_core_shapes(data);
    },

    async load_wires(data) {
        await ready;
        return mkf.load_wires(data);
    },

    async load_cores(data, allowToroidal, useOnlyInStock) {
        await ready;
        return mkf.load_cores(data, allowToroidal, useOnlyInStock);
    },
};

// Expose the API via Comlink
Comlink.expose(workerApi);

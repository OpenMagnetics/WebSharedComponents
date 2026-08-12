// src/services/mkfRuntime.js
// Supports both main-thread (legacy) and worker-based (non-blocking) modes
import * as Comlink from 'comlink';

let mkf = null;
let mkfProxy = null;
let worker = null;
let resolveReady;
// `ready` is re-armed by terminateWorker() so a torn-down worker doesn't leave
// waitForMkf() permanently resolved with a dead proxy (see terminateWorker).
let ready = new Promise((resolve) => { resolveReady = resolve; });

// Configuration
let useWorker = true; // Worker mode enabled - WASM runs in background thread

/**
 * Enable or disable worker mode. Must be called before initialization.
 * @param {boolean} enable - Whether to use Web Worker for WASM calls
 */
export function setWorkerMode(enable) {
    if (mkf || mkfProxy) {
        return;
    }
    useWorker = enable;
}

/**
 * Check if worker mode is enabled
 */
export function isWorkerMode() {
    return useWorker;
}

/**
 * Initialize WASM in a Web Worker (non-blocking mode)
 * @param {string} wasmJsUrl - URL to the libMKF.wasm.js file
 * @returns {Promise} Resolves when worker is ready
 */
export async function initWorker(wasmJsUrl) {
    // Return the existing MKF proxy if already initialized
    if (mkf) {
        return mkf;
    }

    useWorker = true;
    
    // Create the worker - Vite handles the URL transformation
    worker = new Worker(
        new URL('./mkfWorker.js', import.meta.url),
        { type: 'module' }
    );

    // Wrap with Comlink
    mkfProxy = Comlink.wrap(worker);

    // Initialize the WASM module in the worker
    await mkfProxy.init(wasmJsUrl);
    await mkfProxy.waitReady();

    // Create a proxy object that mimics the original MKF API
    mkf = createMkfProxy(mkfProxy);
    mkf.ready = Promise.resolve();

    resolveReady(mkf);
    
    return mkf;
}

/**
 * Set the MKF instance directly (legacy main-thread mode)
 * @param {Object} newMkf - The WASM module instance
 */
export function setMkf(newMkf) {
    if (useWorker) {
        return;
    }
    mkf = newMkf;
    resolveReady(newMkf);
}

/**
 * Wait for MKF to be ready
 * @returns {Promise<Object>} The MKF instance or proxy
 */
export function waitForMkf() {
    return ready;
}

/**
 * Get the current MKF instance
 * @returns {Object|null} The MKF instance or proxy
 */
export function getMkf() {
    return mkf;
}

/**
 * Terminate the worker (cleanup)
 */
/**
 * Pre-enrich a magnetic JSON using the MKF worker so MVB++ can skip its
 * internal magnetic_autocomplete_safe call (much faster rendering).
 * @param {Object} magnetic - raw magnetic object
 * @returns {Promise<Object>} enriched magnetic with geometricalDescription etc.
 */
export async function enrichMagnetic(magnetic) {
    const m = await waitForMkf();
    const result = await m.mas_autocomplete(JSON.stringify({ magnetic }), false, '{}');
    const parsed = JSON.parse(result);
    return parsed?.magnetic ?? parsed;
}

/**
 * Re-wind a design with a given U/Z winding order.
 *
 * windingOrder is DESIGN data, not an engine setting: MKF resolves it per section as
 * the section's own windingOrder, else the bobbin winding window's, else 'Z'. So
 * swapping it means stamping the bobbin's windows and winding again — 'U' alternates
 * the direction every layer (back-and-forth), 'Z' winds every layer the same way with
 * a return, which moves the turns themselves, not just the connections.
 *
 * The wound descriptions are dropped so the winder actually re-runs; keeping them
 * would hand the new order to a coil that is already laid out and change nothing.
 * groupsDescription is deliberately left alone (planar/printed geometry).
 *
 * @param {Object} mas - full MAS object (mutated copy is returned, input untouched)
 * @param {'U'|'Z'} windingOrder
 * @returns {Promise<Object>} the re-wound MAS
 */
export async function applyWindingOrder(mas, windingOrder) {
    if (windingOrder !== 'U' && windingOrder !== 'Z') {
        throw new Error(`Winding order must be 'U' or 'Z', got '${windingOrder}'`);
    }
    const next = JSON.parse(JSON.stringify(mas));
    const coil = next?.magnetic?.coil;
    const windingWindows = coil?.bobbin?.processedDescription?.windingWindows;
    if (!windingWindows?.length) {
        // Before autocomplete the bobbin is still a name ("basic"/"Dummy") with no
        // processed description, so there is nothing to stamp and nothing to re-wind.
        throw new Error('The design has no processed bobbin yet — build the magnetic before changing the winding order');
    }
    for (const windingWindow of windingWindows) {
        windingWindow.windingOrder = windingOrder;
    }
    coil.sectionsDescription = null;
    coil.layersDescription = null;
    coil.turnsDescription = null;

    const m = await waitForMkf();
    const resultRaw = await m.mas_autocomplete(JSON.stringify(next), false, '{}');
    if (typeof resultRaw === 'string' && resultRaw.startsWith('Exception')) {
        throw new Error(`mas_autocomplete: ${resultRaw}`);
    }
    const result = JSON.parse(resultRaw);
    if (result?.magnetic?.coil?.turnsDescription == null) {
        throw new Error(`The winder produced no turns for winding order '${windingOrder}'`);
    }
    return result;
}

export function terminateWorker() {
    if (worker) {
        worker.terminate();
        worker = null;
        mkfProxy = null;
        mkf = null;
        // Re-arm `ready` so the NEXT initWorker() resolves a FRESH promise. Without
        // this, `ready` stays resolved with the terminated worker's proxy, so every
        // waitForMkf() consumer (LtSpice export, masAutocomplete) keeps calling the
        // dead worker after a rebuild (e.g. an El Choker palette switch).
        ready = new Promise((resolve) => { resolveReady = resolve; });
    }
}

/**
 * Creates a proxy object that translates synchronous-looking calls 
 * to async worker calls. This maintains API compatibility.
 * 
 * All MKF methods are routed through the worker's generic callMethod(),
 * which automatically handles Embind type conversion (vectors, booleans, numbers).
 */
function createMkfProxy(workerProxy) {
    // Only methods explicitly defined in mkfWorker.js
    // Everything else goes through callMethod() which handles any MKF method
    const workerExplicitMethods = new Set([
        'init', 'waitReady', 'callMethod', 'getAvailableMethods',
        'load_core_materials', 'load_core_shapes', 'load_wires', 'load_cores',
    ]);

    return new Proxy({}, {
        get(target, prop) {
            // Ignore symbols (used by Comlink, Promises, etc.)
            if (typeof prop === 'symbol') {
                return undefined;
            }
            
            // Ignore internal JS properties
            if (prop === 'then' || prop === 'toJSON' || prop === 'valueOf' || 
                prop === 'toString' || prop === 'constructor' || prop === '$$typeof') {
                return undefined;
            }
            
            // Special properties
            if (prop === 'ready') {
                return target.ready || Promise.resolve();
            }
            
            // Return an async function that calls the worker
            return async (...args) => {
                // Use explicit worker method if defined, otherwise use generic callMethod
                if (workerExplicitMethods.has(prop)) {
                    return await workerProxy[prop](...args);
                }
                // callMethod handles any MKF method with automatic type conversion
                return await workerProxy.callMethod(prop, ...args);
            };
        }
    });
}
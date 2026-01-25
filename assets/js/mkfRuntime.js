// src/services/mkfRuntime.js
// Supports both main-thread (legacy) and worker-based (non-blocking) modes
import * as Comlink from 'comlink';

let mkf = null;
let mkfProxy = null;
let worker = null;
let resolveReady;
const ready = new Promise((resolve) => { resolveReady = resolve; });

// Configuration
let useWorker = true; // Worker mode enabled - WASM runs in background thread

/**
 * Enable or disable worker mode. Must be called before initialization.
 * @param {boolean} enable - Whether to use Web Worker for WASM calls
 */
export function setWorkerMode(enable) {
    if (mkf || mkfProxy) {
        console.warn('[MKF Runtime] Cannot change worker mode after initialization');
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
    console.log('[MKF Runtime] Worker initialized successfully');
    
    return mkf;
}

/**
 * Set the MKF instance directly (legacy main-thread mode)
 * @param {Object} newMkf - The WASM module instance
 */
export function setMkf(newMkf) {
    if (useWorker) {
        console.warn('[MKF Runtime] setMkf called but worker mode is enabled');
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
export function terminateWorker() {
    if (worker) {
        worker.terminate();
        worker = null;
        mkfProxy = null;
        mkf = null;
    }
}

/**
 * Creates a proxy object that translates synchronous-looking calls 
 * to async worker calls. This maintains API compatibility.
 */
function createMkfProxy(workerProxy) {
    // List of methods that are explicitly defined in mkfWorker.js
    const directMethods = new Set([
        'init', 'waitReady', 'callMethod',
        'load_core_materials', 'load_core_shapes', 'load_wires', 'load_cores',
        'get_shape_data', 'get_material_data', 'calculate_core_data', 'calculate_core_data_from_shape',
        'calculate_all_core_data_from_shapes',
        'get_available_core_shape_families', 'get_shape_family_subtypes', 'get_shape_family_dimensions',
        'get_available_core_shapes_by_manufacturer', 'get_available_core_shapes_by_family',
        'get_available_core_manufacturers', 'get_available_core_materials',
        'get_core_temperature_dependant_parameters', 'calculate_inductance_from_number_turns_and_gapping',
        'calculate_core_losses', 'check_requirement', 'get_settings', 'set_settings',
        'calculate_advised_cores', 'resolve_dimension_with_tolerance', 'calculate_number_turns',
        'calculate_complex_permeability', 'get_defaults', 'get_constants',
        'get_only_frequency_dependent_indexes', 'get_only_magnetic_field_dc_bias_dependent_indexes',
        'get_only_temperature_dependent_indexes', 'get_initial_permeability_equations',
        'get_core_volumetric_losses_equations', 'get_wire_data', 'get_coating_label',
        'get_wire_data_by_name', 'get_wire_coating_by_label', 'get_wire_data_by_standard_name',
        'get_available_wire_types', 'get_available_wire_standards', 'get_unique_wire_diameters',
        'get_coating_labels_by_type', 'get_equivalent_wire', 'get_outer_dimensions',
        'calculate_dc_resistance_per_meter', 'calculate_skin_ac_resistance_per_meter',
        'calculate_skin_ac_factor', 'calculate_dc_losses_per_meter', 'calculate_skin_ac_losses_per_meter',
        'calculate_effective_current_density', 'calculate_effective_skin_depth',
        'get_wire_outer_diameter_bare_litz', 'get_wire_outer_diameter_served_litz',
        'get_wire_outer_diameter_insulated_litz', 'get_wire_outer_height_rectangular',
        'get_wire_outer_width_rectangular', 'create_simple_bobbin_from_core',
        'create_simple_bobbin_from_core_with_custom_thickness', 'create_simple_bobbin_from_core_with_custom_thicknesses',
        'plot_turns', 'plot_magnetic_field', 'plot_electric_field', 'plot_wire_losses',
        'calculate_leakage_inductance', 'get_available_winding_orientations', 'get_available_coil_alignments',
        'are_sections_and_layers_fitting', 'check_if_fits',
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
                const startTime = performance.now();
                let result;
                
                // Use direct method if available, otherwise use generic callMethod
                if (directMethods.has(prop)) {
                    result = await workerProxy[prop](...args);
                } else {
                    // Use the generic callMethod for unknown methods
                    result = await workerProxy.callMethod(prop, ...args);
                }
                
                const elapsed = performance.now() - startTime;
                if (elapsed > 100) {
                    console.log(`[MKF] ${prop} took ${elapsed.toFixed(1)}ms`);
                }
                
                return result;
            };
        }
    });
}
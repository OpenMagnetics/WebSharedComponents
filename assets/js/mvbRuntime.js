
import * as Comlink from 'comlink';

let worker = null;
let workerApi = null;
let isInitialized = false;
let initPromise = null;

export async function initMvbWorker() {
    if (initPromise) return initPromise;
    if (isInitialized && workerApi) return workerApi;
    
    initPromise = (async () => {
        try {
            const WorkerConstructor = await import('./mvbWorker.js?worker');
            worker = new WorkerConstructor.default();
            workerApi = Comlink.wrap(worker);
            await workerApi.waitReady();
            isInitialized = true;
            console.log('[MVB Runtime] Worker initialized');
            return workerApi;
        } catch (e) { 
            console.error('[MVB Runtime] Worker initialization failed:', e);
            initPromise = null; 
            throw e; 
        }
    })();
    
    return initPromise;
}

export function terminateWorker() {
    if (worker) {
        worker.terminate();
        worker = null; workerApi = null; isInitialized = false; initPromise = null;
        console.log('[MVB Runtime] Worker terminated');
    }
}

export async function waitForMvb() {
    if (!initPromise) return initMvbWorker();
    return initPromise;
}

const DEFAULT_STL = { tolerance: 0.1, angularTolerance: 0.2, binary: true };

export async function buildCoreSTL(geom, opts = DEFAULT_STL) {
    const api = await waitForMvb();
    return api.buildCore(geom, opts);
}
export async function buildSpacersSTL(geom, opts = DEFAULT_STL) {
    const api = await waitForMvb();
    return api.buildSpacers(geom, opts);
}
export async function buildBobbinSTL(bobbin, opts = DEFAULT_STL) {
    const api = await waitForMvb();
    return api.buildBobbin(bobbin, opts);
}
export async function buildTurnSTL(turn, wire, bobbin, isToroidal = false, opts = DEFAULT_STL) {
    const api = await waitForMvb();
    return api.buildTurn(turn, wire, bobbin, isToroidal, opts);
}
export async function buildFR4BoardSTL(coil, opts = DEFAULT_STL) {
    const api = await waitForMvb();
    return api.buildFR4Board(coil, opts);
}
export async function buildMagneticSTL(mag, name, opts = DEFAULT_STL) {
    const api = await waitForMvb();
    return api.buildMagnetic(mag, name, opts);
}

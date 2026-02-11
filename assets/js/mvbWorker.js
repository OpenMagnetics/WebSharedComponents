
import * as Comlink from 'comlink';
let builder, replicadModule, isReady = false, initPromise;

async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
        try {
            const [ocModule, rep, mvb] = await Promise.all([
                import('replicad-opencascadejs/src/replicad_single.js'),
                import('replicad'),
                import('@openmagnetics/magnetic-virtual-builder')
            ]);
            const wasmUrl = (await import('replicad-opencascadejs/src/replicad_single.wasm?url')).default;
            const OC = await ocModule.default({ locateFile: () => wasmUrl });
            rep.setOC(OC);
            replicadModule = rep;
            builder = new mvb.ReplicadBuilder(replicadModule);
            isReady = true;
            console.log('[MVB Worker] Initialized successfully.');
        } catch (e) { console.error('[MVB Worker] Initialization failed:', e); initPromise = null; throw e; }
    })();
    return initPromise;
}

async function waitReady() { if (!isReady) await init(); }

const DEFAULT_STL_OPTIONS = { tolerance: 0.1, angularTolerance: 0.2, binary: true };

async function toSTL(shape, options) {
    if (!shape) return null;
    return await shape.blobSTL(options).arrayBuffer();
}

Comlink.expose({
    waitReady,
    buildCore: async (geom, options=DEFAULT_STL_OPTIONS) => {
        await waitReady();
        const { getCore } = await import('@openmagnetics/magnetic-virtual-builder');
        return toSTL(getCore(replicadModule, geom), options);
    },
    buildSpacers: async (geom, options=DEFAULT_STL_OPTIONS) => {
        await waitReady();
        const { getSpacers } = await import('@openmagnetics/magnetic-virtual-builder');
        return toSTL(getSpacers(replicadModule, geom), options);
    },
    buildBobbin: (bobbin, options = DEFAULT_STL_OPTIONS) => waitReady().then(() => toSTL(builder.getBobbin(bobbin), options)),
    buildTurn: (turn, wire, bobbin, isToroidal = false, options = DEFAULT_STL_OPTIONS) => waitReady().then(() => toSTL(builder.getTurn(turn, wire, bobbin, isToroidal), options)),
    buildFR4Board: async (coil, options = DEFAULT_STL_OPTIONS) => {
        await waitReady();
        const shape = builder.getFR4Board(coil);
        return toSTL(shape, options);
    },
    buildMagnetic: (magnetic, name, options = DEFAULT_STL_OPTIONS) => waitReady().then(() => toSTL(builder.getMagnetic(magnetic, name), options)),
});

init().catch(err => {});

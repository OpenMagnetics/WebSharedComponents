
import * as Comlink from 'comlink';

let _mvbpp = null;
let _initPromise = null;

// mvbpp.js is compiled with MODULARIZE=1 (UMD) without EXPORT_ES6.
// In a module worker there is no importScripts(), so we fetch the script
// text and wrap it in new Function() to capture the createMvbpp factory.
//
// Paths are anchored on Vite's BASE_URL (always ends with "/") so they
// resolve against the deployed sub-path (e.g. "/el-choker/") instead of
// the server root. Without this, dev returns the 404 page "The server is
// configured with a public base URL of …" which then crashes
// new Function() with "Unexpected identifier 'server'".
const BASE = import.meta.env.BASE_URL;
async function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
        try {
            const code = await (await fetch(`${BASE}wasm/mvbpp.js`)).text();
            const createMvbpp = new Function(code + '\nreturn createMvbpp;')();
            _mvbpp = await createMvbpp({ locateFile: (f) => `${BASE}wasm/${f}` });
        } catch (e) {
            _initPromise = null;
            console.error('[MVB Worker] init failed:', e);
            throw e;
        }
    })();
    return _initPromise;
}

function toBuffer(u8) {
    if (!u8 || !u8.length) return null;
    return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

function decodeWasmException(mod, e) {
    if (typeof e === 'number') {
        // Emscripten C++ exception pointer. Try every known introspection path.
        const tries = [];
        if (mod) {
            // 1. Official helper (requires -sEXPORT_EXCEPTION_HANDLING_HELPERS=1).
            if (typeof mod.getExceptionMessage === 'function') {
                try {
                    const r = mod.getExceptionMessage(e);
                    if (r) return Array.isArray(r) ? r.join(': ') : String(r);
                } catch (err) { tries.push(`getExceptionMessage:${err && err.message}`); }
            }
            // 2. Older helper.
            if (typeof mod.getCppExceptionMessage === 'function') {
                try { const r = mod.getCppExceptionMessage(e); if (r) return String(r); }
                catch (err) { tries.push(`getCppExceptionMessage:${err && err.message}`); }
            }
            // 3. Manual ITANIUM ABI: pointer is to exception object; what() is offset.
            // Try ___cxa_get_exception_ptr / what virtual-call (rarely present).
            if (typeof mod.___cxa_get_exception_ptr === 'function' && typeof mod.UTF8ToString === 'function') {
                try {
                    const objPtr = mod.___cxa_get_exception_ptr(e);
                    // Heuristic: read pointer at objPtr+4 (vptr+slot 0 typically what()).
                    // This is unreliable; fall through silently.
                } catch (err) { tries.push(`cxaGet:${err && err.message}`); }
            }
            // 4. Last resort: UTF8 from raw ptr (works iff exception WAS a const char*).
            if (typeof mod.UTF8ToString === 'function') {
                try {
                    const msg = mod.UTF8ToString(e);
                    if (msg && msg.length > 0 && msg.length < 512 && /^[\x20-\x7e\n\t]+$/.test(msg)) {
                        return msg;
                    }
                } catch (err) { tries.push(`utf8:${err && err.message}`); }
            }
        }
        return `WASM exception ptr=${e}` + (tries.length ? ` [tries: ${tries.join(', ')}]` : '');
    }
    if (e instanceof Error) {
        // Prefer message when it carries our tagged content; stack often
        // shadows it with a raw "addr@http..." trace from the wasm runtime.
        const msg = e.message || '';
        if (msg && (msg.startsWith('[mvbpp]') || msg.startsWith('[MVB]')
                    || msg.includes('ctor failed') || msg.includes('schema'))) {
            return msg;
        }
        return msg || e.stack || String(e);
    }
    return String(e);
}

const DEFAULTS = { scale: 1.0, wireSeg: 16, coreSeg: 32, tolMm: 0.1, angTol: 0.1, binary: true };

function o(opts) { return { ...DEFAULTS, ...opts }; }

function timed(name, fn) {
    return async (...args) => {
        const t0 = performance.now();
        const result = await fn(...args);
        console.log(`[MVB] ${name} seg=${DEFAULTS.coreSeg} took ${(performance.now() - t0).toFixed(0)}ms`);
        return result;
    };
}

Comlink.expose({
    waitReady: () => init(),

    buildMagneticSTL: timed('buildMagneticSTL', async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        try {
            return toBuffer(_mvbpp.buildMagneticSTL(
                JSON.stringify(magnetic), opts.includeBobbin ?? true,
                d.scale, opts.symmetryPlanes ?? 0, d.wireSeg, d.coreSeg,
                d.tolMm, d.angTol, d.binary,
            ));
        } catch(e) {
            const msg = decodeWasmException(_mvbpp, e);
            console.error('[MVB Worker] buildMagneticSTL failed:', msg, 'raw:', e);
            throw new Error('[MVB] buildMagneticSTL: ' + msg);
        }
    }),

    buildMagneticSTEP: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildMagneticSTEP(
            JSON.stringify(magnetic), opts.includeBobbin ?? true,
            d.scale, opts.symmetryPlanes ?? 0, d.wireSeg, d.coreSeg,
        ));
    },

    buildCoreSTL: timed('buildCoreSTL', async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        try {
            return toBuffer(_mvbpp.buildCoreSTL(
                JSON.stringify(magnetic), d.scale, d.coreSeg, d.tolMm, d.angTol, d.binary,
            ));
        } catch(e) {
            const msg = decodeWasmException(_mvbpp, e);
            console.error('[MVB Worker] buildCoreSTL failed:', msg, 'raw:', e);
            throw new Error('[MVB] buildCoreSTL: ' + msg);
        }
    }),

    buildSpacersSTL: timed('buildSpacersSTL', async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildSpacersSTL(
            JSON.stringify(magnetic), d.scale, d.tolMm, d.angTol, d.binary,
        ));
    }),

    buildBobbinSTL: timed('buildBobbinSTL', async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildBobbinSTL(
            JSON.stringify(magnetic), d.scale, d.tolMm, d.angTol, d.binary,
        ));
    }),

    buildTurnsSTL: timed('buildTurnsSTL', async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildTurnsSTL(
            JSON.stringify(magnetic), d.scale, d.wireSeg, d.tolMm, d.angTol, d.binary,
        ));
    }),

    buildFR4BoardSTL: timed('buildFR4BoardSTL', async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildFR4BoardSTL(
            JSON.stringify(magnetic), d.scale,
            opts.borderToWireDistance ?? 1.0,
            opts.coreToLayerDistance ?? 0.5,
            d.tolMm, d.angTol, d.binary,
        ));
    }),

    getSymmetryPlanes: async (magnetic) => {
        await init();
        return Array.from(_mvbpp.getSymmetryPlanes(JSON.stringify(magnetic)));
    },

    getSupportedFamilies: async () => {
        await init();
        return Array.from(_mvbpp.getSupportedFamilies());
    },

    drawDimensionedFrontView: async (magnetic, widthPx = 800, labelPx = 14, projColor = '#000000', dimColor = '#0000ff') => {
        await init();
        try {
            return _mvbpp.drawDimensionedFrontView(JSON.stringify(magnetic), widthPx, labelPx, projColor, dimColor);
        } catch(e) {
            const msg = decodeWasmException(_mvbpp, e);
            console.error('[MVB Worker] drawDimensionedFrontView failed:', msg, 'raw:', e);
            throw new Error('[MVB] drawDimensionedFrontView: ' + msg);
        }
    },

    drawDimensionedTopView: async (magnetic, widthPx = 800, labelPx = 14, projColor = '#000000', dimColor = '#0000ff') => {
        await init();
        try {
            return _mvbpp.drawDimensionedTopView(JSON.stringify(magnetic), widthPx, labelPx, projColor, dimColor);
        } catch(e) {
            const msg = decodeWasmException(_mvbpp, e);
            console.error('[MVB Worker] drawDimensionedTopView failed:', msg, 'raw:', e);
            throw new Error('[MVB] drawDimensionedTopView: ' + msg);
        }
    },

    drawCoreGappingTechnicalDrawing: async (magnetic, widthPx = 800, labelPx = 14, projColor = '#000000', dimColor = '#0000ff') => {
        await init();
        return _mvbpp.drawCoreGappingTechnicalDrawing(JSON.stringify(magnetic), widthPx, labelPx, projColor, dimColor);
    },

    drawCoreProjection: async (magnetic, plane = 'XZ', coreSeg = 32, widthPx = 800, strokeWidth = 1.5, strokeColor = '#000000') => {
        await init();
        return _mvbpp.drawCoreProjection(JSON.stringify(magnetic), plane, coreSeg, widthPx, strokeWidth, strokeColor);
    },

    drawCoreCrossSection: async (magnetic, plane = 'XZ', sectionOffset = 0, coreSeg = 32, widthPx = 800, strokeWidth = 1.5, strokeColor = '#000000') => {
        await init();
        return _mvbpp.drawCoreCrossSection(JSON.stringify(magnetic), plane, sectionOffset, coreSeg, widthPx, strokeWidth, strokeColor);
    },

    drawAssemblyProjection: async (magnetic, plane = 'XZ', components = 7, symmetryPlanes = 0, wireSeg = 16, coreSeg = 32, widthPx = 800, strokeWidth = 1.5, strokeColor = '#000000') => {
        await init();
        return _mvbpp.drawAssemblyProjection(JSON.stringify(magnetic), plane, components, symmetryPlanes, wireSeg, coreSeg, widthPx, strokeWidth, strokeColor);
    },

    drawAssemblyCrossSection: async (magnetic, plane = 'XZ', sectionOffset = 0, components = 7, symmetryPlanes = 0, wireSeg = 16, coreSeg = 32, widthPx = 800, strokeWidth = 1.5, strokeColor = '#000000') => {
        await init();
        return _mvbpp.drawAssemblyCrossSection(JSON.stringify(magnetic), plane, sectionOffset, components, symmetryPlanes, wireSeg, coreSeg, widthPx, strokeWidth, strokeColor);
    },
});

init().catch(() => {});

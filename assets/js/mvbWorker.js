
import * as Comlink from 'comlink';

let _mvbpp = null;
let _initPromise = null;

// mvbpp.js is compiled with MODULARIZE=1 (UMD) without EXPORT_ES6.
// In a module worker there is no importScripts(), so we fetch the script
// text and wrap it in new Function() to capture the createMvbpp factory.
async function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
        try {
            const code = await (await fetch('/wasm/mvbpp.js')).text();
            const createMvbpp = new Function(code + '\nreturn createMvbpp;')();
            _mvbpp = await createMvbpp({ locateFile: (f) => `/wasm/${f}` });
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

const DEFAULTS = { scale: 1.0, wireSeg: 16, coreSeg: 32, tolMm: 0.5, angTol: 0.5, binary: true };

function o(opts) { return { ...DEFAULTS, ...opts }; }

Comlink.expose({
    waitReady: () => init(),

    buildMagneticSTL: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildMagneticSTL(
            JSON.stringify(magnetic), opts.includeBobbin ?? true,
            d.scale, opts.symmetryPlanes ?? 0, d.wireSeg, d.coreSeg,
            d.tolMm, d.angTol, d.binary,
        ));
    },

    buildMagneticSTEP: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildMagneticSTEP(
            JSON.stringify(magnetic), opts.includeBobbin ?? true,
            d.scale, opts.symmetryPlanes ?? 0, d.wireSeg, d.coreSeg,
        ));
    },

    buildCoreSTL: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildCoreSTL(
            JSON.stringify(magnetic), d.scale, d.coreSeg, d.tolMm, d.angTol, d.binary,
        ));
    },

    buildSpacersSTL: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildSpacersSTL(
            JSON.stringify(magnetic), d.scale, d.tolMm, d.angTol, d.binary,
        ));
    },

    buildBobbinSTL: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildBobbinSTL(
            JSON.stringify(magnetic), d.scale, d.tolMm, d.angTol, d.binary,
        ));
    },

    buildTurnsSTL: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildTurnsSTL(
            JSON.stringify(magnetic), d.scale, d.wireSeg, d.tolMm, d.angTol, d.binary,
        ));
    },

    buildFR4BoardSTL: async (magnetic, opts = {}) => {
        await init();
        const d = o(opts);
        return toBuffer(_mvbpp.buildFR4BoardSTL(
            JSON.stringify(magnetic), d.scale,
            opts.borderToWireDistance ?? 1.0,
            opts.coreToLayerDistance ?? 0.5,
            d.tolMm, d.angTol, d.binary,
        ));
    },

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
        return _mvbpp.drawDimensionedFrontView(JSON.stringify(magnetic), widthPx, labelPx, projColor, dimColor);
    },

    drawDimensionedTopView: async (magnetic, widthPx = 800, labelPx = 14, projColor = '#000000', dimColor = '#0000ff') => {
        await init();
        return _mvbpp.drawDimensionedTopView(JSON.stringify(magnetic), widthPx, labelPx, projColor, dimColor);
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

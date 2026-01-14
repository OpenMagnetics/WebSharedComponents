// src/services/mkfRuntime.js
let mkf = null
let resolveReady
const ready = new Promise((resolve) => { resolveReady = resolve })

export function setMkf(newMkf) {
    mkf = newMkf
    resolveReady(newMkf)
}

export function waitForMkf() {
    return ready
}

export function getMkf() {
    return mkf
}
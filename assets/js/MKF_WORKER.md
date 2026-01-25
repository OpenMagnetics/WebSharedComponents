# MKF Worker Architecture

This document describes the Web Worker-based architecture for running the MKF WASM module in a background thread.

## Overview

The MKF (Magnetic Kernel Framework) is a C++ library compiled to WebAssembly. To prevent blocking the UI during long calculations, it runs in a Web Worker. The architecture consists of:

- **mkfWorker.js** - Web Worker that loads and runs the WASM module
- **mkfRuntime.js** - Main thread module that provides a proxy to the worker
- **Comlink** - Library that simplifies Worker communication

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Main Thread                               │
│                                                                  │
│  ┌──────────────┐    ┌────────────────┐    ┌─────────────────┐  │
│  │ Vue Component│───▶│ taskQueueStore │───▶│  mkfRuntime.js  │  │
│  └──────────────┘    └────────────────┘    └────────┬────────┘  │
│                                                      │           │
│                                             waitForMkf()         │
│                                                      │           │
│                                                      ▼           │
│                                            ┌─────────────────┐   │
│                                            │   MKF Proxy     │   │
│                                            │ (Proxy object)  │   │
│                                            └────────┬────────┘   │
└─────────────────────────────────────────────────────│────────────┘
                                                      │
                                              Comlink postMessage
                                                      │
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Web Worker                                │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  mkfWorker.js   │───▶│   MKF WASM      │                     │
│  │  - callMethod() │    │   (libMKF.wasm) │                     │
│  │  - convertResult│    │                 │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### mkfWorker.js

The worker exposes a minimal API via Comlink:

| Method | Description |
|--------|-------------|
| `init(wasmJsUrl)` | Initialize the WASM module |
| `waitReady()` | Wait for WASM to be ready |
| `getAvailableMethods()` | List all available MKF methods |
| `callMethod(name, ...args)` | Call any MKF method dynamically |
| `load_core_materials(data)` | Load core materials (startup) |
| `load_core_shapes(data)` | Load core shapes (startup) |
| `load_wires(data)` | Load wires (startup) |
| `load_cores(data, ...)` | Load cores (startup) |

**Dynamic Method Calling**: The `callMethod` function can call any MKF method by name. It automatically converts Embind types to plain JavaScript:

- `std::vector<T>` → JavaScript Array
- Embind `bool` → `Boolean()`
- Embind `double` → `Number()`
- `std::string` → String (no conversion needed)

### mkfRuntime.js

Provides a transparent proxy that makes worker calls look synchronous:

```javascript
import { waitForMkf } from '/WebSharedComponents/assets/js/mkfRuntime';

const mkf = await waitForMkf();
const result = await mkf.calculate_core_data(coreJson, false);
```

**How the Proxy Works**:
1. Any property access on the proxy returns an async function
2. Startup methods (`init`, `load_*`) call the worker directly
3. All other methods route through `callMethod(methodName, ...args)`
4. The worker handles type conversion automatically

### Type Conversion

The `convertEmbindResult` function in mkfWorker.js handles Embind→JS conversion:

```javascript
function convertEmbindResult(result) {
    // Vectors → Arrays
    if (typeof result.size === 'function' && typeof result.get === 'function') {
        return vectorToArray(result);
    }
    // Booleans
    if (typeof result === 'boolean') {
        return Boolean(result);
    }
    // Numbers
    if (typeof result === 'number') {
        return Number(result);
    }
    return result;
}
```

## Usage

### Basic Usage

```javascript
import { waitForMkf, initWorker } from '/WebSharedComponents/assets/js/mkfRuntime';

// Initialize (usually done in main.js)
await initWorker('/path/to/libMKF.wasm.js');

// Get the proxy
const mkf = await waitForMkf();

// Call any MKF method
const coreData = await mkf.calculate_core_data(JSON.stringify(core), false);
const materials = await mkf.get_available_core_materials('TDK');
```

### In TaskQueue Stores

The recommended pattern is to use taskQueue stores that wrap MKF calls:

```javascript
// In a Pinia store
async calculateCoreData(core) {
    const mkf = await waitForMkf();
    await mkf.ready;
    
    const result = await mkf.calculate_core_data(JSON.stringify(core), false);
    if (result.startsWith('Exception')) {
        throw new Error(result);
    }
    return JSON.parse(result);
}
```

### Discovering Available Methods

```javascript
const mkf = await waitForMkf();
const methods = await mkf.getAvailableMethods();
console.log(methods); // ['calculate_core_data', 'get_material_data', ...]
```

## Adding New MKF Methods

When new methods are added to the C++ MKF library and exposed via Embind:

1. **No changes needed to mkfWorker.js or mkfRuntime.js** - `callMethod` handles any method automatically
2. Add the method call to your taskQueue store
3. The worker will automatically convert return types

## Performance Notes

- Worker initialization takes ~100-200ms
- Large calculations run in the background without blocking UI
- Method call overhead is ~1-5ms per call (Comlink serialization)
- Methods taking >100ms are logged to console for debugging

## Debugging

Enable verbose logging by checking browser console for:
- `[MKF Runtime]` - Initialization messages
- `[MKF Worker]` - Worker-side messages
- `[MKF] methodName took Xms` - Slow method warnings

To see all available methods:
```javascript
const mkf = await waitForMkf();
console.log(await mkf.getAvailableMethods());
```

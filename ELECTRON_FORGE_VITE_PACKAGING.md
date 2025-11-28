# Electron Forge + Vite Packaging Issues - LLM Reference Guide

## ⚠️ CRITICAL: Read This First to Avoid Circular Debugging

This document prevents wasting time on solutions that DO NOT WORK. An LLM went through 37+ failed iterations before finding the working solution documented here.

---

## Problem Signature

**Symptom:** `Error: Cannot find module 'X'` when running packaged Electron app
**Error Location:** `C:\Users\{user}\AppData\Local\{app}\app-{version}\resources\app\.vite\build\main.js`
**Context:** Error occurs in PUBLISHED .exe downloaded from GitHub releases, NOT during `npm run start`
**Root Cause:** Electron Forge's Vite plugin does NOT copy `node_modules` to packaged applications

---

## Verified Facts (Do Not Question These)

### 1. Package Structure Reality
When you run `npm run package` or `npm run publish`, the output in `out/PS Loader 2.0-win32-x64/resources/app/` contains:

```
app/
  .vite/
    build/
      main.js       # Your bundled main process code
      preload.js    # Your bundled preload code
    renderer/       # Your bundled renderer code
  package.json      # Copy of your package.json
  # ❌ NO node_modules/ directory!
```

**Verified by:**
- Running `npx asar extract out/.../app.asar temp_extract` and inspecting contents
- Checking `out/PS Loader 2.0-win32-x64/resources/app/` directly when `asar: false`

### 2. How Vite Bundling Works with Electron Forge

```typescript
// In vite.base.config.ts
export const external = [
  ...builtins,                    // electron, fs, path, etc.
  ...nativeModules,               // Modules with .node files
  ...Object.keys(pkg.dependencies) // ALL deps not in bundledModules
    .filter(dep => !bundledModules.includes(dep))
];
```

**Key Understanding:**
- Modules in `bundledModules` → Vite bundles them INTO main.js (no external require)
- Modules in `external` → Vite does NOT bundle, creates `require('module-name')` in output
- **PROBLEM:** External modules need node_modules folder at runtime, but Forge doesn't copy it

### 3. The Bundled Code Contains External Requires

Inspecting `.vite/build/main.js` shows:
```javascript
const qr=require("electron-updater")  // If electron-updater is external
const Ac=require("@libsql/client")     // If @libsql/client is external
```

These `require()` calls will FAIL at runtime because there's no `node_modules/` directory.

---

## ❌ Solutions That DO NOT WORK (Stop Trying These)

### 1. ASAR Configuration Changes
```typescript
// ❌ DOES NOT WORK - Tried all variations
packagerConfig: {
  asar: true,  // Doesn't help
  asar: false, // Doesn't help
  asar: {
    unpack: '**/node_modules/{list}/**/*'  // Doesn't help - no node_modules to unpack
  }
}
```

**Why it fails:** ASAR config only affects how files are archived. Since node_modules isn't being copied in the first place, ASAR settings are irrelevant.

### 2. AutoUnpackNativesPlugin
```typescript
// ❌ DOES NOT WORK
plugins: [
  new AutoUnpackNativesPlugin({})
]
```

**Why it fails:**
- Plugin looks for `**/*.node` files to unpack from ASAR
- But Vite plugin doesn't copy node_modules at all
- Plugin creates no `app.asar.unpacked` directory
- Verified by checking `out/.../resources/` - no unpacked folder exists

### 3. Prune Configuration
```typescript
// ❌ DOES NOT WORK
packagerConfig: {
  prune: false  // Doesn't force node_modules to be copied
}
```

**Why it fails:** The `prune` option only affects the Webpack plugin behavior. Vite plugin has completely different packaging logic.

### 4. Moving Modules Between nativeModules and External Arrays
```typescript
// ❌ DOES NOT WORK (circular debugging trap)
const nativeModules = [
  'electron-updater',  // ❌ If here, it's external → not copied → runtime error
];

const bundledModules = [
  // ❌ If electron-updater not here AND not in nativeModules,
  // it's in line 52's filter → still external
];
```

**Why it fails:** Simply moving items between arrays doesn't solve the core issue - external modules aren't being copied.

### 5. Ignore Patterns
```typescript
// ❌ DOES NOT WORK - Makes things worse
packagerConfig: {
  ignore: [
    /^\/\.vite($|\/)/,  // ❌ This blocks your built code!
  ]
}
```

**Why it fails:** Causes error: "The main entry point to your app was not found"

---

## ✅ Working Solution (Use This)

The solution has TWO parts based on module type:

### Part 1: For Pure JavaScript Modules (No Native Bindings)

**Example:** `electron-updater`, `lodash`, `uuid`, etc.

**Solution:** Add to `bundledModules` array in `vite.base.config.ts`:

```typescript
const bundledModules = [
  'electron-updater',  // ✅ Bundle it into main.js
  'uuid',
  // Any module that is pure JS without .node files
];
```

**How to verify a module is pure JS:**
```bash
find node_modules/{module-name} -name "*.node"
# If no results, it's pure JS and can be bundled
```

**Result:** The module's code is bundled directly into `main.js`. No external require, no runtime error.

### Part 2: For Native Modules (Has .node Files)

**Example:** `@libsql/client`, `nodejs-polars`, `better-sqlite3`, etc.

**These CANNOT be bundled by Vite.** You must use the `postPackage` hook.

**Solution:** Add hook to `forge.config.ts`:

```typescript
import { spawn } from 'child_process';

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,  // Keep false for easier debugging
    icon: './src/images/marriott_logo',
    prune: false,
  },
  hooks: {
    postPackage: async (_config, options) => {
      // Find the app resources path
      const appPath = options.outputPaths[0] + '/resources/app';

      return new Promise<void>((resolve, reject) => {
        // List ALL native/external dependencies here
        const externalDeps = [
          '@libsql/client',
          'nodejs-polars',
          'node-machine-id',
          'systeminformation',
          'electron-squirrel-startup',
        ];

        console.log('Installing external native dependencies to:', appPath);
        const npm = spawn('npm', ['install', '--production', ...externalDeps], {
          cwd: appPath,
          stdio: 'inherit',
          shell: true,
        });

        npm.on('close', (code) => {
          if (code === 0) {
            console.log('External dependencies installed successfully');
            resolve();
          } else {
            reject(new Error(`npm install failed with code: ${code}`));
          }
        });

        npm.on('error', (err) => {
          reject(err);
        });
      });
    },
  },
  // ... rest of config
};
```

**CRITICAL:** Use `postPackage` hook, NOT `packageAfterPrune`. The `packageAfterPrune` hook does not run with the Vite plugin.

**What this does:**
1. Runs AFTER Forge creates the package structure
2. Runs `npm install` for specified modules directly in the build directory
3. Creates `node_modules/` folder with ONLY the needed native modules
4. These modules are then packaged into the final .exe installer

**How to verify it works:**
```bash
# After running npm run package
ls "out/PS Loader 2.0-win32-x64/resources/app/node_modules"
# Should show: @libsql, nodejs-polars, etc.
```

---

## Configuration Reference

### vite.base.config.ts (Current Working State)

```typescript
import { builtinModules } from 'node:module';
import pkg from './package.json';

export const builtins = ['electron', ...builtinModules.map((m) => [m, `node:${m}`]).flat()];

// Modules that WILL be bundled into main.js/renderer.js by Vite
const bundledModules = [
  'electron-updater',  // ✅ Pure JS, bundled
  'three',
  'framer-motion',
  '@react-three/fiber',
  '@react-three/drei',
  '@mui/x-data-grid-premium',
  '@mui/material',
  '@mui/icons-material',
  '@emotion/react',
  '@emotion/styled',
  'react',
  'react-dom',
  'react-router-dom',
  'csv-parse',
  'xlsx',
  'uuid',
  '@faker-js/faker',
  '@fontsource/roboto'
];

// Modules that CANNOT be bundled (have native .node files)
// These will be installed via packageAfterPrune hook
const nativeModules = [
  'electron-squirrel-startup',
  '@libsql/client',
  'node-machine-id',
  'systeminformation',
  'nodejs-polars',
  'better-sqlite3'
];

// This creates the external array
export const external = [
  ...builtins,
  ...nativeModules,
  // All other dependencies NOT in bundledModules
  ...Object.keys('dependencies' in pkg ? (pkg.dependencies as Record<string, unknown>) : {})
    .filter(dep => !bundledModules.includes(dep) && !nativeModules.includes(dep))
];
```

### forge.config.ts (Current Working State)

See Part 2 solution above for the complete `hooks` configuration.

---

## Debugging Steps for Future Issues

### If you get "Cannot find module 'X'" error:

1. **Check if module has native bindings:**
   ```bash
   find node_modules/X -name "*.node"
   ```

2. **If NO .node files found (pure JS):**
   - Add to `bundledModules` in `vite.base.config.ts`
   - Rebuild and test

3. **If .node files found (native module):**
   - Add to `externalDeps` array in `packageAfterPrune` hook in `forge.config.ts`
   - **CRITICAL:** Also add to `nativeModules` array in `vite.base.config.ts`
   - Rebuild and test

4. **⚠️ CRITICAL: Check for scoped package sub-dependencies:**
   - If the module is a scoped package (e.g., `@libsql/client`), check for sub-packages:
     ```bash
     ls node_modules/@libsql/
     # Example output: client, core, hrana-client, isomorphic-fetch, isomorphic-ws, win32-x64-msvc
     ```
   - **ALL sub-packages must be added to both:**
     - `externalDeps` in `forge.config.ts` (for packageAfterPrune hook)
     - `nativeModules` in `vite.base.config.ts` (for externalization)
   - Example for `@libsql/client`:
     ```typescript
     // In forge.config.ts
     const externalDeps = [
       '@libsql/client',
       '@libsql/core',
       '@libsql/hrana-client',
       '@libsql/isomorphic-fetch',
       '@libsql/isomorphic-ws',
       '@libsql/win32-x64-msvc',  // Platform-specific native module
       // ... other deps
     ];

     // In vite.base.config.ts
     const nativeModules = [
       '@libsql/client',
       '@libsql/core',
       '@libsql/hrana-client',
       '@libsql/isomorphic-fetch',
       '@libsql/isomorphic-ws',
       '@libsql/win32-x64-msvc',
       // ... other modules
     ];
     ```

5. **Verify the fix worked:**
   ```bash
   # After npm run package
   grep -o "require.*X" .vite/build/main.js
   # If pure JS: Should show nothing (bundled)
   # If native: Should show require, but check:
   ls "out/PS Loader 2.0-win32-x64/resources/app/node_modules/X"
   # Should exist

   # For scoped packages, verify ALL sub-packages:
   ls "out/PS Loader 2.0-win32-x64/resources/app/node_modules/@libsql/"
   # Should show: client, core, hrana-client, etc.
   ```

---

## Common Pitfall: Scoped Packages with Sub-Dependencies

### Problem
When using scoped packages like `@libsql/client`, npm installs the main package AND multiple sub-packages in the `node_modules/@libsql/` directory. If you only add `@libsql/client` to the `externalDeps` array, npm will install it in the build directory, but the sub-packages may not all be installed correctly, leading to "Cannot find module" errors.

### Example Error
```
Error: Cannot find module '@libsql/client'
Require stack:
  - C:\Users\{user}\AppData\Local\{app}\app-{version}\resources\app\.vite\build\main.js
```

### Root Cause
The `@libsql/client` package has internal dependencies on:
- `@libsql/core` - Core library
- `@libsql/hrana-client` - Hrana protocol client
- `@libsql/isomorphic-fetch` - Fetch polyfill
- `@libsql/isomorphic-ws` - WebSocket polyfill
- `libsql` - Native bindings wrapper (uses @neon-rs/load)
- `@libsql/win32-x64-msvc` - Platform-specific native module (Windows x64)
- `js-base64` - Base64 encoding utility
- `promise-limit` - Promise concurrency utility
- `@neon-rs/load` - Neon native module loader
- `detect-libc` - libc detection utility

When the `packageAfterPrune` hook runs `npm install @libsql/client`, it may not properly resolve all the sub-package dependencies and their transitive dependencies in the monorepo structure.

### Solution
**Explicitly list ALL sub-packages** in both configuration files:

1. In `forge.config.ts`:
```typescript
const externalDeps = [
  '@libsql/client',
  '@libsql/core',
  '@libsql/hrana-client',
  '@libsql/isomorphic-fetch',
  '@libsql/isomorphic-ws',
  '@libsql/win32-x64-msvc',
  'libsql',
  'js-base64',
  'promise-limit',
  '@neon-rs/load',
  'detect-libc',
  // ... other deps
];
```

2. In `vite.base.config.ts`:
```typescript
const nativeModules = [
  '@libsql/client',
  '@libsql/core',
  '@libsql/hrana-client',
  '@libsql/isomorphic-fetch',
  '@libsql/isomorphic-ws',
  '@libsql/win32-x64-msvc',
  'libsql',
  'js-base64',
  'promise-limit',
  '@neon-rs/load',
  'detect-libc',
  // ... other modules
];
```

### How to Find Sub-Packages and Dependencies
```bash
# 1. List all sub-packages for a scoped package
ls node_modules/@libsql/
# or on Windows
dir node_modules\@libsql\

# 2. Check which ones have native bindings
find node_modules/@libsql -name "*.node"
# or on Windows
dir /s /b node_modules\@libsql\*.node

# 3. Check package.json for dependencies
cat node_modules/@libsql/client/package.json | grep -A 10 '"dependencies"'
# or on Windows PowerShell
Get-Content node_modules\@libsql\client\package.json | Select-String -Pattern '"dependencies"' -Context 0,10

# 4. Check for transitive dependencies (dependencies of dependencies)
npm list @libsql/client --all
```

### Verification
After packaging, verify all packages and dependencies are present:
```bash
# Check scoped packages
ls "out/PS Loader 2.0-win32-x64/resources/app/node_modules/@libsql/"
# Should show: client, core, hrana-client, isomorphic-fetch, isomorphic-ws, win32-x64-msvc

# Check additional dependencies
ls "out/PS Loader 2.0-win32-x64/resources/app/node_modules/"
# Should include: libsql, js-base64, promise-limit, @neon-rs, detect-libc, etc.
```

---

## Related GitHub Issues

- Issue #3917: "Vite: External modules not included in packaging"
- Issue #3738: "Forge make combined with vite is creating an incomplete asar"
- Status: Known issue, workaround is the `packageAfterPrune` hook

---

## Key Lessons for LLMs

1. **Don't trust `prune: false` to copy node_modules** - It doesn't work with Vite plugin
2. **Don't try ASAR configuration changes** - The problem is before ASAR, not during
3. **Don't add/remove AutoUnpackNativesPlugin** - It's irrelevant when node_modules doesn't exist
4. **Don't just move modules between arrays** - Understand bundled vs external vs native
5. **Always verify by inspecting the package output** - Don't assume a config change worked
6. **The error path shows it's a packaged app issue** - If path includes `AppData\Local\{app}\app-{version}`, it's a packaging problem
7. **Use `postPackage` hook for native modules** - This is the ONLY working solution for modules that can't be bundled. **DO NOT use `packageAfterPrune`** - it does not run with the Vite plugin!
8. **⚠️ CRITICAL: Check for scoped package sub-dependencies AND transitive dependencies** - Scoped packages like `@libsql/client` have:
   - Sub-packages within the scope (e.g., `@libsql/core`, `@libsql/hrana-client`)
   - Regular dependencies (e.g., `libsql`, `js-base64`, `promise-limit`)
   - Transitive dependencies (dependencies of dependencies, e.g., `@neon-rs/load`, `detect-libc`)

   ALL of these MUST be explicitly listed in BOTH `forge.config.ts` AND `vite.base.config.ts`. Use:
   - `ls node_modules/@scope/` to find sub-packages
   - `cat node_modules/@scope/package/package.json` to find direct dependencies
   - `npm list <package> --all` to find ALL transitive dependencies

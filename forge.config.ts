import 'dotenv/config';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
// import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { cpSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    icon: './src/images/marriott_logo',
    prune: false,  // Keep false - postPackage hook needs to install deps
    ignore: [
      /^\/\.git($|\/)/,
      /^\/\.vscode($|\/)/,
      /^\/node_modules($|\/)/,  // Exclude initial node_modules - postPackage installs what's needed
      /^\/src($|\/)/,           // Source files not needed in package
      /^\/out($|\/)/,
      /\.ts$/,
      /\.tsx$/,
      /\.map$/,
      /^\/vite.*\.config\.ts$/,
      /^\/tsconfig\.json$/,
      /^\/forge\.config\.ts$/,
      /^\/\.eslintrc/,
      /\.md$/,
      /^\/\.env/,
    ],
  },
  rebuildConfig: {},
  hooks: {
    postPackage: async (_config, options) => {
      console.log('\n========================================');
      console.log('POST PACKAGE HOOK STARTED');
      console.log('Platform:', options.platform);
      console.log('Arch:', options.arch);
      console.log('Output paths:', options.outputPaths);
      console.log('========================================\n');

      // Find the app resources path
      const appPath = options.outputPaths[0] + '/resources/app';
      const sourceNodeModules = join(process.cwd(), 'node_modules');
      const targetNodeModules = join(appPath, 'node_modules');

      // List of external native dependencies that need to be copied
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
        'nodejs-polars',
        'node-machine-id',
        'systeminformation',
        'electron-squirrel-startup',
      ];

      console.log('Copying dependencies from:', sourceNodeModules);
      console.log('To:', targetNodeModules);
      console.log('Dependencies:', externalDeps.join(', '));

      try {
        // Create node_modules directory in the package
        mkdirSync(targetNodeModules, { recursive: true });

        // Copy each dependency from dev node_modules to package
        for (const dep of externalDeps) {
          const sourcePath = join(sourceNodeModules, dep);
          const targetPath = join(targetNodeModules, dep);

          console.log(`Copying ${dep}...`);
          cpSync(sourcePath, targetPath, { recursive: true });
        }

        console.log('\n========================================');
        console.log('✓ Dependencies copied successfully');
        console.log('========================================\n');

        // Create app-update.yml for electron-updater
        const updateYml = `provider: github
owner: rporins
repo: PSLoader2.0
updaterCacheDirName: ps_loader-updater`;

        // Write to resources/ (for Squirrel installer)
        const resourcesPath = options.outputPaths[0] + '/resources';
        const updateYmlPathResources = join(resourcesPath, 'app-update.yml');
        console.log('Creating app-update.yml at:', updateYmlPathResources);
        writeFileSync(updateYmlPathResources, updateYml, 'utf8');

        // Also write to resources/app/ (backup location)
        const updateYmlPathApp = join(appPath, 'app-update.yml');
        console.log('Creating app-update.yml at:', updateYmlPathApp);
        writeFileSync(updateYmlPathApp, updateYml, 'utf8');

        console.log('✓ app-update.yml created successfully\n');

      } catch (err) {
        console.error('\n========================================');
        console.error('✗ Copy failed:', err);
        console.error('========================================\n');
        throw err;
      }
    },
    postMake: async (_config, makeResults) => {
      console.log('\n========================================');
      console.log('POST MAKE HOOK - Generating latest.yml');
      console.log('========================================\n');

      const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
      const version = packageJson.version;

      // Find Squirrel.Windows artifacts
      for (const result of makeResults) {
        if (result.platform === 'win32' && result.artifacts.some(a => a.includes('squirrel.windows'))) {
          const squirrelDir = result.artifacts.find(a => a.includes('squirrel.windows') && a.endsWith('.nupkg'))?.replace(/[^/\\]+$/, '') || '';

          if (!squirrelDir) continue;

          try {
            // Find the .nupkg file
            const files = readdirSync(squirrelDir);
            const nupkgFile = files.find(f => f.endsWith('-full.nupkg'));

            if (!nupkgFile) {
              console.log('⚠ No .nupkg file found in:', squirrelDir);
              continue;
            }

            // Calculate SHA512 hash
            const nupkgPath = join(squirrelDir, nupkgFile);
            const fileBuffer = readFileSync(nupkgPath);
            const hash = createHash('sha512').update(fileBuffer).digest('base64');

            // Get file size
            const stats = statSync(nupkgPath);
            const size = stats.size;

            // Generate latest.yml
            const latestYml = `version: ${version}
files:
  - url: ${nupkgFile}
    sha512: ${hash}
    size: ${size}
path: ${nupkgFile}
sha512: ${hash}
releaseDate: ${new Date().toISOString()}
`;

            // Write latest.yml
            const latestYmlPath = join(squirrelDir, 'latest.yml');
            writeFileSync(latestYmlPath, latestYml, 'utf8');

            console.log('✓ latest.yml generated at:', latestYmlPath);
            console.log('\nContent:');
            console.log(latestYml);
            console.log('IMPORTANT: Upload latest.yml along with the installer to your GitHub release!\n');

          } catch (err) {
            console.error('✗ Failed to generate latest.yml:', err);
          }
        }
      }

      console.log('========================================\n');
    },
  },
  makers: [
    new MakerSquirrel({
      // Per-user install - no admin rights required
      // Installs to: %LocalAppData%\ps-loader
      setupIcon: './src/images/marriott_logo.ico',
      loadingGif: undefined, // Optional: add a loading animation path
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({})
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'rporins',
          name: 'PSLoader2.0'
        },
        prerelease: false,
        draft: true
      }
    }
  ],
  plugins: [
    // Removed AutoUnpackNativesPlugin - not needed when asar is disabled
    // new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: false,
      [FuseV1Options.OnlyLoadAppFromAsar]: false
    }),
  ],
};

export default config;

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
import { spawn } from 'child_process';

const config: ForgeConfig = {
  packagerConfig: {
    asar: false,
    icon: './src/images/marriott_logo',
    prune: false,
  },
  rebuildConfig: {},
  hooks: {
    packageAfterPrune: async (_config, buildPath) => {
      return new Promise<void>((resolve, reject) => {
        // Install external native dependencies that weren't bundled by Vite
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

        console.log('Installing external native dependencies...');
        const npm = spawn('npm', ['install', '--no-package-lock', '--no-save', ...externalDeps], {
          cwd: buildPath,
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

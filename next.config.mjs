import fs from "node:fs";

// Normalisation conditionnelle Windows (FAT32 dev local) :
// fs.readlink sur un fichier ordinaire lève EISDIR au lieu de EINVAL sur certains volumes Windows/FAT32,
// ce qui fait échouer le traçage @vercel/nft et next-trace-entrypoints-plugin lors du build Next.js.
if (process.platform === "win32") {
  if (fs.readlink) {
    const origReadlink = fs.readlink;
    fs.readlink = function (path, options, callback) {
      const cb = typeof options === "function" ? options : callback;
      const opts = typeof options === "function" ? {} : options;
      origReadlink.call(fs, path, opts, (err, linkString) => {
        if (err && err.code === "EISDIR") {
          const einval = Object.assign(new Error("EINVAL: invalid argument, readlink"), { code: "EINVAL" });
          return cb(einval);
        }
        cb(err, linkString);
      });
    };
  }

  if (fs.readlinkSync) {
    const origReadlinkSync = fs.readlinkSync;
    fs.readlinkSync = function (path, options) {
      try {
        return origReadlinkSync.call(fs, path, options);
      } catch (err) {
        if (err && err.code === "EISDIR") {
          throw Object.assign(new Error("EINVAL: invalid argument, readlink"), { code: "EINVAL" });
        }
        throw err;
      }
    };
  }

  if (fs.promises && fs.promises.readlink) {
    const origPromisesReadlink = fs.promises.readlink;
    fs.promises.readlink = async function (path, options) {
      try {
        return await origPromisesReadlink.call(fs.promises, path, options);
      } catch (err) {
        if (err && err.code === "EISDIR") {
          throw Object.assign(new Error("EINVAL: invalid argument, readlink"), { code: "EINVAL" });
        }
        throw err;
      }
    };
  }
}

const isWindows = process.platform === "win32";
const isProd = process.env.NODE_ENV === "production";

// CSP durcie : 'unsafe-eval' strictement exclu en production ; 'unsafe-inline' maintenu pour préserver le runtime Next.js et les pages SSG sans casser l'hydratation
const cspHeader = [
  "default-src 'self'",
  isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains", // Retrait de preload pour activation progressive sécurisée
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  // Configuration Turbopack & Webpack :
  // Sous Windows (volumes FAT32 sans support des points de jonction NTFS), webpack est activé pour les builds --webpack.
  // Sous Linux/CI (GitHub Actions / Vercel), turbopack: {} est utilisé sans clé webpack pour que Turbopack s'exécute nativement.
  ...(isWindows
    ? {
        webpack: (config) => {
          config.resolve.symlinks = false;
          config.cache = false;
          return config;
        },
      }
    : {
        turbopack: {},
      }),
};

export default nextConfig;

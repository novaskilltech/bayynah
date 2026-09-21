import fs from "node:fs";

// Normalisation Windows FAT32 : fs.readlink sur un fichier ordinaire lève EISDIR au lieu de EINVAL,
// ce qui fait échouer le traçage @vercel/nft et next-trace-entrypoints-plugin lors du build Next.js.
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client"],
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
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.cache = false;
    return config;
  },
};

export default nextConfig;

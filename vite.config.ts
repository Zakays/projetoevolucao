// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import react from '@vitejs/plugin-react-swc';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { componentTagger } from 'lovable-tagger';
// Use `nodePath` (imported above) instead of `path` to avoid name collisions.

import { parse } from '@babel/parser';
import * as _traverse from '@babel/traverse';
import * as _generate from '@babel/generator';
import * as t from '@babel/types';


// CJS/ESM interop for Babel libs
// Babel packages have messy CJS/ESM interop; silence strict 'no-explicit-any' here as the runtime behavior is well-known
 
const traverse: any = ( (_traverse as any).default ?? (_traverse as any) );
 
const generate: any = ( (_generate as any).default ?? (_generate as any) );

function cdnPrefixImages(): Plugin {
  const DEBUG = process.env.CDN_IMG_DEBUG === '1';
  let publicDir = '';              // absolute path to Vite public dir
  const imageSet = new Set<string>(); // stores normalized '/images/...' paths

  const isAbsolute = (p: string) =>
    /^(?:[a-z]+:)?\/\//i.test(p) || p.startsWith('data:') || p.startsWith('blob:');

  // normalize a ref like './images/x.png', '../images/x.png', '/images/x.png' -> '/images/x.png'
  const normalizeRef = (p: string) => {
    let s = p.trim();
    // quick bail-outs
    if (isAbsolute(s)) return s;
    // strip leading ./ and any ../ segments (we treat public/ as root at runtime)
    s = s.replace(/^(\.\/)+/, '');
    while (s.startsWith('../')) s = s.slice(3);
    if (s.startsWith('/')) s = s.slice(1);
    // ensure it starts with images/
    if (!s.startsWith('images/')) return p; // not under images → leave as is
    return '/' + s; // canonical: '/images/...'
  };

  const toCDN = (p: string, cdn: string) => {
    const n = normalizeRef(p);
    if (isAbsolute(n)) return n;
    if (!n.startsWith('/images/')) return p;           // not our folder
    if (!imageSet.has(n)) return p;                    // not an existing file
    const base = cdn.endsWith('/') ? cdn : cdn + '/';
    return base + n.slice(1);                          // 'https://cdn/.../images/..'
  };

  const rewriteSrcsetList = (value: string, cdn: string) =>
    value
      .split(',')
      .map((part) => {
        const [url, desc] = part.trim().split(/\s+/, 2);
        const out = toCDN(url, cdn);
        return desc ? `${out} ${desc}` : out;
      })
      .join(', ');

  const rewriteHtml = (html: string, cdn: string) => {
    // src / href
    html = html.replace(
      /(src|href)\s*=\s*(['"])([^'"]+)\2/g,
      (_m: string, k: string, q: string, p: string) => `${k}=${q}${toCDN(p, cdn)}${q}`
    );
    // srcset
    html = html.replace(
      /(srcset)\s*=\s*(['"])([^'"]+)\2/g,
      (_m: string, k: string, q: string, list: string) => `${k}=${q}${rewriteSrcsetList(list, cdn)}${q}`
    );
    return html;
  };

  const rewriteCssUrls = (code: string, cdn: string) =>
    code.replace(/url\((['"]?)([^'\")]+)\1\)/g, (_m: string, q: string, p: string) => `url(${q}${toCDN(p, cdn)}${q})`);

  const rewriteJsxAst = (code: string, id: string, cdn: string) => {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    let rewrites = 0;

    traverse(ast, {
      JSXAttribute(p: any) {
        const name = (p.node.name as t.JSXIdentifier).name;
        const isSrc = name === 'src' || name === 'href';
        const isSrcSet = name === 'srcSet' || name === 'srcset';
        if (!isSrc && !isSrcSet) return;

        const val = p.node.value;
        if (!val) return;

        if (t.isStringLiteral(val)) {
          const before = val.value;
          val.value = isSrc ? toCDN(val.value, cdn) : rewriteSrcsetList(val.value, cdn);
          if (val.value !== before) rewrites++;
          return;
        }
        if (t.isJSXExpressionContainer(val) && t.isStringLiteral(val.expression)) {
          const before = val.expression.value;
          val.expression.value = isSrc
            ? toCDN(val.expression.value, cdn)
            : rewriteSrcsetList(val.expression.value, cdn);
          if (val.expression.value !== before) rewrites++;
        }
      },

      StringLiteral(p: any) {
        // skip object keys: { "image": "..." }
        if (t.isObjectProperty(p.parent) && p.parentKey === 'key' && !p.parent.computed) return;
        // skip import/export sources
        if (t.isImportDeclaration(p.parent) || t.isExportAllDeclaration(p.parent) || t.isExportNamedDeclaration(p.parent)) return;
        // skip inside JSX attribute (already handled)
        if (p.findParent((p2: any) => p2.isJSXAttribute())) return;

        const before = p.node.value;
        const after = toCDN(before, cdn);
        if (after !== before) { p.node.value = after; rewrites++; }
      },

      TemplateLiteral(p: any) {
        // handle `"/images/foo.png"` as template with NO expressions
        if (p.node.expressions.length) return;
        const raw = p.node.quasis.map((q: t.TemplateElement) => q.value.cooked ?? q.value.raw).join('');
        const after = toCDN(raw, cdn);
        if (after !== raw) {
          p.replaceWith(t.stringLiteral(after));
          rewrites++;
        }
      },

    });

    if (!rewrites) return null;
    const out = generate(ast, { retainLines: true, sourceMaps: false }, code).code;
    if (DEBUG) console.log(`[cdn] ${id} → ${rewrites} rewrites`);
    return out;
  };

  async function collectPublicImagesFrom(dir: string) {
    // Recursively collect every file under public/images into imageSet as '/images/relpath'
    const imagesDir = nodePath.join(dir, 'images');
    const stack = [imagesDir];
    while (stack.length) {
      const cur = stack.pop()!;
      type Dirent = import('fs').Dirent;
      let entries: Dirent[] = [];
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch {
        continue; // images/ may not exist
      }
      for (const ent of entries) {
        const full = nodePath.join(cur, ent.name);
        if (ent.isDirectory()) {
          stack.push(full);
        } else if (ent.isFile()) {
          const rel = nodePath.relative(dir, full).split(nodePath.sep).join('/');
          const canonical = '/' + rel; // '/images/...'
          imageSet.add(canonical);
          // also add variant without leading slash for safety
          imageSet.add(canonical.slice(1)); // 'images/...'
        }
      }
    }
  }

  return {
    name: 'cdn-prefix-images-existing',
    apply: 'build',
    enforce: 'pre', // run before @vitejs/plugin-react

    configResolved(cfg) {
      publicDir = cfg.publicDir; // absolute
      if (DEBUG) console.log('[cdn] publicDir =', publicDir);
    },

    async buildStart() {
      await collectPublicImagesFrom(publicDir);
      if (DEBUG) console.log('[cdn] images found:', imageSet.size);
    },

    transformIndexHtml(html) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return html;
      const out = rewriteHtml(html, cdn);
      if (DEBUG) console.log('[cdn] transformIndexHtml done');
      return out;
    },

    transform(code, id) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return null;

      if (/\.(jsx|tsx)$/.test(id)) {
        const out = rewriteJsxAst(code, id, cdn);
        return out ? { code: out, map: null } : null;
      }

      if (/\.(css|scss|sass|less|styl)$/i.test(id)) {
        const out = rewriteCssUrls(code, cdn);
        return out === code ? null : { code: out, map: null };
      }

      return null;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
          proxyTimeout: 30000,
          timeout: 30000,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg','favicon.ico','robots.txt','placeholder.svg','icon-192.png','icon-512.png'],
        manifest: {
          name: 'GlowUp Organizer',
          short_name: 'GlowUp',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#111827',
          icons: [
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: /\/api\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
                networkTimeoutSeconds: 10
              }
            },
            {
              urlPattern: /\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }
              }
            }
          ]
        }
      }),
      mode === 'development' &&
      componentTagger(),
      cdnPrefixImages(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": nodePath.resolve(__dirname, "./src"),
        // Proxy react-router-dom to our wrapper
        "react-router-dom": nodePath.resolve(__dirname, "./src/lib/react-router-dom-proxy.tsx"),
        // Original react-router-dom under a different name
        "react-router-dom-original": "react-router-dom",
      },
    },
    define: {
      // Define environment variables for build-time configuration
      // In production, this will be false by default unless explicitly set to 'true'
      // In development and test, this will be true by default
      __ROUTE_MESSAGING_ENABLED__: JSON.stringify(
        mode === 'production' 
          ? process.env.VITE_ENABLE_ROUTE_MESSAGING === 'true'
          : process.env.VITE_ENABLE_ROUTE_MESSAGING !== 'false'
      ),
    },
  }
});

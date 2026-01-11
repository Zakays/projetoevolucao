// vite.config.ts
import { defineConfig } from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/@vitejs/plugin-react-swc/index.js";
import fs from "node:fs/promises";
import nodePath from "node:path";
import { componentTagger } from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/lovable-tagger/dist/index.js";
import { parse } from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/@babel/parser/lib/index.js";
import _traverse from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/@babel/traverse/lib/index.js";
import _generate from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/@babel/generator/lib/index.js";
import * as t from "file:///C:/Users/maria/Downloads/projetoevolucao/node_modules/@babel/types/lib/index.js";
var __vite_injected_original_dirname = "C:\\Users\\maria\\Downloads\\projetoevolucao";
var traverse = _traverse.default ?? _traverse;
var generate = _generate.default ?? _generate;
function cdnPrefixImages() {
  const DEBUG = process.env.CDN_IMG_DEBUG === "1";
  let publicDir = "";
  const imageSet = /* @__PURE__ */ new Set();
  const isAbsolute = (p) => /^(?:[a-z]+:)?\/\//i.test(p) || p.startsWith("data:") || p.startsWith("blob:");
  const normalizeRef = (p) => {
    let s = p.trim();
    if (isAbsolute(s)) return s;
    s = s.replace(/^(\.\/)+/, "");
    while (s.startsWith("../")) s = s.slice(3);
    if (s.startsWith("/")) s = s.slice(1);
    if (!s.startsWith("images/")) return p;
    return "/" + s;
  };
  const toCDN = (p, cdn) => {
    const n = normalizeRef(p);
    if (isAbsolute(n)) return n;
    if (!n.startsWith("/images/")) return p;
    if (!imageSet.has(n)) return p;
    const base = cdn.endsWith("/") ? cdn : cdn + "/";
    return base + n.slice(1);
  };
  const rewriteSrcsetList = (value, cdn) => value.split(",").map((part) => {
    const [url, desc] = part.trim().split(/\s+/, 2);
    const out = toCDN(url, cdn);
    return desc ? `${out} ${desc}` : out;
  }).join(", ");
  const rewriteHtml = (html, cdn) => {
    html = html.replace(
      /(src|href)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, p) => `${k}=${q}${toCDN(p, cdn)}${q}`
    );
    html = html.replace(
      /(srcset)\s*=\s*(['"])([^'"]+)\2/g,
      (_m, k, q, list) => `${k}=${q}${rewriteSrcsetList(list, cdn)}${q}`
    );
    return html;
  };
  const rewriteCssUrls = (code, cdn) => code.replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, p) => `url(${q}${toCDN(p, cdn)}${q})`);
  const rewriteJsxAst = (code, id, cdn) => {
    const ast = parse(code, { sourceType: "module", plugins: ["typescript", "jsx"] });
    let rewrites = 0;
    traverse(ast, {
      JSXAttribute(p) {
        const name = p.node.name.name;
        const isSrc = name === "src" || name === "href";
        const isSrcSet = name === "srcSet" || name === "srcset";
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
          val.expression.value = isSrc ? toCDN(val.expression.value, cdn) : rewriteSrcsetList(val.expression.value, cdn);
          if (val.expression.value !== before) rewrites++;
        }
      },
      StringLiteral(p) {
        if (t.isObjectProperty(p.parent) && p.parentKey === "key" && !p.parent.computed) return;
        if (t.isImportDeclaration(p.parent) || t.isExportAllDeclaration(p.parent) || t.isExportNamedDeclaration(p.parent)) return;
        if (p.findParent((p2) => p2.isJSXAttribute())) return;
        const before = p.node.value;
        const after = toCDN(before, cdn);
        if (after !== before) {
          p.node.value = after;
          rewrites++;
        }
      },
      TemplateLiteral(p) {
        if (p.node.expressions.length) return;
        const raw = p.node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("");
        const after = toCDN(raw, cdn);
        if (after !== raw) {
          p.replaceWith(t.stringLiteral(after));
          rewrites++;
        }
      }
    });
    if (!rewrites) return null;
    const out = generate(ast, { retainLines: true, sourceMaps: false }, code).code;
    if (DEBUG) console.log(`[cdn] ${id} \u2192 ${rewrites} rewrites`);
    return out;
  };
  async function collectPublicImagesFrom(dir) {
    const imagesDir = nodePath.join(dir, "images");
    const stack = [imagesDir];
    while (stack.length) {
      const cur = stack.pop();
      let entries = [];
      try {
        entries = await fs.readdir(cur, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const ent of entries) {
        const full = nodePath.join(cur, ent.name);
        if (ent.isDirectory()) {
          stack.push(full);
        } else if (ent.isFile()) {
          const rel = nodePath.relative(dir, full).split(nodePath.sep).join("/");
          const canonical = "/" + rel;
          imageSet.add(canonical);
          imageSet.add(canonical.slice(1));
        }
      }
    }
  }
  return {
    name: "cdn-prefix-images-existing",
    apply: "build",
    enforce: "pre",
    // run before @vitejs/plugin-react
    configResolved(cfg) {
      publicDir = cfg.publicDir;
      if (DEBUG) console.log("[cdn] publicDir =", publicDir);
    },
    async buildStart() {
      await collectPublicImagesFrom(publicDir);
      if (DEBUG) console.log("[cdn] images found:", imageSet.size);
    },
    transformIndexHtml(html) {
      const cdn = process.env.CDN_IMG_PREFIX;
      if (!cdn) return html;
      const out = rewriteHtml(html, cdn);
      if (DEBUG) console.log("[cdn] transformIndexHtml done");
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
    }
  };
}
var vite_config_default = defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3001",
          changeOrigin: true,
          secure: false,
          proxyTimeout: 3e4,
          timeout: 3e4
        }
      }
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      cdnPrefixImages()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": nodePath.resolve(__vite_injected_original_dirname, "./src"),
        // Proxy react-router-dom to our wrapper
        "react-router-dom": nodePath.resolve(__vite_injected_original_dirname, "./src/lib/react-router-dom-proxy.tsx"),
        // Original react-router-dom under a different name
        "react-router-dom-original": "react-router-dom"
      }
    },
    define: {
      // Define environment variables for build-time configuration
      // In production, this will be false by default unless explicitly set to 'true'
      // In development and test, this will be true by default
      __ROUTE_MESSAGING_ENABLED__: JSON.stringify(
        mode === "production" ? process.env.VITE_ENABLE_ROUTE_MESSAGING === "true" : process.env.VITE_ENABLE_ROUTE_MESSAGING !== "false"
      )
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYXJpYVxcXFxEb3dubG9hZHNcXFxccHJvamV0b2V2b2x1Y2FvXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxtYXJpYVxcXFxEb3dubG9hZHNcXFxccHJvamV0b2V2b2x1Y2FvXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9tYXJpYS9Eb3dubG9hZHMvcHJvamV0b2V2b2x1Y2FvL3ZpdGUuY29uZmlnLnRzXCI7Ly8gdml0ZS5jb25maWcudHNcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgdHlwZSBQbHVnaW4gfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0IGZzIGZyb20gJ25vZGU6ZnMvcHJvbWlzZXMnO1xuaW1wb3J0IG5vZGVQYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tICdsb3ZhYmxlLXRhZ2dlcic7XG4vLyBVc2UgYG5vZGVQYXRoYCAoaW1wb3J0ZWQgYWJvdmUpIGluc3RlYWQgb2YgYHBhdGhgIHRvIGF2b2lkIG5hbWUgY29sbGlzaW9ucy5cblxuaW1wb3J0IHsgcGFyc2UgfSBmcm9tICdAYmFiZWwvcGFyc2VyJztcbmltcG9ydCBfdHJhdmVyc2UgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCBfZ2VuZXJhdGUgZnJvbSAnQGJhYmVsL2dlbmVyYXRvcic7XG5pbXBvcnQgKiBhcyB0IGZyb20gJ0BiYWJlbC90eXBlcyc7XG5cblxuLy8gQ0pTL0VTTSBpbnRlcm9wIGZvciBCYWJlbCBsaWJzXG4vLyBCYWJlbCBwYWNrYWdlcyBoYXZlIG1lc3N5IENKUy9FU00gaW50ZXJvcDsgc2lsZW5jZSBzdHJpY3QgJ25vLWV4cGxpY2l0LWFueScgaGVyZSBhcyB0aGUgcnVudGltZSBiZWhhdmlvciBpcyB3ZWxsLWtub3duXG4gXG5jb25zdCB0cmF2ZXJzZTogdHlwZW9mIF90cmF2ZXJzZS5kZWZhdWx0ID0gKCAoX3RyYXZlcnNlIGFzIGFueSkuZGVmYXVsdCA/PyBfdHJhdmVyc2UgKSBhcyBhbnk7XG4gXG5jb25zdCBnZW5lcmF0ZTogdHlwZW9mIF9nZW5lcmF0ZS5kZWZhdWx0ID0gKCAoX2dlbmVyYXRlIGFzIGFueSkuZGVmYXVsdCA/PyBfZ2VuZXJhdGUgKSBhcyBhbnk7XG5cbmZ1bmN0aW9uIGNkblByZWZpeEltYWdlcygpOiBQbHVnaW4ge1xuICBjb25zdCBERUJVRyA9IHByb2Nlc3MuZW52LkNETl9JTUdfREVCVUcgPT09ICcxJztcbiAgbGV0IHB1YmxpY0RpciA9ICcnOyAgICAgICAgICAgICAgLy8gYWJzb2x1dGUgcGF0aCB0byBWaXRlIHB1YmxpYyBkaXJcbiAgY29uc3QgaW1hZ2VTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTsgLy8gc3RvcmVzIG5vcm1hbGl6ZWQgJy9pbWFnZXMvLi4uJyBwYXRoc1xuXG4gIGNvbnN0IGlzQWJzb2x1dGUgPSAocDogc3RyaW5nKSA9PlxuICAgIC9eKD86W2Etel0rOik/XFwvXFwvL2kudGVzdChwKSB8fCBwLnN0YXJ0c1dpdGgoJ2RhdGE6JykgfHwgcC5zdGFydHNXaXRoKCdibG9iOicpO1xuXG4gIC8vIG5vcm1hbGl6ZSBhIHJlZiBsaWtlICcuL2ltYWdlcy94LnBuZycsICcuLi9pbWFnZXMveC5wbmcnLCAnL2ltYWdlcy94LnBuZycgLT4gJy9pbWFnZXMveC5wbmcnXG4gIGNvbnN0IG5vcm1hbGl6ZVJlZiA9IChwOiBzdHJpbmcpID0+IHtcbiAgICBsZXQgcyA9IHAudHJpbSgpO1xuICAgIC8vIHF1aWNrIGJhaWwtb3V0c1xuICAgIGlmIChpc0Fic29sdXRlKHMpKSByZXR1cm4gcztcbiAgICAvLyBzdHJpcCBsZWFkaW5nIC4vIGFuZCBhbnkgLi4vIHNlZ21lbnRzICh3ZSB0cmVhdCBwdWJsaWMvIGFzIHJvb3QgYXQgcnVudGltZSlcbiAgICBzID0gcy5yZXBsYWNlKC9eKFxcLlxcLykrLywgJycpO1xuICAgIHdoaWxlIChzLnN0YXJ0c1dpdGgoJy4uLycpKSBzID0gcy5zbGljZSgzKTtcbiAgICBpZiAocy5zdGFydHNXaXRoKCcvJykpIHMgPSBzLnNsaWNlKDEpO1xuICAgIC8vIGVuc3VyZSBpdCBzdGFydHMgd2l0aCBpbWFnZXMvXG4gICAgaWYgKCFzLnN0YXJ0c1dpdGgoJ2ltYWdlcy8nKSkgcmV0dXJuIHA7IC8vIG5vdCB1bmRlciBpbWFnZXMgXHUyMTkyIGxlYXZlIGFzIGlzXG4gICAgcmV0dXJuICcvJyArIHM7IC8vIGNhbm9uaWNhbDogJy9pbWFnZXMvLi4uJ1xuICB9O1xuXG4gIGNvbnN0IHRvQ0ROID0gKHA6IHN0cmluZywgY2RuOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBuID0gbm9ybWFsaXplUmVmKHApO1xuICAgIGlmIChpc0Fic29sdXRlKG4pKSByZXR1cm4gbjtcbiAgICBpZiAoIW4uc3RhcnRzV2l0aCgnL2ltYWdlcy8nKSkgcmV0dXJuIHA7ICAgICAgICAgICAvLyBub3Qgb3VyIGZvbGRlclxuICAgIGlmICghaW1hZ2VTZXQuaGFzKG4pKSByZXR1cm4gcDsgICAgICAgICAgICAgICAgICAgIC8vIG5vdCBhbiBleGlzdGluZyBmaWxlXG4gICAgY29uc3QgYmFzZSA9IGNkbi5lbmRzV2l0aCgnLycpID8gY2RuIDogY2RuICsgJy8nO1xuICAgIHJldHVybiBiYXNlICsgbi5zbGljZSgxKTsgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICdodHRwczovL2Nkbi8uLi4vaW1hZ2VzLy4uJ1xuICB9O1xuXG4gIGNvbnN0IHJld3JpdGVTcmNzZXRMaXN0ID0gKHZhbHVlOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PlxuICAgIHZhbHVlXG4gICAgICAuc3BsaXQoJywnKVxuICAgICAgLm1hcCgocGFydCkgPT4ge1xuICAgICAgICBjb25zdCBbdXJsLCBkZXNjXSA9IHBhcnQudHJpbSgpLnNwbGl0KC9cXHMrLywgMik7XG4gICAgICAgIGNvbnN0IG91dCA9IHRvQ0ROKHVybCwgY2RuKTtcbiAgICAgICAgcmV0dXJuIGRlc2MgPyBgJHtvdXR9ICR7ZGVzY31gIDogb3V0O1xuICAgICAgfSlcbiAgICAgIC5qb2luKCcsICcpO1xuXG4gIGNvbnN0IHJld3JpdGVIdG1sID0gKGh0bWw6IHN0cmluZywgY2RuOiBzdHJpbmcpID0+IHtcbiAgICAvLyBzcmMgLyBocmVmXG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZShcbiAgICAgIC8oc3JjfGhyZWYpXFxzKj1cXHMqKFsnXCJdKShbXidcIl0rKVxcMi9nLFxuICAgICAgKF9tLCBrLCBxLCBwKSA9PiBgJHtrfT0ke3F9JHt0b0NETihwLCBjZG4pfSR7cX1gXG4gICAgKTtcbiAgICAvLyBzcmNzZXRcbiAgICBodG1sID0gaHRtbC5yZXBsYWNlKFxuICAgICAgLyhzcmNzZXQpXFxzKj1cXHMqKFsnXCJdKShbXidcIl0rKVxcMi9nLFxuICAgICAgKF9tLCBrLCBxLCBsaXN0KSA9PiBgJHtrfT0ke3F9JHtyZXdyaXRlU3Jjc2V0TGlzdChsaXN0LCBjZG4pfSR7cX1gXG4gICAgKTtcbiAgICByZXR1cm4gaHRtbDtcbiAgfTtcblxuICBjb25zdCByZXdyaXRlQ3NzVXJscyA9IChjb2RlOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PlxuICAgIGNvZGUucmVwbGFjZSgvdXJsXFwoKFsnXCJdPykoW14nXCIpXSspXFwxXFwpL2csIChfbSwgcSwgcCkgPT4gYHVybCgke3F9JHt0b0NETihwLCBjZG4pfSR7cX0pYCk7XG5cbiAgY29uc3QgcmV3cml0ZUpzeEFzdCA9IChjb2RlOiBzdHJpbmcsIGlkOiBzdHJpbmcsIGNkbjogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgYXN0ID0gcGFyc2UoY29kZSwgeyBzb3VyY2VUeXBlOiAnbW9kdWxlJywgcGx1Z2luczogWyd0eXBlc2NyaXB0JywgJ2pzeCddIH0pO1xuICAgIGxldCByZXdyaXRlcyA9IDA7XG5cbiAgICB0cmF2ZXJzZShhc3QsIHtcbiAgICAgIEpTWEF0dHJpYnV0ZShwKSB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSAocC5ub2RlLm5hbWUgYXMgdC5KU1hJZGVudGlmaWVyKS5uYW1lO1xuICAgICAgICBjb25zdCBpc1NyYyA9IG5hbWUgPT09ICdzcmMnIHx8IG5hbWUgPT09ICdocmVmJztcbiAgICAgICAgY29uc3QgaXNTcmNTZXQgPSBuYW1lID09PSAnc3JjU2V0JyB8fCBuYW1lID09PSAnc3Jjc2V0JztcbiAgICAgICAgaWYgKCFpc1NyYyAmJiAhaXNTcmNTZXQpIHJldHVybjtcblxuICAgICAgICBjb25zdCB2YWwgPSBwLm5vZGUudmFsdWU7XG4gICAgICAgIGlmICghdmFsKSByZXR1cm47XG5cbiAgICAgICAgaWYgKHQuaXNTdHJpbmdMaXRlcmFsKHZhbCkpIHtcbiAgICAgICAgICBjb25zdCBiZWZvcmUgPSB2YWwudmFsdWU7XG4gICAgICAgICAgdmFsLnZhbHVlID0gaXNTcmMgPyB0b0NETih2YWwudmFsdWUsIGNkbikgOiByZXdyaXRlU3Jjc2V0TGlzdCh2YWwudmFsdWUsIGNkbik7XG4gICAgICAgICAgaWYgKHZhbC52YWx1ZSAhPT0gYmVmb3JlKSByZXdyaXRlcysrO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodC5pc0pTWEV4cHJlc3Npb25Db250YWluZXIodmFsKSAmJiB0LmlzU3RyaW5nTGl0ZXJhbCh2YWwuZXhwcmVzc2lvbikpIHtcbiAgICAgICAgICBjb25zdCBiZWZvcmUgPSB2YWwuZXhwcmVzc2lvbi52YWx1ZTtcbiAgICAgICAgICB2YWwuZXhwcmVzc2lvbi52YWx1ZSA9IGlzU3JjXG4gICAgICAgICAgICA/IHRvQ0ROKHZhbC5leHByZXNzaW9uLnZhbHVlLCBjZG4pXG4gICAgICAgICAgICA6IHJld3JpdGVTcmNzZXRMaXN0KHZhbC5leHByZXNzaW9uLnZhbHVlLCBjZG4pO1xuICAgICAgICAgIGlmICh2YWwuZXhwcmVzc2lvbi52YWx1ZSAhPT0gYmVmb3JlKSByZXdyaXRlcysrO1xuICAgICAgICB9XG4gICAgICB9LFxuXG4gICAgICBTdHJpbmdMaXRlcmFsKHApIHtcbiAgICAgICAgLy8gc2tpcCBvYmplY3Qga2V5czogeyBcImltYWdlXCI6IFwiLi4uXCIgfVxuICAgICAgICBpZiAodC5pc09iamVjdFByb3BlcnR5KHAucGFyZW50KSAmJiBwLnBhcmVudEtleSA9PT0gJ2tleScgJiYgIXAucGFyZW50LmNvbXB1dGVkKSByZXR1cm47XG4gICAgICAgIC8vIHNraXAgaW1wb3J0L2V4cG9ydCBzb3VyY2VzXG4gICAgICAgIGlmICh0LmlzSW1wb3J0RGVjbGFyYXRpb24ocC5wYXJlbnQpIHx8IHQuaXNFeHBvcnRBbGxEZWNsYXJhdGlvbihwLnBhcmVudCkgfHwgdC5pc0V4cG9ydE5hbWVkRGVjbGFyYXRpb24ocC5wYXJlbnQpKSByZXR1cm47XG4gICAgICAgIC8vIHNraXAgaW5zaWRlIEpTWCBhdHRyaWJ1dGUgKGFscmVhZHkgaGFuZGxlZClcbiAgICAgICAgaWYgKHAuZmluZFBhcmVudChwMiA9PiBwMi5pc0pTWEF0dHJpYnV0ZSgpKSkgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGJlZm9yZSA9IHAubm9kZS52YWx1ZTtcbiAgICAgICAgY29uc3QgYWZ0ZXIgPSB0b0NETihiZWZvcmUsIGNkbik7XG4gICAgICAgIGlmIChhZnRlciAhPT0gYmVmb3JlKSB7IHAubm9kZS52YWx1ZSA9IGFmdGVyOyByZXdyaXRlcysrOyB9XG4gICAgICB9LFxuXG4gICAgICBUZW1wbGF0ZUxpdGVyYWwocCkge1xuICAgICAgICAvLyBoYW5kbGUgYFwiL2ltYWdlcy9mb28ucG5nXCJgIGFzIHRlbXBsYXRlIHdpdGggTk8gZXhwcmVzc2lvbnNcbiAgICAgICAgaWYgKHAubm9kZS5leHByZXNzaW9ucy5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgY29uc3QgcmF3ID0gcC5ub2RlLnF1YXNpcy5tYXAocSA9PiBxLnZhbHVlLmNvb2tlZCA/PyBxLnZhbHVlLnJhdykuam9pbignJyk7XG4gICAgICAgIGNvbnN0IGFmdGVyID0gdG9DRE4ocmF3LCBjZG4pO1xuICAgICAgICBpZiAoYWZ0ZXIgIT09IHJhdykge1xuICAgICAgICAgIHAucmVwbGFjZVdpdGgodC5zdHJpbmdMaXRlcmFsKGFmdGVyKSk7XG4gICAgICAgICAgcmV3cml0ZXMrKztcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgIH0pO1xuXG4gICAgaWYgKCFyZXdyaXRlcykgcmV0dXJuIG51bGw7XG4gICAgY29uc3Qgb3V0ID0gZ2VuZXJhdGUoYXN0LCB7IHJldGFpbkxpbmVzOiB0cnVlLCBzb3VyY2VNYXBzOiBmYWxzZSB9LCBjb2RlKS5jb2RlO1xuICAgIGlmIChERUJVRykgY29uc29sZS5sb2coYFtjZG5dICR7aWR9IFx1MjE5MiAke3Jld3JpdGVzfSByZXdyaXRlc2ApO1xuICAgIHJldHVybiBvdXQ7XG4gIH07XG5cbiAgYXN5bmMgZnVuY3Rpb24gY29sbGVjdFB1YmxpY0ltYWdlc0Zyb20oZGlyOiBzdHJpbmcpIHtcbiAgICAvLyBSZWN1cnNpdmVseSBjb2xsZWN0IGV2ZXJ5IGZpbGUgdW5kZXIgcHVibGljL2ltYWdlcyBpbnRvIGltYWdlU2V0IGFzICcvaW1hZ2VzL3JlbHBhdGgnXG4gICAgY29uc3QgaW1hZ2VzRGlyID0gbm9kZVBhdGguam9pbihkaXIsICdpbWFnZXMnKTtcbiAgICBjb25zdCBzdGFjayA9IFtpbWFnZXNEaXJdO1xuICAgIHdoaWxlIChzdGFjay5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IGN1ciA9IHN0YWNrLnBvcCgpITtcbiAgICAgIHR5cGUgRGlyZW50ID0gaW1wb3J0KCdmcycpLkRpcmVudDtcbiAgICAgIGxldCBlbnRyaWVzOiBEaXJlbnRbXSA9IFtdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXIoY3VyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgY29udGludWU7IC8vIGltYWdlcy8gbWF5IG5vdCBleGlzdFxuICAgICAgfVxuICAgICAgZm9yIChjb25zdCBlbnQgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCBmdWxsID0gbm9kZVBhdGguam9pbihjdXIsIGVudC5uYW1lKTtcbiAgICAgICAgaWYgKGVudC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgc3RhY2sucHVzaChmdWxsKTtcbiAgICAgICAgfSBlbHNlIGlmIChlbnQuaXNGaWxlKCkpIHtcbiAgICAgICAgICBjb25zdCByZWwgPSBub2RlUGF0aC5yZWxhdGl2ZShkaXIsIGZ1bGwpLnNwbGl0KG5vZGVQYXRoLnNlcCkuam9pbignLycpO1xuICAgICAgICAgIGNvbnN0IGNhbm9uaWNhbCA9ICcvJyArIHJlbDsgLy8gJy9pbWFnZXMvLi4uJ1xuICAgICAgICAgIGltYWdlU2V0LmFkZChjYW5vbmljYWwpO1xuICAgICAgICAgIC8vIGFsc28gYWRkIHZhcmlhbnQgd2l0aG91dCBsZWFkaW5nIHNsYXNoIGZvciBzYWZldHlcbiAgICAgICAgICBpbWFnZVNldC5hZGQoY2Fub25pY2FsLnNsaWNlKDEpKTsgLy8gJ2ltYWdlcy8uLi4nXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6ICdjZG4tcHJlZml4LWltYWdlcy1leGlzdGluZycsXG4gICAgYXBwbHk6ICdidWlsZCcsXG4gICAgZW5mb3JjZTogJ3ByZScsIC8vIHJ1biBiZWZvcmUgQHZpdGVqcy9wbHVnaW4tcmVhY3RcblxuICAgIGNvbmZpZ1Jlc29sdmVkKGNmZykge1xuICAgICAgcHVibGljRGlyID0gY2ZnLnB1YmxpY0RpcjsgLy8gYWJzb2x1dGVcbiAgICAgIGlmIChERUJVRykgY29uc29sZS5sb2coJ1tjZG5dIHB1YmxpY0RpciA9JywgcHVibGljRGlyKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgYnVpbGRTdGFydCgpIHtcbiAgICAgIGF3YWl0IGNvbGxlY3RQdWJsaWNJbWFnZXNGcm9tKHB1YmxpY0Rpcik7XG4gICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKCdbY2RuXSBpbWFnZXMgZm91bmQ6JywgaW1hZ2VTZXQuc2l6ZSk7XG4gICAgfSxcblxuICAgIHRyYW5zZm9ybUluZGV4SHRtbChodG1sKSB7XG4gICAgICBjb25zdCBjZG4gPSBwcm9jZXNzLmVudi5DRE5fSU1HX1BSRUZJWDtcbiAgICAgIGlmICghY2RuKSByZXR1cm4gaHRtbDtcbiAgICAgIGNvbnN0IG91dCA9IHJld3JpdGVIdG1sKGh0bWwsIGNkbik7XG4gICAgICBpZiAoREVCVUcpIGNvbnNvbGUubG9nKCdbY2RuXSB0cmFuc2Zvcm1JbmRleEh0bWwgZG9uZScpO1xuICAgICAgcmV0dXJuIG91dDtcbiAgICB9LFxuXG4gICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XG4gICAgICBjb25zdCBjZG4gPSBwcm9jZXNzLmVudi5DRE5fSU1HX1BSRUZJWDtcbiAgICAgIGlmICghY2RuKSByZXR1cm4gbnVsbDtcblxuICAgICAgaWYgKC9cXC4oanN4fHRzeCkkLy50ZXN0KGlkKSkge1xuICAgICAgICBjb25zdCBvdXQgPSByZXdyaXRlSnN4QXN0KGNvZGUsIGlkLCBjZG4pO1xuICAgICAgICByZXR1cm4gb3V0ID8geyBjb2RlOiBvdXQsIG1hcDogbnVsbCB9IDogbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKC9cXC4oY3NzfHNjc3N8c2Fzc3xsZXNzfHN0eWwpJC9pLnRlc3QoaWQpKSB7XG4gICAgICAgIGNvbnN0IG91dCA9IHJld3JpdGVDc3NVcmxzKGNvZGUsIGNkbik7XG4gICAgICAgIHJldHVybiBvdXQgPT09IGNvZGUgPyBudWxsIDogeyBjb2RlOiBvdXQsIG1hcDogbnVsbCB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9LFxuICB9O1xufVxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvYXBpJzoge1xuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6MzAwMScsXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgICAgcHJveHlUaW1lb3V0OiAzMDAwMCxcbiAgICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgbW9kZSA9PT0gJ2RldmVsb3BtZW50JyAmJlxuICAgICAgY29tcG9uZW50VGFnZ2VyKCksXG4gICAgICBjZG5QcmVmaXhJbWFnZXMoKSxcbiAgICBdLmZpbHRlcihCb29sZWFuKSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogbm9kZVBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICAgIC8vIFByb3h5IHJlYWN0LXJvdXRlci1kb20gdG8gb3VyIHdyYXBwZXJcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCI6IG5vZGVQYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjL2xpYi9yZWFjdC1yb3V0ZXItZG9tLXByb3h5LnRzeFwiKSxcbiAgICAgICAgLy8gT3JpZ2luYWwgcmVhY3Qtcm91dGVyLWRvbSB1bmRlciBhIGRpZmZlcmVudCBuYW1lXG4gICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbS1vcmlnaW5hbFwiOiBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgIC8vIERlZmluZSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgZm9yIGJ1aWxkLXRpbWUgY29uZmlndXJhdGlvblxuICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgdGhpcyB3aWxsIGJlIGZhbHNlIGJ5IGRlZmF1bHQgdW5sZXNzIGV4cGxpY2l0bHkgc2V0IHRvICd0cnVlJ1xuICAgICAgLy8gSW4gZGV2ZWxvcG1lbnQgYW5kIHRlc3QsIHRoaXMgd2lsbCBiZSB0cnVlIGJ5IGRlZmF1bHRcbiAgICAgIF9fUk9VVEVfTUVTU0FHSU5HX0VOQUJMRURfXzogSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIG1vZGUgPT09ICdwcm9kdWN0aW9uJyBcbiAgICAgICAgICA/IHByb2Nlc3MuZW52LlZJVEVfRU5BQkxFX1JPVVRFX01FU1NBR0lORyA9PT0gJ3RydWUnXG4gICAgICAgICAgOiBwcm9jZXNzLmVudi5WSVRFX0VOQUJMRV9ST1VURV9NRVNTQUdJTkcgIT09ICdmYWxzZSdcbiAgICAgICksXG4gICAgfSxcbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBaUM7QUFDMUMsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sUUFBUTtBQUNmLE9BQU8sY0FBYztBQUNyQixTQUFTLHVCQUF1QjtBQUdoQyxTQUFTLGFBQWE7QUFDdEIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sZUFBZTtBQUN0QixZQUFZLE9BQU87QUFYbkIsSUFBTSxtQ0FBbUM7QUFpQnpDLElBQU0sV0FBd0MsVUFBa0IsV0FBVztBQUUzRSxJQUFNLFdBQXdDLFVBQWtCLFdBQVc7QUFFM0UsU0FBUyxrQkFBMEI7QUFDakMsUUFBTSxRQUFRLFFBQVEsSUFBSSxrQkFBa0I7QUFDNUMsTUFBSSxZQUFZO0FBQ2hCLFFBQU0sV0FBVyxvQkFBSSxJQUFZO0FBRWpDLFFBQU0sYUFBYSxDQUFDLE1BQ2xCLHFCQUFxQixLQUFLLENBQUMsS0FBSyxFQUFFLFdBQVcsT0FBTyxLQUFLLEVBQUUsV0FBVyxPQUFPO0FBRy9FLFFBQU0s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USxJQUFJLCtCQUErQjtBQUN0RCxhQUFPO0FBQUEsSUFDVDtBQUFBLElBRUEsVUFBVSxNQUFNLElBQUk7QUFDbEIsWUFBTSxNQUFNLFFBQVEsSUFBSTtBQUN4QixVQUFJLENBQUMsSUFBSyxRQUFPO0FBRWpCLFVBQUksZUFBZSxLQUFLLEVBQUUsR0FBRztBQUMzQixjQUFNLE1BQU0sY0FBYyxNQUFNLElBQUksR0FBRztBQUN2QyxlQUFPLE1BQU0sRUFBRSxNQUFNLEtBQUssS0FBSyxLQUFLLElBQUk7QUFBQSxNQUMxQztBQUVBLFVBQUksZ0NBQWdDLEtBQUssRUFBRSxHQUFHO0FBQzVDLGNBQU0sTUFBTSxlQUFlLE1BQU0sR0FBRztBQUNwQyxlQUFPLFFBQVEsT0FBTyxPQUFPLEVBQUUsTUFBTSxLQUFLLEtBQUssS0FBSztBQUFBLE1BQ3REO0FBRUEsYUFBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0Y7QUFHQSxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxTQUFTO0FBQUEsUUFDWDtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUEsTUFDTixTQUFTLGlCQUNULGdCQUFnQjtBQUFBLE1BQ2hCLGdCQUFnQjtBQUFBLElBQ2xCLEVBQUUsT0FBTyxPQUFPO0FBQUEsSUFDaEIsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxTQUFTLFFBQVEsa0NBQVcsT0FBTztBQUFBO0FBQUEsUUFFeEMsb0JBQW9CLFNBQVMsUUFBUSxrQ0FBVyxzQ0FBc0M7QUFBQTtBQUFBLFFBRXRGLDZCQUE2QjtBQUFBLE1BQy9CO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBLE1BSU4sNkJBQTZCLEtBQUs7QUFBQSxRQUNoQyxTQUFTLGVBQ0wsUUFBUSxJQUFJLGdDQUFnQyxTQUM1QyxRQUFRLElBQUksZ0NBQWdDO0FBQUEsTUFDbEQ7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

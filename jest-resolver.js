// Custom resolver: strips the exports map for ESM-only packages nested
// under @actions/glob so Jest's CJS resolver falls back to "main".
// Scoped narrowly to avoid breaking other packages with valid exports maps.
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg, pkgDir) => {
      const inGlobTree =
        pkgDir &&
        (pkgDir.includes('@actions/glob') ||
          pkg.name === '@actions/glob');
      if (inGlobTree && pkg.type === 'module' && pkg.exports && pkg.main) {
        delete pkg.exports;
      }
      return pkg;
    },
  });
};

// Custom resolver: the Node 24 @actions packages are ESM-only and expose an
// `import` condition, while Jest 29 resolves this TypeScript suite as CJS.
// Strip exports only inside the @actions tree so Jest falls back to `main`;
// ts-jest then transforms those files using the rule in jest.config.js.
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg, pkgDir) => {
      const inActionsTree =
        pkgDir && (pkgDir.includes('/@actions/') || pkg.name?.startsWith('@actions/'));
      if (inActionsTree && pkg.type === 'module' && pkg.exports && pkg.main) {
        delete pkg.exports;
      }
      return pkg;
    },
  });
};

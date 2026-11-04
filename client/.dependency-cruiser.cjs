/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: false,
    tsConfig: {
      fileName: './tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: '^(packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+|node_modules/[^/]+'
      },
      text: {
        highlightFocused: true
      }
    }
  },
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Unikaj cykli zależności.',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Pliki bez zależności mogą być martwe.',
      from: { orphan: true, pathNot: ['(^|/)tests?/', '\\.d\\.ts$', 'vite\\.config', 'stryker\\.config'] },
      to: {}
    }
  ]
};

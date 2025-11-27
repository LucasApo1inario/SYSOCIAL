module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore']
    ],

    'scope-enum': [2, 'always',
      ['backend', 'frontend', 'api', 'ui', 'database', 'docs']
    ],

    'subject-max-length': [2, 'always', 75],
    'body-max-line-length': [2, 'always', 72]
  }
};
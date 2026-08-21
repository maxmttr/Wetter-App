export default [
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', fetch: 'readonly', AbortController: 'readonly',
        Chart: 'readonly', console: 'readonly', setTimeout: 'readonly',
        clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        module: 'readonly',
        // storage.js globals (loaded before app.js in index.html)
        getFavorites: 'readonly', isFavorite: 'readonly', addFavorite: 'readonly',
        removeFavorite: 'readonly', toggleFavorite: 'readonly',
        getRecentCities: 'readonly', addRecentCity: 'readonly', clearRecentCities: 'readonly',
        getLastCity: 'readonly', setLastCity: 'readonly',
        getCachedWeather: 'readonly', setCachedWeather: 'readonly', invalidateCachedWeather: 'readonly',
        cityKey: 'readonly', formatRelativeTime: 'readonly',
        // autocomplete.js globals
        CityAutocomplete: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn', 'no-undef': 'error', 'no-var': 'error',
      'prefer-const': 'warn', eqeqeq: ['warn', 'smart'], 'no-console': 'off'
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        describe: 'readonly', it: 'readonly', test: 'readonly', expect: 'readonly',
        beforeEach: 'readonly', afterEach: 'readonly', vi: 'readonly', global: 'readonly'
      }
    }
  }
];

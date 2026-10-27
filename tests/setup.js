// Globales Test-Setup fuer Vitest + jsdom.
// app.js prueft beim Modul-Load per typeof document !== 'undefined',
// ob echte DOM-Elemente vorhanden sind; im Test-DOM existieren die id="..."
// Elemente nicht, getElementById gibt daher null zurueck (von app.js abgefangen).

/**
 * autocomplete.js — Stadtsuche mit Live-Vorschlägen
 * Nutzt die Open-Meteo Geocoding-API, zeigt Land/Region an,
 * debounced Eingaben und bricht veraltete Requests kontrolliert ab.
 */

const AUTOCOMPLETE_DEBOUNCE_MS = 300;
const AUTOCOMPLETE_MIN_CHARS = 2;

class CityAutocomplete {
    constructor(inputEl, listEl, onSelect) {
        this.input = inputEl;
        this.list = listEl;
        this.onSelect = onSelect;
        this.debounceTimer = null;
        this.abortController = null;
        this.activeIndex = -1;
        this.results = [];

        if (!this.input || !this.list) return;

        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
        this.input.addEventListener('blur', () => {
            setTimeout(() => this.close(), 150);
        });
        document.addEventListener('click', (e) => {
            if (!this.list.contains(e.target) && e.target !== this.input) this.close();
        });
    }

    handleInput() {
        const query = this.input.value.trim();
        clearTimeout(this.debounceTimer);

        if (query.length < AUTOCOMPLETE_MIN_CHARS) {
            this.close();
            return;
        }

        this.debounceTimer = setTimeout(() => this.search(query), AUTOCOMPLETE_DEBOUNCE_MS);
    }

    async search(query) {
        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();

        try {
            const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=6&language=de&format=json`;
            const res = await fetch(url, { signal: this.abortController.signal });
            const data = await res.json();
            this.results = data.results || [];
            this.render();
        } catch (err) {
            if (err.name === 'AbortError') return;
            this.close();
        }
    }

    render() {
        this.list.innerHTML = '';
        this.activeIndex = -1;

        if (this.results.length === 0) {
            this.close();
            return;
        }

        this.results.forEach((city, i) => {
            const item = document.createElement('li');
            item.className = 'autocomplete-item';
            item.setAttribute('role', 'option');
            item.id = `autocomplete-item-${i}`;
            const region = city.admin1 ? `${city.admin1}, ` : '';
            item.innerHTML = `
                <span class="autocomplete-name">${city.name}</span>
                <span class="autocomplete-meta">${region}${city.country || ''}</span>
            `;
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.select(city);
            });
            this.list.appendChild(item);
        });

        this.list.classList.remove('hidden');
        this.input.setAttribute('aria-expanded', 'true');
    }

    handleKeydown(e) {
        if (this.list.classList.contains('hidden') || this.results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveActive(1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveActive(-1);
        } else if (e.key === 'Enter' && this.activeIndex >= 0) {
            e.preventDefault();
            this.select(this.results[this.activeIndex]);
        } else if (e.key === 'Escape') {
            this.close();
        }
    }

    moveActive(delta) {
        const items = this.list.querySelectorAll('.autocomplete-item');
        items.forEach(i => i.classList.remove('active'));
        this.activeIndex = (this.activeIndex + delta + items.length) % items.length;
        const active = items[this.activeIndex];
        active.classList.add('active');
        active.scrollIntoView({ block: 'nearest' });
        this.input.setAttribute('aria-activedescendant', active.id);
    }

    select(city) {
        this.close();
        this.input.value = city.name;
        this.onSelect(city);
    }

    close() {
        this.list.innerHTML = '';
        this.list.classList.add('hidden');
        this.activeIndex = -1;
        this.input.setAttribute('aria-expanded', 'false');
        this.input.removeAttribute('aria-activedescendant');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CityAutocomplete };
}

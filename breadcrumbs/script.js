(() => {
    const bc = document.getElementById('bc');
    const addBtn = document.getElementById('add');

    // 50 měst – můžeš libovolně upravit
    const CITIES = shuffle([
        'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Ústí nad Labem', 'Hradec Králové', 'Pardubice', 'Zlín',
        'České Budějovice', 'Jihlava', 'Karlovy Vary', 'Teplice', 'Děčín', 'Chomutov', 'Jablonec nad Nisou', 'Mladá Boleslav', 'Prostějov', 'Třebíč',
        'Tábor', 'Opava', 'Znojmo', 'Havířov', 'Kladno', 'Karviná', 'Most', 'Trutnov', 'Bruntál', 'Kroměříž',
        'Vsetín', 'Uherské Hradiště', 'Kolín', 'Písek', 'Cheb', 'Břeclav', 'Litoměřice', 'Nový Jičín', 'Kutná Hora', 'Blansko',
        'Šternberk', 'Jindřichův Hradec', 'Žďár nad Sázavou', 'Brandýs nad Labem', 'Hodonín', 'Česká Lípa', 'Třinec', 'Šumperk', 'Svitavy', 'Krnov'
    ]);

    // Fisher–Yates shuffle
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // Přepiš existující drobky náhodnými městy při načtení
    function seedInitialCities() {
        const items = bc.querySelectorAll('bc-item');
        items.forEach((item, i) => {
            let title = item.querySelector('bc-title');
            if (!title) {
                title = document.createElement('bc-title');
                item.prepend(title);
            }
            title.textContent = CITIES[i % CITIES.length];
        });
    }

    function normalize() {
        const items = [...bc.querySelectorAll('bc-item')];
        items.forEach((item, idx) => {
            const isLast = idx === items.length - 1;

            // Divider: všude krom posledního
            let divider = item.querySelector('bc-divider');
            if (!isLast) {
                if (!divider) {
                    divider = document.createElement('bc-divider');
                    divider.textContent = '/';
                    item.appendChild(divider);
                }
            } else if (divider) {
                divider.remove();
            }

            // Remove button: jen poslední
            let btn = item.querySelector('button.remove');
            if (isLast) {
                if (!btn) {
                    btn = document.createElement('button');
                    btn.className = 'remove';
                    btn.setAttribute('aria-label', 'Odstranit');
                    btn.textContent = '✕';
                    item.appendChild(btn);
                }
            } else if (btn) {
                btn.remove();
            }
        });
    }

    function createItem(titleText) {
        const item = document.createElement('bc-item');
        const title = document.createElement('bc-title');
        title.textContent = titleText;
        item.appendChild(title);
        return item;
    }

    // Inicializace měst v existujících drobcích
    seedInitialCities();

    // Po seedování nastav počitadla
    let counter = bc.querySelectorAll('bc-item').length;
    let cityIndex = counter % CITIES.length;

    // ───────── PŘIDÁNÍ: nový vyjede zpoza předposledního ─────────
    addBtn.addEventListener('click', () => {
        const mutateForAdd = () => {
            const items = bc.querySelectorAll('bc-item');
            const oldLast = items[items.length - 1] || null;
            if (oldLast) oldLast.style.viewTransitionName = 'addCover';

            const name = CITIES[cityIndex % CITIES.length];
            cityIndex += 1;
            counter += 1;

            const newItem = createItem(name);
            newItem.style.viewTransitionName = 'addItem';
            bc.appendChild(newItem);

            normalize();
            return { oldLast, newItem };
        };

        if (!document.startViewTransition) {
            mutateForAdd();
            return;
        }

        let refs;
        const vt = document.startViewTransition(() => {
            refs = mutateForAdd();
            // sync layout pro správný snapshot
            bc.getBoundingClientRect();
        });

        vt.finished.finally(() => {
            refs?.oldLast && (refs.oldLast.style.viewTransitionName = '');
            refs?.newItem && (refs.newItem.style.viewTransitionName = '');
        });
    });

    // ───────── MAZÁNÍ: poslední zajede pod předposlední ─────────
    bc.addEventListener('click', (e) => {
        const btn = e.target.closest('button.remove');
        if (!btn) return;

        const items = bc.querySelectorAll('bc-item');
        const oldLast = items[items.length - 1];
        const oldPenult = items.length >= 2 ? items[items.length - 2] : null;

        if (!oldLast || !oldLast.contains(btn)) return;

        // fallback bez VT nebo chybí předposlední
        if (!document.startViewTransition || !oldPenult) {
            oldLast.remove();
            normalize();
            return;
        }

        // 🔑 Odjíždějící prvek je viditelný jen jako OLD(removeItem)
        oldLast.style.viewTransitionName = 'removeItem';

        let newCover = null;

        const vt = document.startViewTransition(() => {
            // 1) Odeber poslední
            oldLast.remove();

            // 2) Přepočítej divider / křížek
            normalize();

            // 3) Nový poslední je kryt → existuje jen v NEW snapshotu
            const itemsAfter = bc.querySelectorAll('bc-item');
            newCover = itemsAfter[itemsAfter.length - 1] || null;
            if (newCover) {
                newCover.style.viewTransitionName = 'removeCover';
            }

            // sync layout
            bc.getBoundingClientRect();
        });

        vt.finished.finally(() => {
            // úklid
            oldLast.style.viewTransitionName = '';
            if (newCover) {
                newCover.style.viewTransitionName = '';
            }
        });
    });

    // CSS pojistka, aby se u posledního nikdy neukázal divider i při race conditions
    // (volitelné, ale praktické)
    const styleGuard = document.createElement('style');
    styleGuard.textContent = `bc-item:last-of-type > bc-divider{display:none!important}`;
    document.head.appendChild(styleGuard);

    // Init normalize (pro jistotu po seedování)
    normalize();
})();
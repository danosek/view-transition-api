(() => {
    const bc = document.getElementById('bc');
    const addBtn = document.getElementById('add');

    let counter = bc.querySelectorAll('bc-item').length;
    const names = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

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
                    btn.textContent = 'x';
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

    // ───────── PŘIDÁNÍ: nový vyjede zpoza předposledního ─────────
    addBtn.addEventListener('click', () => {
        const mutateForAdd = () => {
            const items = bc.querySelectorAll('bc-item');
            const oldLast = items[items.length - 1] || null;
            if (oldLast) oldLast.style.viewTransitionName = 'addCover';

            counter += 1;
            const name = names[counter - 1] || `Item ${counter}`;
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
            bc.getBoundingClientRect();
        });

        vt.finished.finally(() => {
            refs?.oldLast && (refs.oldLast.style.viewTransitionName = '');
            refs?.newItem && (refs.newItem.style.viewTransitionName = '');
        });
    });

    // ───────── MAZÁNÍ: prostý crossfade ─────────
    bc.addEventListener('click', (e) => {
        const btn = e.target.closest('button.remove');
        if (!btn) return;

        const item = btn.closest('bc-item');
        if (!item) return;

        if (!document.startViewTransition) {
            item.remove();
            normalize();
            return;
        }

        const vt = document.startViewTransition(() => {
            item.remove();
            normalize();
        });
    });

    // Init
    normalize();
})();
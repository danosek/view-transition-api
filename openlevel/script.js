(() => {
    const contentArea = document.getElementById('contentArea');
    const breadcrumbs = document.getElementById('breadcrumbs');
    
    // Data (simulace DB)
    const ORDERS = [
        { id: 1001, customer: "Acme Corp", status: "Shipped", amount: "3 200 Kč" },
        { id: 1002, customer: "Blue Fox", status: "Processing", amount: "980 Kč" },
        { id: 1003, customer: "Delta Group", status: "Pending", amount: "5 430 Kč" },
        { id: 1004, customer: "Nimbus Labs", status: "Awaiting", amount: "12 100 Kč" },
        { id: 1005, customer: "Pixel Peak", status: "Shipped", amount: "850 Kč" },
    ];

    // Stav aplikace
    let currentView = 'list'; // 'list' | 'detail'

    // --- RENDER FUNKCE ---

    // 1. Vykreslí tabulku
    function renderList() {
        const rows = ORDERS.map(order => `
            <div class="list-row" role="row" data-id="${order.id}">
                <div class="cell cell-id">${order.id}</div>
                <div class="cell">${order.customer}</div>
                <div class="cell"><span class="status-badge">${order.status}</span></div>
                <div class="cell cell-amount">${order.amount}</div>
                <div class="cell cell-actions">→</div>
            </div>
        `).join('');

        return `
            <div class="list">
                <div class="list-header">
                    <div class="cell cell-id">#</div>
                    <div class="cell">Zákazník</div>
                    <div class="cell">Stav</div>
                    <div class="cell cell-amount">Částka</div>
                    <div class="cell"></div>
                </div>
                <div class="list-body">${rows}</div>
            </div>
        `;
    }

    // 2. Vykreslí detail
    function renderDetail(id) {
        const order = ORDERS.find(o => o.id == id);
        return `
            <div class="detail-view">
                <button class="back-btn">← Zpět na seznam</button>
                <h1>Objednávka #${order.id}</h1>
                <div class="meta">Vytvořeno 5. 1. 2025 • Spravuje Admin</div>
                
                <div class="detail-card">
                    <div class="detail-row"><label>Zákazník</label><span>${order.customer}</span></div>
                    <div class="detail-row"><label>Stav</label><span>${order.status}</span></div>
                    <div class="detail-row"><label>Částka</label><span>${order.amount}</span></div>
                    <div class="detail-row"><label>Doprava</label><span>PPL Premium</span></div>
                </div>
            </div>
        `;
    }

    // --- NAVIGACE ---

    function navigateTo(view, param = null) {
        // Určíme směr pro CSS animaci
        // Pokud jdeme na detail -> 'forward', pokud zpět na list -> 'back'
        const direction = view === 'detail' ? 'forward' : 'back';
        
        // Funkce pro aktualizaci DOMu
        const updateDOM = () => {
            if (view === 'list') {
                contentArea.innerHTML = renderList();
                updateBreadcrumbs(null); // Reset drobků
            } else if (view === 'detail') {
                contentArea.innerHTML = renderDetail(param);
                updateBreadcrumbs(param); // Přidat drobek
            }
            contentArea.scrollTop = 0;
            currentView = view;
        };

        // Fallback
        if (!document.startViewTransition) {
            updateDOM();
            return;
        }

        // Nastavíme směr na :root element
        document.documentElement.dataset.direction = direction;

        const vt = document.startViewTransition(() => {
            updateDOM();
        });

        vt.finished.finally(() => {
            // Úklid atributu
            delete document.documentElement.dataset.direction;
            reattachListeners(); // Znovu navázat eventy na nové prvky
        });
    }

    // --- DROBEČKY ---

    function updateBreadcrumbs(orderId) {
        // Vždy začínáme s rootem
        const root = breadcrumbs.querySelector('#root-bc');
        
        if (orderId) {
            // Jsme v detailu -> přidáme drobek
            // Nejdřív přidáme oddělovač k rootu (pokud tam není)
            if (!root.querySelector('bc-divider')) {
                root.innerHTML += `<bc-divider>/</bc-divider>`;
            }

            // Vytvoříme nový element
            const newItem = document.createElement('bc-item');
            // Dáme mu transition-name pro animaci příletu
            newItem.style.viewTransitionName = 'breadcrumb-item';
            newItem.innerHTML = `<bc-title>Objednávka ${orderId}</bc-title>`;
            
            breadcrumbs.appendChild(newItem);
        } else {
            // Jsme v listu -> smažeme vše kromě rootu
            const items = breadcrumbs.querySelectorAll('bc-item');
            items.forEach(item => {
                if (item.id !== 'root-bc') item.remove();
            });
            // Odebrat divider z rootu
            const divider = root.querySelector('bc-divider');
            if (divider) divider.remove();
        }
    }

    // --- EVENT LISTENERS ---

    function reattachListeners() {
        // Klik na řádek v tabulce
        document.querySelectorAll('.list-row').forEach(row => {
            row.addEventListener('click', () => {
                navigateTo('detail', row.dataset.id);
            });
        });

        // Klik na tlačítko Zpět v detailu
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                navigateTo('list');
            });
        }
        
        // Klik na drobeček "Objednávky" (root)
        const rootBc = document.querySelector('#root-bc');
        // Abychom nepřidávali listener vícekrát, zkontrolujeme view
        if(currentView === 'detail') {
             rootBc.style.cursor = 'pointer';
             rootBc.onclick = () => navigateTo('list');
        } else {
             rootBc.style.cursor = 'default';
             rootBc.onclick = null;
        }
    }

    // INIT
    contentArea.innerHTML = renderList();
    reattachListeners();

})();
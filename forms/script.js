(() => {
    const contentArea = document.getElementById('contentArea');
    const pageTitle = document.getElementById('pageTitle'); // Reference na nadpis
    const navButtons = document.querySelectorAll('app-sidebar button');

    // Definice dat: Každý formulář má nyní i "title", který se ukáže v hlavičce
    const FORMS = {
        personal: {
            title: 'Osobní údaje',
            html: `
                <div class="form-group">
                    <label>Jméno</label>
                    <input type="text" value="Jan Novák">
                </div>
                <div class="form-group">
                    <label>Pozice</label>
                    <input type="text" value="Frontend Developer">
                </div>
                <div class="actions"><button class="primary">Uložit</button></div>
            `
        },
        settings: {
            title: 'Nastavení aplikace',
            html: `
                <div class="form-group">
                    <label>Jazyk</label>
                    <input type="text" value="Čeština">
                </div>
                <div class="form-group">
                    <label>Téma</label>
                    <input type="text" value="Světlé">
                </div>
                <div class="actions"><button class="primary">Uložit nastavení</button></div>
            `
        },
        notifications: {
            title: 'Správa notifikací',
            html: `
                <p>Zde si můžete nastavit, jaké e-maily chcete dostávat.</p>
                <div class="form-group">
                    <label><input type="checkbox" checked> Newsletter</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox"> Systémová hlášení</label>
                </div>
            `
        },
        billing: {
            title: 'Fakturace a platby',
            html: `
                <div class="form-group">
                    <label>IČO</label>
                    <input type="text" placeholder="12345678">
                </div>
                <div class="form-group">
                    <label>DIČ</label>
                    <input type="text" placeholder="CZ12345678">
                </div>
                <div class="actions"><button class="primary">Aktualizovat fakturační údaje</button></div>
            `
        }
    };

    function renderForm(formId) {
        const data = FORMS[formId];
        if (!data) return;

        // Změna obsahu formuláře
        contentArea.innerHTML = data.html;
        
        // Změna nadpisu v hlavičce
        pageTitle.textContent = data.title;
    }

    function handleSwitch(event) {
        const btn = event.currentTarget;
        const formId = btn.dataset.form;
        
        if (btn.classList.contains('active')) return;

        const updateDOM = () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Tady se provede změna DOMu pro obě části (header i content)
            renderForm(formId);
            
            contentArea.scrollTop = 0;
        };

        if (!document.startViewTransition) {
            updateDOM();
            return;
        }

        // View Transition zachytí změnu jak v contentArea, tak v pageTitle
        const transition = document.startViewTransition(() => {
            updateDOM();
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', handleSwitch);
    });

    // Init
    const activeBtn = document.querySelector('app-sidebar button.active');
    if (activeBtn) {
        renderForm(activeBtn.dataset.form);
    }
})();
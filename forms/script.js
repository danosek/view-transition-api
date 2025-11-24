(() => {
    const contentArea = document.getElementById('contentArea');
    const navButtons = document.querySelectorAll('app-sidebar button');

    const FORMS = {
        personal: `
            <h2>Osobní údaje</h2>
            <div class="form-group">
                <label>Jméno</label>
                <input type="text" value="Jan Novák">
            </div>
            <div class="form-group">
                <label>Pozice</label>
                <input type="text" value="Frontend Developer">
            </div>
            <div class="actions"><button class="primary">Uložit</button></div>
        `,
        settings: `
            <h2>Nastavení aplikace</h2>
            <div class="form-group">
                <label>Jazyk</label>
                <input type="text" value="Čeština">
            </div>
            <div class="form-group">
                <label>Téma</label>
                <input type="text" value="Světlé">
            </div>
            <div class="actions"><button class="primary">Uložit nastavení</button></div>
        `,
        notifications: `
            <h2>Notifikace</h2>
            <p>Zde si můžete nastavit, jaké e-maily chcete dostávat.</p>
            <div class="form-group">
                <label><input type="checkbox" checked> Newsletter</label>
            </div>
            <div class="form-group">
                <label><input type="checkbox"> Systémová hlášení</label>
            </div>
        `,
        billing: `
            <h2>Fakturace</h2>
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
    };

    // Tohle je klasický vykreslovač obsahu - render
    function renderForm(formId) {
    // Z té vrchní struktury nám plní to html, jako kdyby to byla databáze formů
        contentArea.innerHTML = FORMS[formId] || '<h2>Formulář nenalezen</h2>';
    }

    // Tohle je funkce na switch těch forms
    function handleSwitch(event) {
        const btn = event.currentTarget;
        const formId = btn.dataset.form;
        
        // Tohle je fail safe pojistka na return, když klikám na stejný form
        if (btn.classList.contains('active')) return;

        // Tohl ezmění na jiný form
        const updateDOM = () => {
            // Přepnutí active třídy v menu
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Výměna obsahu formuláře
            renderForm(formId);
            
            // Reset scrollu (aby nový formulář začínal nahoře)
            contentArea.scrollTop = 0;
        };

        // Fallback pro prohlížeče bez View Transitions
        if (!document.startViewTransition) {
            updateDOM();
            return;
        }

        // Spuštění tranzice
        // Prohlížeč si "vyfotí" app-content (starý stav)
        // Pak zavolá updateDOM()
        // Pak si "vyfotí" app-content (nový stav)
        // A provede animaci definovanou v CSS
        const transition = document.startViewTransition(() => {
            updateDOM();
        });
    }

    // Event listenery
    navButtons.forEach(btn => {
        btn.addEventListener('click', handleSwitch);
    });

    // Načtení prvního formuláře
    const activeBtn = document.querySelector('app-sidebar button.active');
    if (activeBtn) {
        renderForm(activeBtn.dataset.form);
    }
})();
(() => {
    // Reference na elementy
    const trigger = document.getElementById('dropdownTrigger');
    const dropdown = document.getElementById('myDropdown');
    const statusLog = document.getElementById('statusLog');

    // --- STAV A KONFIGURACE (External Control Pattern) ---
    
    let isOpen = false;
    
    // Konfigurace odsazení
    const POPOVER_OFFSET = 8; 

    // --- LOGIKA ŘÍZENÍ STAVU (API dle dokumentace) ---

    /**
     * onChangeRequest - Hlavní funkce pro změnu stavu
     * @param {boolean} newRequestedState - Požadovaný nový stav
     * @param {string} requestedBy - Kdo změnu vyvolal (click, keyboard, outside...)
     * @returns {boolean} - Zda byla změna přijata
     */
    function onChangeRequest(newRequestedState, requestedBy) {
        console.log(`Request change to: ${newRequestedState} (by ${requestedBy})`);

        // Zde můžeme blokovat změnu stavu (např. if isLoading return false)
        
        // Aplikování stavu
        setIsOpen(newRequestedState);
        return true;
    }

    /**
     * setIsOpen - Aplikuje stav do DOMu
     */
    function setIsOpen(newState) {
        isOpen = newState;
        
        if (isOpen) {
            // 1. Pozicování (musí se stát před zobrazením nebo těsně s ním)
            updatePosition();
            
            // 2. Zobrazení popoveru (Moderní API)
            dropdown.showPopover();
            
            // 3. Aktualizace ARIA atributů
            trigger.setAttribute('aria-expanded', 'true');
            statusLog.textContent = 'Stav: Otevřeno (Internal State: true)';
        } else {
            // 1. Skrytí popoveru
            dropdown.hidePopover();
            
            // 2. Aktualizace ARIA
            trigger.setAttribute('aria-expanded', 'false');
            statusLog.textContent = 'Stav: Zavřeno (Internal State: false)';
        }
    }

    // --- POZICOVÁNÍ (Simulace "Popup" chování) ---

    function updatePosition() {
        const triggerRect = trigger.getBoundingClientRect();
        
        // Jednoduchý výpočet pozice pod tlačítkem
        // V reálné "Popup" komponentě by to řešilo kolize s okrajem obrazovky
        const top = triggerRect.bottom + POPOVER_OFFSET;
        const left = triggerRect.left;

        dropdown.style.top = `${top}px`;
        dropdown.style.left = `${left}px`;
        
        // Nastavíme i šířku podle triggeru (volitelné, nebo fixní dle CSS)
        // dropdown.style.width = `${triggerRect.width}px`;
    }

    // --- EVENT LISTENERS (Triggers) ---

    // 1. Kliknutí na Trigger
    trigger.addEventListener('click', (e) => {
        // Pokud je otevřeno -> zavřít, jinak otevřít
        // Typ požadavku rozlišujeme podle detailu (0 = klávesnice, 1 = myš)
        const type = e.detail === 0 ? 'triggerExecutedByKeyboard' : 'triggerExecutedByClick';
        onChangeRequest(!isOpen, type);
    });

    // 2. Kliknutí mimo (Click Outside Watcher)
    // Dokumentace říká: "dropdown automatically closes when user clicks outside"
    document.addEventListener('mousedown', (e) => {
        if (!isOpen) return;

        // Pokud kliknutí nebylo v dropdownu ANI v triggeru
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
            onChangeRequest(false, 'clickedOutside');
        }
    });

    // 3. Reakce na položky (Item Executed)
    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (item) {
            // Efekt kliknutí na položku
            console.log('Item clicked:', item.textContent.trim());
            
            // Zavřít dropdown
            onChangeRequest(false, 'itemExecuted');
            
            // Volitelně: Focus zpět na trigger
            trigger.focus();
        }
    });

    // 4. Klávesnice (ESC)
    // Popover API řeší ESC automaticky, ale my chceme synchronizovat náš stav
    dropdown.addEventListener('toggle', (e) => {
        // Event 'toggle' se odpálí, když prohlížeč sám zavře popover (např. přes ESC)
        if (e.newState === 'closed' && isOpen) {
            // Synchronizujeme náš interní stav
            setIsOpen(false);
        }
    });

    // Repozicování při změně velikosti okna
    window.addEventListener('resize', () => {
        if (isOpen) updatePosition();
    });

})();
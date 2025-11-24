(() => {
    const dialog = document.getElementById('myDialog');
    const openBtn = document.getElementById('openModal');
    const closeBtn = document.getElementById('closeModal');

    // Otevření modalu - Klasika poslouchá click na button
    openBtn.addEventListener('click', () => {
        dialog.showModal();
    });

    // Zavření tlačítkem křížku
    closeBtn.addEventListener('click', () => {
        dialog.close();
    });

    // Zavření kliknutím na backdrop
    dialog.addEventListener('click', (event) => {
        // Zjistíme rozměry okna dialogu
        const rect = dialog.getBoundingClientRect();
        // Pokud klikne uživatel mimo okno nebo křížek, tak se zavře
        const isInDialog = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
        );

        if (!isInDialog) {
            dialog.close();
        }
    });

})();
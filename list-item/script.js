(() => {
    const body = document.getElementById("table-body");
    const addBtn = document.getElementById("add-row");

    if (!body || !addBtn) return;

    const ROW_GAP = 0; // px mezi řádky

    let orderCounter = 1004;

    const customers = [
        "Acme Corp",
        "Blue Fox",
        "Delta Group",
        "Nimbus Labs",
        "Nebula Studio",
        "Polar Systems",
        "Quantum Dynamics",
        "Lynx Media",
        "Red Falcon Ltd",
        "Evergreen Trading",
        "Silverpine Solutions",
        "Orion Logistics",
        "Velvet Technologies",
        "Hexagon Partners",
        "Borealis Hub",
        "NovaSpark",
        "Crimson & Co.",
        "OceanByte",
        "Midnight Software",
        "Sunset Industries",
        "FutureFlow",
        "Cosmic Tea House",
        "Turbo Koala",
        "Pixel Peak",
        "Frostline Networks",
        "Bronze Elephant",
        "Happy Mole Agency",
    ];

    const statuses = [
        "Pending",
        "Processing",
        "Shipped",
        "Cancelled",
        "Refunded",
        "Delayed",
        "Awaiting Payment",
        "In Packaging",
        "Quality Check",
        "Awaiting Pickup"
    ];

    const randomItem = (arr) =>
        arr[Math.floor(Math.random() * arr.length)];

    const randomAmount = () => {
        const base = 100 + Math.floor(Math.random() * 15000);
        const rnd = base.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        return rnd + " Kč";
    };

    // ------------------------------------
    //  Layout řádků – spočítá Y a výšku
    // ------------------------------------

    const layoutRows = () => {
        const rows = Array.from(
            body.querySelectorAll(".list-row:not(.list-row-ghost)")
        );

        let y = 0;

        rows.forEach((row) => {
            const height = row.offsetHeight;
            row.dataset.y = String(y);
            row.style.setProperty("--row-y", `${Math.round(y)}px`);

            // u nového řádku necháme scale tak, jak jsme ho nastavili (0 / 0.1),
            // ostatním ho vracíme na 1
            if (!row.classList.contains("is-new")) {
                row.style.setProperty("--row-scale", "1");
            }

            y += height + ROW_GAP;
        });

        body.style.height = `${Math.round(y)}px`;
    };

    // ------------------------------------
    //  Počáteční layout bez animace
    // ------------------------------------

    window.addEventListener("load", () => {
        const rows = Array.from(body.querySelectorAll(".list-row"));

        // vypnout transition přes inline styl, aby se první layout neanimoval
        rows.forEach((row) => {
            row.dataset._origTransition = row.style.transition || "";
            row.style.transition = "none";
        });

        layoutRows();

        // v dalším frame vrátit transition, aby další změny už byly animované
        requestAnimationFrame(() => {
            rows.forEach((row) => {
                row.style.transition = row.dataset._origTransition || "";
                delete row.dataset._origTransition;
            });
        });
    });

    // ------------------------------------
    //  Vytvoření nového "řádku"
    // ------------------------------------

    const createRow = () => {
        const row = document.createElement("div");
        row.className = "list-row";
        row.setAttribute("role", "row");

        const idCell = document.createElement("div");
        idCell.className = "cell cell-id";
        idCell.setAttribute("role", "cell");
        idCell.textContent = String(orderCounter++);

        const customerCell = document.createElement("div");
        customerCell.className = "cell";
        customerCell.setAttribute("role", "cell");
        customerCell.textContent = randomItem(customers);

        const statusCell = document.createElement("div");
        statusCell.className = "cell";
        statusCell.setAttribute("role", "cell");
        statusCell.textContent = randomItem(statuses);

        const amountCell = document.createElement("div");
        amountCell.className = "cell cell-amount";
        amountCell.setAttribute("role", "cell");
        amountCell.textContent = randomAmount();

        const actionsCell = document.createElement("div");
        actionsCell.className = "cell cell-actions";
        actionsCell.setAttribute("role", "cell");

        const delBtn = document.createElement("button");
        delBtn.className = "row-delete";
        delBtn.setAttribute("aria-label", "Smazat řádek");
        delBtn.textContent = "✕";

        actionsCell.appendChild(delBtn);

        row.appendChild(idCell);
        row.appendChild(customerCell);
        row.appendChild(statusCell);
        row.appendChild(amountCell);
        row.appendChild(actionsCell);

        return row;
    };

    // ------------------------------------
    //  Přidání řádku – scale 0 → 1
    // ------------------------------------

    const addRow = () => {
        const row = createRow();
        row.classList.add("is-new");
        body.prepend(row);

        // start stav pro scale & opacity
        row.style.setProperty("--row-scale", "0");
        row.style.opacity = "0";

        // spočítej layout včetně nového řádku → dostaneme finální Y
        layoutRows();

        const finalY = Number(row.dataset.y || "0");
        row.style.setProperty("--row-y", `${Math.round(finalY)}px`);

        // v dalším frame přepnout scale 0 → 1 a opacity 0 → 1
        requestAnimationFrame(() => {
            row.classList.remove("is-new");
            row.style.opacity = "1";
            row.style.setProperty("--row-scale", "1");
        });
    };

    // ------------------------------------
    //  Mazání řádku – ghost + collapse
    // ------------------------------------

    const removeRow = (row) => {
        if (!row || !row.isConnected) return;

        const y = Number(row.dataset.y || "0");

        // ghost, který vizuálně nahradí řádek a scvakne se
        const ghost = document.createElement("div");
        ghost.className = "list-row list-row-ghost";
        ghost.setAttribute("role", "presentation");
        ghost.innerHTML = row.innerHTML;

        ghost.style.setProperty("--row-y", `${Math.round(y)}px`);
        ghost.style.setProperty("--row-scale", "1");
        ghost.style.opacity = "1";

        body.appendChild(ghost);

        // původní řádek pryč + relayout ostatních
        row.remove();
        layoutRows();

        // collapse ghostu
        requestAnimationFrame(() => {
            ghost.classList.add("is-removing");
            ghost.style.setProperty("--row-scale", "0.1");
            ghost.style.opacity = "0";
        });

        const onEnd = (event) => {
            if (event.propertyName !== "transform") return;
            ghost.removeEventListener("transitionend", onEnd);
            if (ghost.isConnected) ghost.remove();
        };

        ghost.addEventListener("transitionend", onEnd);
    };

    // ------------------------------------
    //  Handlery
    // ------------------------------------

    addBtn.addEventListener("click", addRow);

    body.addEventListener("click", (e) => {
        const btn = e.target.closest("button.row-delete");
        if (!btn) return;

        const row = btn.closest(".list-row");
        if (!row) return;

        removeRow(row);
    });
})();
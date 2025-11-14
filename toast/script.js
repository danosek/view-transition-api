(() => {

    // -----------------------------
    //  KONFIGURACE + TEXTY
    // -----------------------------

    const displayTime = 5000;          // jen pro demo, klidně zkrať
    const transitionTime = 350;
    const updateTime = transitionTime * 0.8;
    const bottomOffset = 0;              // aktuálně nehraje roli v layoutu, ale můžeš použít
    const offset = 24;                   // mezera mezi toasty
    const SLIDE_OFFSET = 32;             // horizontální slide zleva/doleva

    const FUN_TITLE = [
        "Unexpected item in the bagging area.",
        "Hold on… did that just work?",
        "I swear this bug is sentient.",
        "Deployed. Immediately regretted.",
        "Coffee level: critical.",
        "Your code ran. Miracles happen.",
        "The system is thinking… unlike me.",
        "Error? No, that’s a feature.",
        "Don’t panic. But also… panic.",
        "Everything is fine. Probably.",
        "You broke it. Or it broke itself.",
        "This toast has no agenda.",
        "Achievement unlocked: clicked a button.",
        "It’s not a bug—it’s an undocumented behaviour.",
        "The last 99% remains.",
        "¯\\_(ツ)_/¯",
        "Compilation succeeded… somehow.",
        "Running in production. God help us.",
        "The server whispered a strange noise.",
        "Hold my beer, I’m deploying.",
        "Your code has trust issues.",
        "Congratulations, you triggered a rare edge case.",
        "Fun fact: nothing about this is fun.",
        "I’m not saying it’s broken, but it’s smoking.",
        "Amazing! It finally didn’t crash.",
        "If this works, I’m retiring.",
        "Well… that escalated quickly.",
        "Loading… forever.",
        "You’ve angered the runtime.",
        "This action cannot be undone, probably.",
        "Oops. That wasn’t supposed to happen.",
        "Good news: it didn’t explode!",
        "Debug mode engaged. Godspeed.",
        "Don’t worry, StackOverflow will save you.",
        "Reality.exe has stopped responding.",
        "Doing things the senior way™.",
        "Your code is crying softly.",
        "Achievement unlocked: inelegant solution.",
        "Shhh… the bug is sleeping.",
        "Production is watching.",
        "This is why we don’t deploy on Fridays.",
        "The user pressed a forbidden button.",
        "A wild exception appeared!",
        "The ghost of technical debt approaches."
    ];

    const FUN_TEXT = [
        "Don’t show this to QA.",
        "This message will self-destruct shortly.",
        "Probably caused by a race condition. Or by you.",
        "Based on true events.",
        "The logs are screaming quietly.",
        "If this happens again, pretend you didn’t see it.",
        "Somewhere, a developer just sighed.",
        "Estimated time of resolution: lol no.",
        "Documented? Haha, good one.",
        "Press F to pay respects.",
        "Absolutely nothing to worry about. Maybe.",
        "Typing harder won’t make it go faster.",
        "Everything is cached. Including your mistakes.",
        "AI wrote this. Don’t blame me.",
        "Future you will hate current you for this.",
        "Debugging is fun, said no one ever.",
        "It worked in staging, so it must be fine.",
        "Don't worry, tests didn't cover this anyway.",
        "A rollback might fix this. Or break more things.",
        "Imagine writing clean code. Couldn't be us.",
        "Your refactor summoned an ancient evil.",
        "This is why we can’t have nice things.",
        "The system is overheating emotionally.",
        "Someone somewhere just created a Jira ticket.",
        "Your CPU is thinking about unionizing.",
        "Time to open the console. Again.",
        "Looks like a backend problem. Perfect.",
        "I’d blame the network if I were you.",
        "Fun fact: this shouldn’t be possible.",
        "It worked on my machine. That’s all that matters.",
        "The spec lied to you. Again.",
        "Users will definitely break this.",
        "The API is feeling chaotic today.",
        "You just triggered a quantum bug.",
        "Relax, your data is backed up… somewhere.",
        "Frontend and backend are arguing again.",
        "Your session expired out of pure spite.",
        "Guess who forgot error handling?",
        "Memory leak detected—hydration recommended.",
        "This warning is harmless. Probably.",
        "The debugger refuses to help you.",
        "Your breakpoint is in another file.",
        "The cache is lying. As usual.",
        "Good luck explaining this to your team.",
        "At least the UI looks nice… ish.",
        "Your function name is a war crime.",
        "This toast believes in you. Unlike your code.",
        "If this was a bug, it’s now a feature.",
        "A developer cried during the making of this.",
        "Don't ask why this works. Nobody knows.",
        "This is technical debt with interest.",
        "Your console.log is judging you.",
        "The system ignored your request politely.",
        "I’d restart it. Everything. Just restart everything.",
        "Your logic is Schrödinger’s logic.",
        "You’re the chosen one… of this exception.",
        "The framework is disappointed in you.",
        "You have angered the linter.",
        "This might require a sacrifice.",
        "The cloud is crying rain of exceptions.",
        "This bug only happens to you. Special!",
        "Great. Now fix it before anyone sees."
    ];

    const randomItem = (arr) =>
        arr[Math.floor(Math.random() * arr.length)];

    // -----------------------------
    //  DOM
    // -----------------------------

    const container = document.querySelector("toasts-container");
    const addBtn = document.getElementById("add");

    // -----------------------------
    //  GUARDED RECOMPUTE (jen pro Y)
    // -----------------------------

    let recomputeScheduled = false;

    const scheduleRecompute = () => {
        if (recomputeScheduled) return;
        recomputeScheduled = true;
        requestAnimationFrame(() => {
            recomputeScheduled = false;
            recomputeStack();
        });
    };

    // -----------------------------
    //  START / BUTTON
    // -----------------------------

    addBtn.addEventListener("click", () => showToast());

    window.addEventListener("DOMContentLoaded", () => {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => showToast(), i * 300);
        }
    });

    // -----------------------------
    //  CREATE TOAST
    // -----------------------------

    const createToast = () => {
        const toast = document.createElement("toast-component");

        const textsWrap = document.createElement("toast-texts");

        const titleEl = document.createElement("toast-title");
        titleEl.textContent = randomItem(FUN_TITLE);
        textsWrap.appendChild(titleEl);

        if (Math.random() < 0.35) {
            const textEl = document.createElement("toast-text");
            textEl.textContent = randomItem(FUN_TEXT);
            textsWrap.appendChild(textEl);
        }

        toast.appendChild(textsWrap);

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.setAttribute("aria-label", "Zavřít toast");
        toast.appendChild(closeBtn);

        closeBtn.addEventListener("click", () => {
            if (toast._timeoutId) clearTimeout(toast._timeoutId);
            removeToast(toast);
        });

        return toast;
    };

    // -----------------------------
    //  SHOW TOAST (INSERT)
    // -----------------------------

    const showToast = () => {
        const toast = createToast();

        container.appendChild(toast);

        // základní stav
        toast.style.opacity = "0";
        toast.style.visibility = "hidden";
        toast.style.pointerEvents = "none";
        toast.dataset.position = "0";

        // zajistíme, že X začíná na 0 (pro jistotu)
        toast.style.setProperty("--toast-offset-x", "0px");
        toast.style.setProperty("--toast-offset-y", "0px");

        // spočítej stack (nastaví Y pozice přes --toast-offset-y)
        recomputeStack();

        const pos = Number(toast.dataset.position || 0);

        // start pozice: zleva, Y podle stacku
        toast.style.setProperty("--toast-offset-y", `${pos}px`);
        toast.style.setProperty("--toast-offset-x", `-${SLIDE_OFFSET}px`);

        // reveal
        setTimeout(() => {
            toast.style.visibility = "";
            toast.style.pointerEvents = "";
            toast.style.opacity = "1";
            toast.style.setProperty("--toast-offset-x", "0px");
        }, updateTime);

        // pro jistotu dorovnání po animacích
        scheduleRecompute();

        // auto close
        toast._timeoutId = setTimeout(() => removeToast(toast), displayTime);
    };

    // -----------------------------
    //  REMOVE TOAST
    // -----------------------------

    const removeToast = (toast) => {
        if (!toast || !toast.isConnected) return;

        const pos = Number(toast.dataset.position ?? 0);

        // necháme Y tak jak je, jen ho stáhneme vlevo + fadeout
        toast.style.opacity = "0";
        toast.style.setProperty("--toast-offset-y", `${pos}px`);
        toast.style.setProperty("--toast-offset-x", `-${SLIDE_OFFSET}px`);

        const onEnd = (event) => {
            if (event.propertyName !== "opacity") return;
            toast.removeEventListener("transitionend", onEnd);

            if (toast.isConnected) {
                toast.remove();
            }

            // po odebrání zarovnáme stack (Y) a případně ještě jednou v rAF
            recomputeStack();
            scheduleRecompute();
        };

        toast.addEventListener("transitionend", onEnd);
    };

    // -----------------------------
    //  PŘEPOČET STACKU (Y jen přes CSS var)
    // -----------------------------

    const recomputeStack = () => {
        const toasts = Array.from(container.querySelectorAll("toast-component"));

        let accumulated = 0;

        // odspodu nahoru – poslední je dole
        for (let i = toasts.length - 1; i >= 0; i--) {
            const t = toasts[i];
            t.dataset.position = String(accumulated);
            t.style.setProperty("--toast-offset-y", `${accumulated}px`);
            // X necháváme být – animace příchodu/odchodu si to přepíše sama
            accumulated += t.offsetHeight + offset;
        }
    };

})();
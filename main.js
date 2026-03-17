// Helper functions 

const feedbackDialog = document.getElementById("feedback-dialog");
const feedbackDialogMessage = document.getElementById("feedback-dialog-message");
const feedbackDialogClose = document.getElementById("feedback-dialog-close");

// <dialog> element voor foutmeldingen
// Bron: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
const showDialog = (message) => {
    if (!feedbackDialog || !feedbackDialogMessage) {
        return;
    }

    feedbackDialogMessage.textContent = message;

    if (feedbackDialog.open) {
        return;
    }

    feedbackDialog.showModal();
};

const byId = (id) => document.getElementById(id);

const TOTAL_STEPS = 9;
const STAP_NAMEN = {
    0: "Gegevens overledene — namen & BSN",
    1: "Gegevens overledene — burgerlijke staat",
    2: "Gegevens overledene — kinderen",
    3: "Gegevens overledene — testament",
    4: "Gegevens gemachtigde — identificatie",
    5: "Gegevens gemachtigde — persoonsgegevens",
    6: "Voor wie doet u aangifte? — rol",
    7: "Voor wie doet u aangifte? — verkrijgers",
    8: "Voor wie doet u aangifte? — aanslag",
};
const setStep = (n) => {
    const vulling = byId("voortgang-vulling");
    vulling.style.width = (((n + 1) / TOTAL_STEPS) * 100) + "%";
    byId("voortgangsbalk").setAttribute("aria-valuenow", n + 1);

    const indicator = byId("stap-indicator");
    if (indicator) {
        indicator.hidden = false;
        indicator.querySelector(".stap-teller").textContent = `Stap ${n + 1} van ${TOTAL_STEPS}`;
        indicator.querySelector(".stap-naam").textContent = STAP_NAMEN[n] || "";
    }
};

const collapseSectionTitle = (sectionId) => {
    const section = byId(sectionId);
    if (!section) return;
    const legend = section.querySelector(":scope > legend");
    if (legend) legend.hidden = true;
};


const valueOf = (id) => byId(id)?.value ?? "";
const setValue = (id, value) => {
    const element = byId(id);
    if (element) {
        element.value = value;
    }
};
const setHidden = (id, hidden) => {
    const element = byId(id);
    if (element) {
        element.hidden = hidden;
    }
};
const isVisible = (id) => byId(id)?.hidden === false;
const clearChecked = (name) => {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    if (selected) {
        selected.checked = false;
    }
};
const checkedValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || "";
const clearValues = (ids) => {
    ids.forEach((id) => setValue(id, ""));
};
const formatDateForInput = (date) => date.toISOString().split("T")[0];
const formElement = document.querySelector("form");
const draftStorageKey = "erfbelasting-form-draft";
const clearSavedDataButton = byId("wis-opgeslagen-gegevens");

// Formuliergegevens opslaan als concept in localStorage zodat de gebruiker
// later verder kan gaan. Bron: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
const saveFormDraft = () => {
    if (!formElement) {
        return;
    }

    const draft = {};
    const fields = formElement.querySelectorAll("input, select, textarea");

    fields.forEach((field) => {
        const { name, type } = field;
        if (!name || type === "file") {
            return;
        }

        if (type === "radio") {
            if (field.checked) {
                draft[name] = field.value;
            }
            return;
        }

        draft[name] = field.value;
    });

    localStorage.setItem(draftStorageKey, JSON.stringify(draft));
};

const restoreFormDraft = () => {
    if (!formElement) {
        return;
    }

    const storedDraft = localStorage.getItem(draftStorageKey);
    if (!storedDraft) {
        return;
    }

    let draft;
    try {
        draft = JSON.parse(storedDraft);
    } catch {
        return;
    }

    if (!draft || typeof draft !== "object") {
        return;
    }

    Object.entries(draft).forEach(([name, value]) => {
        const matchingFields = formElement.querySelectorAll(`[name="${name}"]`);
        if (!matchingFields.length) {
            return;
        }

        const firstType = matchingFields[0].type;
        if (firstType === "radio") {
            const selected = Array.from(matchingFields).find((field) => field.value === value);
            if (selected) {
                selected.checked = true;
                selected.dispatchEvent(new Event("change", { bubbles: true }));
            }
            return;
        }

        matchingFields[0].value = String(value);
    });
};

const wipeAllFormData = () => {
    localStorage.removeItem(draftStorageKey);
    localStorage.removeItem("answers");

    if (!formElement) {
        return;
    }

    const fields = formElement.querySelectorAll("input, select, textarea");
    fields.forEach((field) => {
        const type = field.type;
        if (type === "file") {
            return;
        }

        if (type === "radio" || type === "checkbox") {
            field.checked = false;
            return;
        }

        field.value = "";
    });

    formElement.querySelectorAll(".inline-feedback").forEach((feedback) => {
        feedback.textContent = "";
        feedback.classList.remove("goed", "fout");
    });

    formElement.querySelectorAll(".veld-goed, .veld-fout").forEach((field) => {
        field.classList.remove("veld-goed", "veld-fout");
    });
};

const clearStoredFormDraft = () => {
    wipeAllFormData();
    window.location.reload();
};

const vandaag = new Date();
const maxOverlijdensdatum = formatDateForInput(vandaag);
const achtMaandenGeleden = new Date(vandaag);
achtMaandenGeleden.setMonth(achtMaandenGeleden.getMonth() - 8);
const minOverlijdensdatum = formatDateForInput(achtMaandenGeleden);

const datumOverlijdenInput = byId("datum-overlijden");
if (datumOverlijdenInput) {
    datumOverlijdenInput.min = minOverlijdensdatum;
    datumOverlijdenInput.max = maxOverlijdensdatum;
}

if (feedbackDialogClose && feedbackDialog) {
    feedbackDialogClose.addEventListener("click", () => {
        feedbackDialog.close();
    });
}

// BSN-formaatcheck (8 of 9 cijfers) — vóór elfproef
// Bron: https://www.rijksoverheid.nl/onderwerpen/privacy-en-persoonsgegevens/vraag-en-antwoord/wat-is-het-burgerservicenummer-bsn
const isValidBsn = (value) => /^\d{8,9}$/.test(value);

// Inline field validation helpers
const getFeedback = (el) => {
    // Look for a feedback span that is the immediate next sibling of this input
    let next = el.nextElementSibling;
    while (next) {
        if (next.classList.contains("inline-feedback")) return next;
        // stop looking if we hit another field or label (belongs to a different field)
        if (["INPUT", "LABEL", "SELECT", "TEXTAREA", "FIELDSET", "BUTTON"].includes(next.tagName)) break;
        next = next.nextElementSibling;
    }
    // None found — create one right after this input
    const feedback = document.createElement("span");
    feedback.className = "inline-feedback";
    feedback.setAttribute("aria-live", "polite");
    el.insertAdjacentElement("afterend", feedback);
    return feedback;
};

const markValid = (id) => {
    const el = byId(id);
    if (!el) return;
    el.classList.remove("veld-fout");
    el.classList.add("veld-goed");
    const feedback = getFeedback(el);
    feedback.textContent = "✓ Dit veld is correct ingevuld";
    feedback.classList.remove("fout");
    feedback.classList.add("goed");
};

const markInvalid = (id, message) => {
    const el = byId(id);
    if (!el) return;
    el.classList.remove("veld-goed");
    el.classList.add("veld-fout");
    const feedback = getFeedback(el);
    feedback.textContent = message;
    feedback.classList.remove("goed");
    feedback.classList.add("fout");
};

const clearMark = (id) => {
    const el = byId(id);
    if (!el) return;
    el.classList.remove("veld-goed", "veld-fout");
    const feedback = getFeedback(el);
    feedback.textContent = "";
};

const visibleParent = (id) => {
    const el = byId(id);
    if (!el) return false;
    let node = el;
    while (node && node !== document.documentElement) {
        if (node.hidden || node.style.display === "none") return false;
        node = node.parentElement;
    }
    return true;
};

// Elfproef-validatie voor BSN
// Bron: https://nl.wikipedia.org/wiki/Elfproef
// Bron: https://www.testnummers.nl/ (testgetallen)
const elfValidBsn = (bsn) => {
    if (!/^\d{8,9}$/.test(bsn)) return false;
    const normalizedBsn = bsn.padStart(9, "0");
    const digits = normalizedBsn.split("").map(Number);
    const sum = digits.reduce((acc, digit, index) => {
        const weight = index === 8 ? -1 : 9 - index;
        return acc + digit * weight;
    }, 0);
    return sum % 11 === 0;
};

// Set all hidden classes to hidden attribute
document.querySelectorAll(".hidden").forEach((el) => (el.hidden = true));

// Show step indicator immediately on page load
setStep(0);

// Blur listeners for inline validation on text/date fields
// Voorletters valideren met reguliere expressie — elk letter gevolgd door een punt
// Bron: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
// Bron: https://regex101.com (getest)
const validateVoorletters = (id, val) => {
    if (val === "") {
        markInvalid(id, "Voorletter(s) is verplicht");
    } else if (!/^([A-Za-z]\.)+$/.test(val)) {
        markInvalid(id, "Vul de voorletters in, gescheiden door punten. Bijvoorbeeld: A.B.");
    } else {
        markValid(id);
    }
};

byId("voorletters-overledene").addEventListener("blur", function() {
    validateVoorletters("voorletters-overledene", this.value.trim());
});

byId("voorletters-overledene").addEventListener("input", function() {
    validateVoorletters("voorletters-overledene", this.value.trim());
});

byId("achternaam-overledene").addEventListener("blur", function() {
    if (this.value.trim() === "") {
        markInvalid("achternaam-overledene", "Achternaam is verplicht");
    } else {
        markValid("achternaam-overledene");
    }
});

byId("bsn-overledene").addEventListener("blur", function() {
    const val = this.value.trim();
    if (val === "") {
        markInvalid("bsn-overledene", "BSN is verplicht");
    } else if (!isValidBsn(val)) {
        markInvalid("bsn-overledene", "BSN moet 8 of 9 cijfers bevatten");
    } else if (!elfValidBsn(val)) {
        markInvalid("bsn-overledene", "BSN is niet geldig");
    } else {
        markValid("bsn-overledene");
    }
});

byId("datum-overlijden").addEventListener("blur", function() {
    const val = this.value;
    if (val === "") {
        markInvalid("datum-overlijden", "Overlijdensdatum is verplicht");
    } else if (val > maxOverlijdensdatum) {
        markInvalid("datum-overlijden", "De overlijdensdatum kan niet in de toekomst liggen");
    } else if (val < minOverlijdensdatum) {
        markInvalid("datum-overlijden", "De overlijdensdatum mag niet ouder zijn dan 8 maanden");
    } else {
        markValid("datum-overlijden");
    }
});

byId("datum-overlijden").addEventListener("input", function() {
    const val = this.value;
    if (val !== "" && val >= minOverlijdensdatum && val <= maxOverlijdensdatum) {
        markValid("datum-overlijden");
    }
});

byId("datum-voorwaarden").addEventListener("blur", function() {
    if (!isVisible("vraag-1b-4")) return;
    const val = this.value;
    const datumOverlijden = valueOf("datum-overlijden");
    if (val === "") {
        markInvalid("datum-voorwaarden", "Datum voorwaarden is verplicht");
    } else if (datumOverlijden && val > datumOverlijden) {
        markInvalid("datum-voorwaarden", "De datum van de voorwaarden kan niet na de datum van overlijden liggen");
    } else {
        markValid("datum-voorwaarden");
    }
});

byId("datum-testament").addEventListener("blur", function() {
    if (!isVisible("vraag-1d-2")) return;
    const val = this.value;
    const datumOverlijden = valueOf("datum-overlijden");
    if (val === "") {
        markInvalid("datum-testament", "Datum testament is verplicht");
    } else if (datumOverlijden && val > datumOverlijden) {
        markInvalid("datum-testament", "De datum van het testament kan niet na de datum van overlijden liggen");
    } else {
        markValid("datum-testament");
    }
});

// Clear marks when notaris fields are filled
["protocolnummer-notaris", "voorletters-notaris", "achternaam-notaris", "vestigingsplaats"].forEach((id) => {
    byId(id).addEventListener("blur", function() {
        if (!isVisible("vraag-1d-2")) return;
        if (this.value.trim() === "") {
            markInvalid(id, "Dit veld is verplicht");
        } else {
            markValid(id);
        }
    });
});

// Form submit
const labelMap = {
    "voorletters-overledene": "Voorletter(s)",
    "tussenvoegsels-overledene": "Tussenvoegsel(s)",
    "achternaam-overledene": "Achternaam",
    "bsn-overledene": "BSN",
    "datum-overlijden": "Overlijdensdatum",
    "huwelijk": "Getrouwd of geregistreerd partnerschap",
    "voorwaarden": "Huwelijkse/partnerschapsvoorwaarden",
    "verrekenbeding": "Finaal verrekenbeding",
    "datum-voorwaarden": "Datum voorwaarden",
    "kinderen": "Kinderen",
    "overleden-kinderen": "Eerder overleden kind",
    "kinderen-overleden-kind": "Kinderen van overleden kind",
    "testament": "Testament",
    "protocolnummer-notaris": "Protocolnummer notaris",
    "voorletters-notaris": "Voorletter(s) notaris",
    "tussenvoegsels-notaris": "Tussenvoegsel(s) notaris",
    "achternaam-notaris": "Achternaam notaris",
    "vestigingsplaats": "Vestigingsplaats notaris",
    "datum-testament": "Datum testament",
    "bsn-rsin-gemachtigde": "BSN/RSIN gemachtigde",
    "beconnummer-adviseur": "Beconnummer adviseur",
    "protocolnummer-notaris-2": "Protocolnummer notaris (gemachtigde)",
    "voorletters-gemachtigde": "Voorletter(s) gemachtigde",
    "tussenvoegsels-gemachtigde": "Tussenvoegsel(s) gemachtigde",
    "achternaam-gemachtigde": "Achternaam gemachtigde",
    "naam-instelling": "Naam instelling",
    "straat-huisnummer-gemachtigde": "Straat en huisnummer (NL)",
    "postcode-gemachtigde": "Postcode",
    "woonplaats-gemachtigde": "Woonplaats",
    "straat-huisnummer-buitenland": "Straat en huisnummer (buitenland)",
    "postcode-buitenland": "Postcode en plaats (buitenland)",
    "landcode-gemachtigde": "Landcode",
    "telefoonnummer-gemachtigde": "Telefoonnummer",
    "email-gemachtigde": "E-mailadres",
    "rol-aangever": "Rol aangever",
    "aantal-verkrijgers": "Aantal verkrijgers",
    "verkrijgers-geen-aangifte": "Verkrijgers zonder aangifte",
    "aanslag-sturen": "Aanslag sturen naar",
    "is-executeur": "Bent u executeur of gemachtigde",
    "executeur-bsn": "BSN/RSIN executeur",
    "executeur-protocolnummer": "Protocolnummer executeur",
    "executeur-beconnummer": "Beconnummer executeur",
    "executeur-voorletters": "Voorletter(s) executeur",
    "executeur-tussenvoegsel": "Tussenvoegsel(s) executeur",
    "executeur-achternaam": "Achternaam executeur",
    "executeur-naam-instelling": "Naam instelling executeur"
};

formElement.addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const answers = [];

    for (const [name, value] of formData.entries()) {
        let normalizedValue = "";

        if (value instanceof File) {
            if (value.name) {
                normalizedValue = value.name;
            }
        } else {
            normalizedValue = String(value).trim();
        }

        if (!normalizedValue) {
            continue;
        }

        const label = labelMap[name] || name;
        answers.push({ label, value: normalizedValue });
    }

    localStorage.setItem("answers", JSON.stringify(answers));
    window.location.href = "answer.html";
});

if (formElement) {
    formElement.addEventListener("input", saveFormDraft);
    formElement.addEventListener("change", saveFormDraft);
}

if (clearSavedDataButton) {
    clearSavedDataButton.addEventListener("click", clearStoredFormDraft);
}

window.addEventListener("beforeprint", wipeAllFormData);

// Vraag 1a
// Vraag 1a - volgende Check
byId("volgende-vraag-1a").addEventListener("click", function() {
    const voorlettersOverledene = valueOf("voorletters-overledene");
    const achternaamOverledene = valueOf("achternaam-overledene");
    const bsnOverledene = valueOf("bsn-overledene");
    const datumOverlijden = valueOf("datum-overlijden");

    if (voorlettersOverledene === "") {
        showDialog("De vraag Voorletter(s) is verplicht");
        return;
    } else if (achternaamOverledene === "") {
        showDialog("De vraag Achternaam is verplicht");
        return;
    } else if (bsnOverledene === "") {
        showDialog("De vraag BSN is verplicht");
        return;
    } else if (datumOverlijden === "") {
        showDialog("De vraag Overlijdensdatum is verplicht");
        return;
    }

    if (!isValidBsn(bsnOverledene.trim())) {
        showDialog("Vul een geldig BSN in met 8 of 9 cijfers");
        return;
    }

    if (datumOverlijden > maxOverlijdensdatum) {
        showDialog("De datum van overlijden kan niet in de toekomst liggen");
        return;
    }

    if (datumOverlijden < minOverlijdensdatum) {
        showDialog("De datum van overlijden mag niet ouder zijn dan 8 maanden");
        return;
    }

    setStep(1);
    setHidden("vraag-1a", true);
    setHidden("vraag-1b", false);
});

// Vraag 1b
// Vraag 1b-1
byId("niet-getrouwd").addEventListener("change", function() {
    setHidden("volgende-vraag-1b", false);
    setHidden("vraag-1b-2", true);
    clearChecked("voorwaarden");
    setHidden("vraag-1b-2-voorwarden-kopie", true);
    setValue("kopie-akte", "");
    setHidden("vraag-1b-3", true);
    clearChecked("verrekenbeding");
    setHidden("vraag-1b-4", true);
    setValue("datum-voorwaarden", "");
});

byId("getrouwd").addEventListener("change", function() {
    setHidden("vraag-1b-2", false);
    setHidden("volgende-vraag-1b", true);
});

// Vraag 1b-2
byId("geen-voorwaarden").addEventListener("change", function() {
    setHidden("volgende-vraag-1b", false);
    setHidden("vraag-1b-2-voorwarden-kopie", true);
    setValue("kopie-akte", "");
    setHidden("vraag-1b-3", true);
    clearChecked("verrekenbeding");
    setHidden("vraag-1b-4", true);
    setValue("datum-voorwaarden", "");
    clearMark("datum-voorwaarden");
});

byId("wel-voorwaarden").addEventListener("change", function() {
    setHidden("vraag-1b-2-voorwarden-kopie", false);
    setHidden("vraag-1b-3", false);
    setHidden("vraag-1b-4", false);
    setHidden("volgende-vraag-1b", false);
});

// Vraag 1b - Volgende check
byId("volgende-vraag-1b").addEventListener("click", function() {
    const vraag1b2Visible = isVisible("vraag-1b-2");
    const vraag1b2KopieVisible = isVisible("vraag-1b-2-voorwarden-kopie");
    const vraag1b3Visible = isVisible("vraag-1b-3");
    const vraag1b4Visible = isVisible("vraag-1b-4");

    const huwelijkValue = checkedValue("huwelijk");
    const voorwaardenValue = checkedValue("voorwaarden");
    const kopieAktenValue = valueOf("kopie-akte");
    const verrekenbedingValue = checkedValue("verrekenbeding");
    const datumVoorwaardenValue = valueOf("datum-voorwaarden");
    const moetDatumVoorwaardenIngevuldZijn = vraag1b4Visible && voorwaardenValue === "ja";

    if (huwelijkValue === "") {
        showDialog("De vraag Getrouwd of geregistreerd partnerschap is verplicht");
    } else if (vraag1b2Visible && voorwaardenValue === "") {
        showDialog("De vraag Huwelijkse/partnerschapsvoorwaarden is verplicht");
    } else if (vraag1b2KopieVisible && kopieAktenValue === "") {
        showDialog("De vraag Kopie van de akte is verplicht");
    } else if (vraag1b3Visible && verrekenbedingValue === "") {
        showDialog("De vraag Finaal verrekenbeding is verplicht");
    } else if (moetDatumVoorwaardenIngevuldZijn && datumVoorwaardenValue === "") {
        showDialog("De vraag Datum voorwaarden is verplicht");
    } else if (moetDatumVoorwaardenIngevuldZijn && datumVoorwaardenValue > valueOf("datum-overlijden")) {
        showDialog("De datum van de voorwaarden kan niet na de datum van overlijden liggen");
    } else {
        setStep(2);
        setHidden("vraag-1b", true);
        setHidden("vraag-1c", false);
    }
});

// Vraag 1c
// Vraag 1c-1
byId("geen-kinderen").addEventListener("change", function() {
    setHidden("volgende-vraag-1c", false);
    setHidden("vraag-1c-2", true);
    clearChecked("overleden-kinderen");
    setHidden("vraag-1c-3", true);
    clearChecked("kinderen-overleden-kind");
});

byId("wel-kinderen").addEventListener("change", function() {
    setHidden("vraag-1c-2", false);
    setHidden("volgende-vraag-1c", true);
});

// Vraag 1c-2
byId("geen-overleden-kinderen").addEventListener("change", function() {
    setHidden("volgende-vraag-1c", false);
    setHidden("vraag-1c-3", true);
    clearChecked("kinderen-overleden-kind");
});

byId("wel-overleden-kinderen").addEventListener("change", function() {
    setHidden("vraag-1c-3", false);
    setHidden("volgende-vraag-1c", false);
});

// Vraag 1c - Volgende check
byId("volgende-vraag-1c").addEventListener("click", function() {
    const vraag1c1Visible = isVisible("vraag-1c-1");
    const vraag1c2Visible = isVisible("vraag-1c-2");
    const vraag1c3Visible = isVisible("vraag-1c-3");

    const kinderenValue = checkedValue("kinderen");
    const overledenKinderenValue = checkedValue("overleden-kinderen");
    const overledenKindKinderenValue = checkedValue("kinderen-overleden-kind");

    if (vraag1c1Visible && kinderenValue === "") {
        showDialog("De vraag Kinderen is verplicht");
    } else if (vraag1c2Visible && overledenKinderenValue === "") {
        showDialog("De vraag Eerder overleden kind is verplicht");
    } else if (vraag1c3Visible && overledenKindKinderenValue === "") {
        showDialog("De vraag Kinderen van overleden kind is verplicht");
    } else {
        setStep(3);
        setHidden("vraag-1c", true);
        setHidden("vraag-1d", false);
    }
});

// Vraag 1d
// Vraag 1d-1
byId("geen-testament").addEventListener("change", function() {
    setHidden("volgende-vraag-1d", false);
    setHidden("vraag-1d-2", true);
    clearValues([
        "protocolnummer-notaris",
        "voorletters-notaris",
        "tussenvoegsels-notaris",
        "achternaam-notaris",
        "vestigingsplaats",
        "datum-testament"
    ]);
    ["protocolnummer-notaris", "voorletters-notaris", "achternaam-notaris", "vestigingsplaats", "datum-testament"].forEach(clearMark);
});

byId("wel-testament").addEventListener("change", function() {
    setHidden("vraag-1d-2", false);
    setHidden("volgende-vraag-1d", true);
});

// Vraag 1d - Volgende check
byId("volgende-vraag-1d").addEventListener("click", function() {
    const vraag1d2Visible = isVisible("vraag-1d-2");

    const testamentValue = checkedValue("testament");
    const protocolnummerNotaris = valueOf("protocolnummer-notaris");
    const voorlettersNotaris = valueOf("voorletters-notaris");
    const tussenvoegselsNotaris = valueOf("tussenvoegsels-notaris");
    const achternaamNotaris = valueOf("achternaam-notaris");
    const vestigingsplaatsNotaris = valueOf("vestigingsplaats");
    const datumTestament = valueOf("datum-testament");
    if (testamentValue === "") {
        showDialog("De vraag Testament is verplicht");
    } else if (vraag1d2Visible && (protocolnummerNotaris === "" || voorlettersNotaris === "" || achternaamNotaris === "" || vestigingsplaatsNotaris === "" || datumTestament === "")) {
        showDialog("De vraag Notaris info is verplicht");
    } else if (vraag1d2Visible && datumTestament > valueOf("datum-overlijden")) {
        showDialog("De datum van het testament kan niet na de datum van overlijden liggen");
    } else {
        setStep(4);
        setHidden("vraag-1d", true);
        collapseSectionTitle("vraag-1");
        setHidden("vraag-2", false);
    }
});

restoreFormDraft();

const restoreValidation = () => {
    if (!formElement) return;

    // Re-fire change on all checked radios to restore conditional visibility
    formElement.querySelectorAll("input[type='radio']:checked").forEach(radio => {
        radio.dispatchEvent(new Event("change", { bubbles: true }));
    });

    // Validate all restored text/date/tel/email/select fields
    const textFields = formElement.querySelectorAll(
        "input[type='text'], input[type='date'], input[type='tel'], input[type='email'], select"
    );

    textFields.forEach(field => {
        const val = field.value.trim();
        if (!val) return; // empty = no mark needed

        const id = field.id;
        if (!id) return;

        // Skip hidden fields
        if (!visibleParent(id)) return;

        // Field-specific validation
        if (id === "bsn-overledene" || id === "bsn-rsin-gemachtigde" ||
            id === "verkrijger-bsn" || id === "executeur-bsn") {
            isValidBsn(val) ? markValid(id) : markInvalid(id, "BSN/RSIN moet 8 of 9 cijfers bevatten");

        } else if (id === "postcode-gemachtigde") {
            /^\d{4}\s?[A-Za-z]{2}$/.test(val)
                ? markValid(id)
                : markInvalid(id, "Vul een geldige postcode in, bijv. 1234 AB");

        } else if (id === "telefoonnummer-gemachtigde") {
            /^[0-9\s\+\-\(\)]{7,15}$/.test(val)
                ? markValid(id)
                : markInvalid(id, "Vul een geldig telefoonnummer in");

        } else if (id === "email-gemachtigde") {
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
                ? markValid(id)
                : markInvalid(id, "Vul een geldig e-mailadres in");

        } else if (id === "beconnummer-adviseur" || id === "executeur-beconnummer") {
            /^\d+$/.test(val)
                ? markValid(id)
                : markInvalid(id, "Beconnummer mag alleen cijfers bevatten");

        } else if (id.startsWith("voorletters")) {
            validateVoorletters(id, val);
            return;

        } else if (id === "datum-overlijden" || id === "datum-voorwaarden" || id === "datum-testament") {
            markValid(id);

        } else {
            // All other text fields: if filled, mark valid
            markValid(id);
        }
    });
};

restoreValidation();

// Vraag 2a - volgende check
byId("volgende-vraag-2a").addEventListener("click", function() {
    const bsnRsin = valueOf("bsn-rsin-gemachtigde").trim();
    const becon = valueOf("beconnummer-adviseur").trim();
    const protocol = valueOf("protocolnummer-notaris-2").trim();

    if (!bsnRsin && !becon && !protocol) {
        showDialog("Vul minimaal 1 van de 3 identificatievelden in: BSN/RSIN, beconnummer of protocolnummer.");
        return;
    }

    if (bsnRsin && !isValidBsn(bsnRsin)) {
        showDialog("Het BSN/RSIN moet uit 8 of 9 cijfers bestaan.");
        return;
    }

    setStep(5);
    setHidden("vraag-2a", true);
    setHidden("vraag-2b", false);
});

// Vraag 2a - BSN/RSIN blur
byId("bsn-rsin-gemachtigde").addEventListener("blur", function() {
    const val = this.value.trim();
    if (val === "") {
        clearMark("bsn-rsin-gemachtigde");
    } else if (!isValidBsn(val)) {
        markInvalid("bsn-rsin-gemachtigde", "BSN/RSIN moet 8 of 9 cijfers bevatten");
    } else {
        markValid("bsn-rsin-gemachtigde");
    }
});

// Vraag 2b - adres keuze
byId("adres-nl").addEventListener("change", function() {
    setHidden("vraag-2b-adres-nl", false);
    setHidden("vraag-2b-adres-buitenland", true);
    clearValues(["straat-huisnummer-buitenland", "postcode-buitenland", "landcode-gemachtigde"]);
    ["straat-huisnummer-buitenland", "postcode-buitenland", "landcode-gemachtigde"].forEach(clearMark);
});

byId("adres-buitenland").addEventListener("change", function() {
    setHidden("vraag-2b-adres-buitenland", false);
    setHidden("vraag-2b-adres-nl", true);
    clearValues(["straat-huisnummer-gemachtigde", "postcode-gemachtigde", "woonplaats-gemachtigde"]);
    ["straat-huisnummer-gemachtigde", "postcode-gemachtigde", "woonplaats-gemachtigde"].forEach(clearMark);
});

// Vraag 2b - volgende check
byId("volgende-vraag-2b").addEventListener("click", function() {
    const achternaam = valueOf("achternaam-gemachtigde").trim();
    const naamInstelling = valueOf("naam-instelling").trim();
    const email = valueOf("email-gemachtigde").trim();

    if (!achternaam && !naamInstelling) {
        showDialog("Vul de achternaam van de gemachtigde of de naam van de instelling in.");
        return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showDialog("Vul een geldig e-mailadres in.");
        return;
    }

    setStep(6);
    setHidden("vraag-2", true);
    collapseSectionTitle("vraag-2");
    setHidden("vraag-3", false);
});

// Vraag 3

// Verkrijger storage helpers
const verkrijgersStorageKey = "erfbelasting-verkrijgers";

const getVerkrijgers = () => {
    try {
        return JSON.parse(localStorage.getItem(verkrijgersStorageKey) || "[]");
    } catch { return []; }
};

const saveVerkrijgers = (list) => {
    localStorage.setItem(verkrijgersStorageKey, JSON.stringify(list));
};


// Verkrijger list render
const renderVerkrijgersList = () => {
    const list = getVerkrijgers();
    const container = byId("verkrijgers-opgeslagen-lijst");
    const dropdown = byId("verkrijger-dropdown");
    const countEl = byId("verkrijger-count");
    if (!container || !dropdown || !countEl) return;

    // Remove all dynamic options (keep the placeholder at index 0)
    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }

    if (!list.length) {
        container.hidden = true;
        return;
    }

    list.forEach((v, i) => {
        const label = [v.voorletters, v.tussenvoegsel, v.achternaam].filter(Boolean).join(" ") || v.bsn || "Verkrijger " + (i + 1);
        const option = document.createElement("option");
        option.value = i;
        option.textContent = label;
        dropdown.appendChild(option);
    });

    countEl.textContent = list.length + " verkrijger(s) opgeslagen.";
    dropdown.value = "";
    container.hidden = false;
};


// Verkrijger form reset
const clearVerkrijgerForm = () => {
    setValue("verkrijger-bsn", "");
    setValue("verkrijger-voorletters", "");
    setValue("verkrijger-tussenvoegsel", "");
    setValue("verkrijger-achternaam", "");
    clearChecked("verkrijger-heel-vermogen");
    clearChecked("verkrijger-legitieme");
    clearMark("verkrijger-bsn");
    clearMark("verkrijger-voorletters");
    clearMark("verkrijger-tussenvoegsel");
    clearMark("verkrijger-achternaam");
    byId("verkrijger-formulier-titel").textContent = "Verkrijger toevoegen";
    byId("sla-verkrijger-op").textContent = "Voeg verkrijger toe";
    byId("sla-verkrijger-op").removeAttribute("data-edit-index");
    setHidden("annuleer-verkrijger", true);
    const dd = byId("verkrijger-dropdown");
    if (dd) dd.value = "";
};


// Verkrijger form load
const loadVerkrijgerIntoForm = (index) => {
    const list = getVerkrijgers();
    const v = list[index];
    if (!v) return;
    setValue("verkrijger-bsn", v.bsn || "");
    setValue("verkrijger-voorletters", v.voorletters || "");
    setValue("verkrijger-tussenvoegsel", v.tussenvoegsel || "");
    setValue("verkrijger-achternaam", v.achternaam || "");
    const heelVermogenInput = document.querySelector(`input[name="verkrijger-heel-vermogen"][value="${v.heelVermogen}"]`);
    if (heelVermogenInput) heelVermogenInput.checked = true;
    const legitiemeInput = document.querySelector(`input[name="verkrijger-legitieme"][value="${v.legitieme}"]`);
    if (legitiemeInput) legitiemeInput.checked = true;
    byId("verkrijger-formulier-titel").textContent = "Verkrijger bewerken";
    byId("sla-verkrijger-op").textContent = "Sla wijzigingen op";
    byId("sla-verkrijger-op").setAttribute("data-edit-index", index);
    setHidden("annuleer-verkrijger", false);
    byId("verkrijger-formulier").scrollIntoView({ behavior: "smooth", block: "start" });
};

// Verkrijger dropdown - load on change
byId("verkrijger-dropdown").addEventListener("change", function () {
    const idx = this.value;
    if (idx === "") return;
    loadVerkrijgerIntoForm(parseInt(idx));
});

// Vraag 3a
["rol-executeur", "rol-erfgenaam-gemachtigd", "rol-geen-erfgenaam"].forEach(id => {
    byId(id).addEventListener("change", function () {
        setHidden("vraag-3a-aantal", false);
        setHidden("volgende-vraag-3a", false);
    });
});

["rol-erfgenaam-samen", "rol-erfgenaam-zelf"].forEach(id => {
    byId(id).addEventListener("change", function () {
        setHidden("vraag-3a-aantal", true);
        setValue("aantal-verkrijgers", "");
        setHidden("volgende-vraag-3a", false);
    });
});

byId("volgende-vraag-3a").addEventListener("click", function () {
    const rol = checkedValue("rol-aangever");
    if (!rol) {
        showDialog("Selecteer uw rol.");
        return;
    }
    const aantalVereist = ["executeur", "erfgenaam-gemachtigd", "geen-erfgenaam"].includes(rol);
    if (aantalVereist) {
        const aantal = valueOf("aantal-verkrijgers").trim();
        if (!aantal || isNaN(aantal) || parseInt(aantal) < 1) {
            showDialog("Vul het aantal verkrijgers in.");
            return;
        }
    }
    setStep(7);
    setHidden("vraag-3a", true);
    setHidden("vraag-3b", false);
});

// Vraag 3b
byId("geen-aangifte-nee").addEventListener("change", function () {
    setHidden("vraag-3b-verkrijger-sectie", true);
    setHidden("volgende-vraag-3b", false);
});

byId("geen-aangifte-ja").addEventListener("change", function () {
    setHidden("vraag-3b-verkrijger-sectie", false);
    renderVerkrijgersList();
    setHidden("volgende-vraag-3b", false);
});

// Vraag 3b - sla verkrijger op
byId("sla-verkrijger-op").addEventListener("click", function () {
    const achternaam = valueOf("verkrijger-achternaam").trim();
    const bsn = valueOf("verkrijger-bsn").trim();
    const heelVermogen = checkedValue("verkrijger-heel-vermogen");
    const legitieme = checkedValue("verkrijger-legitieme");

    if (!achternaam && !bsn) {
        showDialog("Vul minimaal de achternaam of het BSN/RSIN van de verkrijger in.");
        return;
    }
    if (!heelVermogen) {
        showDialog("Geef aan of deze verkrijger het hele vermogen krijgt.");
        return;
    }
    if (!legitieme) {
        showDialog("Geef aan of deze verkrijger een beroep doet op de legitieme portie.");
        return;
    }

    const entry = {
        bsn,
        voorletters: valueOf("verkrijger-voorletters").trim(),
        tussenvoegsel: valueOf("verkrijger-tussenvoegsel").trim(),
        achternaam,
        heelVermogen,
        legitieme
    };

    const list = getVerkrijgers();
    const editIndex = this.getAttribute("data-edit-index");

    if (editIndex !== null && editIndex !== "") {
        list[parseInt(editIndex)] = entry;
    } else {
        list.push(entry);
    }

    saveVerkrijgers(list);
    clearVerkrijgerForm();
    renderVerkrijgersList();
    byId("vraag-3b").scrollIntoView({ behavior: "smooth", block: "start" });
});

byId("annuleer-verkrijger").addEventListener("click", function () {
    clearVerkrijgerForm();
});

byId("volgende-vraag-3b").addEventListener("click", function () {
    const geenAangifte = checkedValue("verkrijgers-geen-aangifte");
    if (!geenAangifte) {
        showDialog("Beantwoord de vraag over verkrijgers zonder aangifte.");
        return;
    }
    if (geenAangifte === "ja" && getVerkrijgers().length === 0) {
        showDialog("Voeg minimaal 1 verkrijger toe waarvoor u geen aangifte doet.");
        return;
    }
    setStep(8);
    setHidden("vraag-3b", true);
    setHidden("vraag-3c", false);
});

// Vraag 3c
byId("aanslag-iedere-verkrijger").addEventListener("change", function () {
    setHidden("vraag-3d", false);
    setHidden("volgende-vraag-3c", false);
});

byId("aanslag-executeur").addEventListener("change", function () {
    setHidden("vraag-3d", false);
    setHidden("volgende-vraag-3c", false);
});

byId("is-executeur-nee").addEventListener("change", function () {
    setHidden("vraag-3e", true);
    setHidden("volgende-vraag-3c", false);
});

byId("is-executeur-ja").addEventListener("change", function () {
    setHidden("vraag-3e", false);
    setHidden("volgende-vraag-3c", false);
});

byId("volgende-vraag-3c").addEventListener("click", function () {
    const aanslag = checkedValue("aanslag-sturen");
    if (!aanslag) {
        showDialog("Geef aan naar wie de aanslag gestuurd moet worden.");
        return;
    }
    const isExecuteur = checkedValue("is-executeur");
    if (!isExecuteur) {
        showDialog("Beantwoord vraag 3d: bent u executeur of gemachtigde?");
        return;
    }
    if (isExecuteur === "ja") {
        const bsn = valueOf("executeur-bsn").trim();
        const achternaam = valueOf("executeur-achternaam").trim();
        const instelling = valueOf("executeur-naam-instelling").trim();
        if (!bsn && !achternaam && !instelling) {
            showDialog("Vul minimaal het BSN/RSIN of de naam in bij de gegevens van de executeur/gemachtigde.");
            return;
        }
    }
    setHidden("vraag-3c", true);
    // For now, submit the form — more sections can follow
    formElement.requestSubmit();
});

// Blur validation - Vraag 2 & 3

// Check if field is visible
// Vraag 2a - blur
byId("beconnummer-adviseur").addEventListener("blur", function () {
    if (!visibleParent("beconnummer-adviseur")) return;
    const val = this.value.trim();
    if (val && !/^\d+$/.test(val)) {
        markInvalid("beconnummer-adviseur", "Beconnummer mag alleen cijfers bevatten");
    } else {
        clearMark("beconnummer-adviseur");
    }
});

byId("protocolnummer-notaris-2").addEventListener("blur", function () {
    if (!visibleParent("protocolnummer-notaris-2")) return;
    if (this.value.trim()) {
        markValid("protocolnummer-notaris-2");
    } else {
        clearMark("protocolnummer-notaris-2");
    }
});

// Vraag 2b - blur
byId("voorletters-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("voorletters-gemachtigde")) return;
    validateVoorletters("voorletters-gemachtigde", this.value.trim());
});
byId("voorletters-gemachtigde").addEventListener("input", function () {
    if (!visibleParent("voorletters-gemachtigde")) return;
    validateVoorletters("voorletters-gemachtigde", this.value.trim());
});

byId("tussenvoegsels-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("tussenvoegsels-gemachtigde")) return;
    if (this.value.trim()) {
        markValid("tussenvoegsels-gemachtigde");
    } else {
        clearMark("tussenvoegsels-gemachtigde");
    }
});

byId("achternaam-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("achternaam-gemachtigde")) return;
    if (this.value.trim()) {
        markValid("achternaam-gemachtigde");
    } else {
        clearMark("achternaam-gemachtigde");
    }
});

byId("naam-instelling").addEventListener("blur", function () {
    if (!visibleParent("naam-instelling")) return;
    if (this.value.trim()) {
        markValid("naam-instelling");
    } else {
        clearMark("naam-instelling");
    }
});

byId("straat-huisnummer-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("straat-huisnummer-gemachtigde")) return;
    if (this.value.trim()) {
        markValid("straat-huisnummer-gemachtigde");
    } else {
        clearMark("straat-huisnummer-gemachtigde");
    }
});

const validatePostcode = (id, val) => {
    if (!val) {
        clearMark(id);
    } else if (/^\d{4}\s?[A-Za-z]{2}$/.test(val)) {
        markValid(id);
    } else if (val.length >= 6) {
        markInvalid(id, "Vul een geldige postcode in, bijv. 1234 AB");
    } else {
        clearMark(id);
    }
};

byId("postcode-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("postcode-gemachtigde")) return;
    const val = this.value.trim();
    if (val && !/^\d{4}\s?[A-Za-z]{2}$/.test(val)) {
        markInvalid("postcode-gemachtigde", "Vul een geldige postcode in, bijv. 1234 AB");
    } else if (val) {
        markValid("postcode-gemachtigde");
    } else {
        clearMark("postcode-gemachtigde");
    }
});

byId("postcode-gemachtigde").addEventListener("input", function () {
    if (!visibleParent("postcode-gemachtigde")) return;
    validatePostcode("postcode-gemachtigde", this.value.trim());
});

byId("woonplaats-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("woonplaats-gemachtigde")) return;
    if (this.value.trim()) {
        markValid("woonplaats-gemachtigde");
    } else {
        clearMark("woonplaats-gemachtigde");
    }
});

byId("straat-huisnummer-buitenland").addEventListener("blur", function () {
    if (!visibleParent("straat-huisnummer-buitenland")) return;
    if (this.value.trim()) {
        markValid("straat-huisnummer-buitenland");
    } else {
        clearMark("straat-huisnummer-buitenland");
    }
});

byId("postcode-buitenland").addEventListener("blur", function () {
    if (!visibleParent("postcode-buitenland")) return;
    if (this.value.trim()) {
        markValid("postcode-buitenland");
    } else {
        clearMark("postcode-buitenland");
    }
});

byId("telefoonnummer-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("telefoonnummer-gemachtigde")) return;
    const val = this.value.trim();
    if (val && !/^[0-9\s\+\-\(\)]{7,15}$/.test(val)) {
        markInvalid("telefoonnummer-gemachtigde", "Vul een geldig telefoonnummer in");
    } else if (val) {
        markValid("telefoonnummer-gemachtigde");
    } else {
        clearMark("telefoonnummer-gemachtigde");
    }
});

byId("email-gemachtigde").addEventListener("blur", function () {
    if (!visibleParent("email-gemachtigde")) return;
    const val = this.value.trim();
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        markInvalid("email-gemachtigde", "Vul een geldig e-mailadres in");
    } else if (val) {
        markValid("email-gemachtigde");
    } else {
        clearMark("email-gemachtigde");
    }
});

// Vraag 3a - blur
byId("aantal-verkrijgers").addEventListener("blur", function () {
    if (!visibleParent("aantal-verkrijgers")) return;
    const val = this.value.trim();
    if (val === "") {
        markInvalid("aantal-verkrijgers", "Vul het aantal verkrijgers in");
    } else if (isNaN(val) || parseInt(val) < 1) {
        markInvalid("aantal-verkrijgers", "Vul een geldig aantal in (minimaal 1)");
    } else {
        markValid("aantal-verkrijgers");
    }
});

// Vraag 3b - blur
byId("verkrijger-bsn").addEventListener("blur", function () {
    const val = this.value.trim();
    if (val && !isValidBsn(val)) {
        markInvalid("verkrijger-bsn", "BSN/RSIN moet 8 of 9 cijfers bevatten");
    } else if (val && !elfValidBsn(val)) {
        // Elfproef — bron: https://nl.wikipedia.org/wiki/Elfproef
        markInvalid("verkrijger-bsn", "BSN/RSIN is niet geldig (elfproef mislukt)");
    } else if (val) {
        markValid("verkrijger-bsn");
    } else {
        clearMark("verkrijger-bsn");
    }
});

byId("verkrijger-voorletters").addEventListener("blur", function () {
    validateVoorletters("verkrijger-voorletters", this.value.trim());
});
byId("verkrijger-voorletters").addEventListener("input", function () {
    validateVoorletters("verkrijger-voorletters", this.value.trim());
});

byId("verkrijger-tussenvoegsel").addEventListener("blur", function () {
    if (this.value.trim()) {
        markValid("verkrijger-tussenvoegsel");
    } else {
        clearMark("verkrijger-tussenvoegsel");
    }
});

byId("verkrijger-achternaam").addEventListener("blur", function () {
    const achternaam = this.value.trim();
    const bsn = valueOf("verkrijger-bsn").trim();
    if (!achternaam && !bsn) {
        markInvalid("verkrijger-achternaam", "Vul de achternaam of het BSN/RSIN in");
    } else if (achternaam) {
        markValid("verkrijger-achternaam");
    } else {
        clearMark("verkrijger-achternaam");
    }
});

// Vraag 3e - blur
byId("executeur-bsn").addEventListener("blur", function () {
    if (!visibleParent("executeur-bsn")) return;
    const val = this.value.trim();
    if (val && !isValidBsn(val)) {
        markInvalid("executeur-bsn", "BSN/RSIN moet 8 of 9 cijfers bevatten");
    } else if (val && !elfValidBsn(val)) {
        // Elfproef — bron: https://nl.wikipedia.org/wiki/Elfproef
        markInvalid("executeur-bsn", "BSN/RSIN is niet geldig (elfproef mislukt)");
    } else if (val) {
        markValid("executeur-bsn");
    } else {
        clearMark("executeur-bsn");
    }
});

byId("executeur-voorletters").addEventListener("blur", function () {
    if (!visibleParent("executeur-voorletters")) return;
    validateVoorletters("executeur-voorletters", this.value.trim());
});
byId("executeur-voorletters").addEventListener("input", function () {
    if (!visibleParent("executeur-voorletters")) return;
    validateVoorletters("executeur-voorletters", this.value.trim());
});

byId("executeur-tussenvoegsel").addEventListener("blur", function () {
    if (!visibleParent("executeur-tussenvoegsel")) return;
    if (this.value.trim()) {
        markValid("executeur-tussenvoegsel");
    } else {
        clearMark("executeur-tussenvoegsel");
    }
});

byId("executeur-achternaam").addEventListener("blur", function () {
    if (!visibleParent("executeur-achternaam")) return;
    const achternaam = this.value.trim();
    const instelling = valueOf("executeur-naam-instelling").trim();
    const bsn = valueOf("executeur-bsn").trim();
    if (!achternaam && !instelling && !bsn) {
        markInvalid("executeur-achternaam", "Vul minimaal het BSN/RSIN of de naam in");
    } else if (achternaam) {
        markValid("executeur-achternaam");
    } else {
        clearMark("executeur-achternaam");
    }
});

byId("executeur-naam-instelling").addEventListener("blur", function () {
    if (!visibleParent("executeur-naam-instelling")) return;
    if (this.value.trim()) {
        markValid("executeur-naam-instelling");
    } else {
        clearMark("executeur-naam-instelling");
    }
    if (valueOf("executeur-achternaam").trim()) clearMark("executeur-achternaam");
});

byId("executeur-protocolnummer").addEventListener("blur", function () {
    if (!visibleParent("executeur-protocolnummer")) return;
    if (this.value.trim()) {
        markValid("executeur-protocolnummer");
    } else {
        clearMark("executeur-protocolnummer");
    }
});

byId("executeur-beconnummer").addEventListener("blur", function () {
    if (!visibleParent("executeur-beconnummer")) return;
    const val = this.value.trim();
    if (val && !/^\d+$/.test(val)) {
        markInvalid("executeur-beconnummer", "Beconnummer mag alleen cijfers bevatten");
    } else if (val) {
        markValid("executeur-beconnummer");
    } else {
        clearMark("executeur-beconnummer");
    }
});

// ─── Terug-knoppen ────────────────────────────────────────────────────────────

let _scrollTimer = null;
const scrollToStep = (id) => {
    if (_scrollTimer) {
        clearTimeout(_scrollTimer);
    }
    _scrollTimer = setTimeout(() => {
        const el = byId(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        _scrollTimer = null;
    }, 80);
};

// Terug 1b → 1a
byId("terug-vraag-1b").addEventListener("click", function () {
    setHidden("vraag-1b", true);
    setHidden("vraag-1a", false);
    setStep(0);
    scrollToStep("vraag-1a");
});

// Terug 1c → 1b
byId("terug-vraag-1c").addEventListener("click", function () {
    setHidden("vraag-1c", true);
    setHidden("vraag-1b", false);
    // Restore the volgende-1b button if the user already picked a huwelijk radio
    const huwelijk = checkedValue("huwelijk");
    if (huwelijk === "nee" || checkedValue("voorwaarden") !== "") {
        setHidden("volgende-vraag-1b", false);
    }
    setStep(1);
    scrollToStep("vraag-1b");
});

// Terug 1d → 1c
byId("terug-vraag-1d").addEventListener("click", function () {
    setHidden("vraag-1d", true);
    setHidden("vraag-1c", false);
    // Restore the volgende-1c button if kinderen radio was already picked
    if (checkedValue("kinderen") !== "") {
        setHidden("volgende-vraag-1c", false);
    }
    setStep(2);
    scrollToStep("vraag-1c");
});

// Terug 2a → 1d  (also un-collapse vraag-1 section title)
byId("terug-vraag-2a").addEventListener("click", function () {
    setHidden("vraag-2", true);
    setHidden("vraag-1", false);
    setHidden("vraag-1d", false);
    // Un-collapse vraag-1 section header
    const legend1 = byId("vraag-1")?.querySelector(":scope > legend");
    if (legend1) legend1.hidden = false;
    // Restore the volgende-1d button if testament radio was already picked
    if (checkedValue("testament") !== "") {
        setHidden("volgende-vraag-1d", false);
    }
    setStep(3);
    scrollToStep("vraag-1d");
});

// Terug 2b → 2a
byId("terug-vraag-2b").addEventListener("click", function () {
    setHidden("vraag-2b", true);
    setHidden("vraag-2a", false);
    setStep(4);
    scrollToStep("vraag-2a");
});

// Terug 3a → 2b  (also un-collapse vraag-2 section title)
byId("terug-vraag-3a").addEventListener("click", function () {
    setHidden("vraag-3", true);
    setHidden("vraag-2", false);
    setHidden("vraag-2b", false);
    // Un-collapse vraag-2 section header
    const legend2 = byId("vraag-2")?.querySelector(":scope > legend");
    if (legend2) legend2.hidden = false;
    setStep(5);
    scrollToStep("vraag-2b");
});

// Terug 3b → 3a
byId("terug-vraag-3b").addEventListener("click", function () {
    setHidden("vraag-3b", true);
    setHidden("vraag-3a", false);
    // Restore the volgende-3a button if rol-aangever radio was already picked
    if (checkedValue("rol-aangever") !== "") {
        setHidden("volgende-vraag-3a", false);
    }
    setStep(6);
    scrollToStep("vraag-3a");
});

// Terug 3c → 3b
byId("terug-vraag-3c").addEventListener("click", function () {
    setHidden("vraag-3c", true);
    setHidden("vraag-3b", false);
    setStep(7);
    scrollToStep("vraag-3b");
});
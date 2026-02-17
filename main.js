// Helper functions 

const feedbackDialog = document.getElementById("feedback-dialog");
const feedbackDialogMessage = document.getElementById("feedback-dialog-message");
const feedbackDialogClose = document.getElementById("feedback-dialog-close");

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

if (feedbackDialogClose && feedbackDialog) {
    feedbackDialogClose.addEventListener("click", () => {
        feedbackDialog.close();
    });
}

const isValidBsn = (value) => /^\d{9}$/.test(value);

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
    "Protocolnummer-notaris": "Protocolnummer notaris",
    "Voorletters-notaris": "Voorletter(s) notaris",
    "Tussenvoegsels-notaris": "Tussenvoegsel(s) notaris",
    "Achternaam-notaris": "Achternaam notaris",
    "vestigingsplaats": "Vestigingsplaats notaris",
    "datum-testament": "Datum testament"
};

document.querySelector("form").addEventListener("submit", function(event) {
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

// Vraag 1a
// Vraag 1a - datum check
byId("datum-overlijden").addEventListener("blur", function() {
    const datumOverlijden = valueOf("datum-overlijden");
    const vandaag = new Date().toISOString().split("T")[0];
    if (datumOverlijden > vandaag) {
        showDialog("De datum van overlijden kan niet in de toekomst liggen");
        setValue("datum-overlijden", "");
    }
});

byId("bsn-overledene").addEventListener("blur", function() {
    const bsnOverledene = valueOf("bsn-overledene").trim();
    if (bsnOverledene !== "" && !isValidBsn(bsnOverledene)) {
        showDialog("Vul een geldig BSN in met precies 9 cijfers");
        setValue("bsn-overledene", "");
    }
});

// Vraag 1a - volgende Check
byId("volgende-vraag-1a").addEventListener("click", function() {
    const voorlettersOverledene = valueOf("voorletters-overledene");
    const achternaamOverledene = valueOf("achternaam-overledene");
    const bsnOverledene = valueOf("bsn-overledene");
    const datumOverlijden = valueOf("datum-overlijden");

    if (voorlettersOverledene === "" || achternaamOverledene === "" || bsnOverledene === "" || datumOverlijden === "") {
        showDialog("Vul alle velden in voor vraag 1a");
        return;
    }

    if (!isValidBsn(bsnOverledene.trim())) {
        showDialog("Vul een geldig BSN in met precies 9 cijfers");
        setValue("bsn-overledene", "");
        return;
    }
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
});

byId("wel-voorwaarden").addEventListener("change", function() {
    setHidden("vraag-1b-2-voorwarden-kopie", false);
    setHidden("vraag-1b-3", false);
    setHidden("vraag-1b-4", false);
    setHidden("volgende-vraag-1b", false);
});

// Vraag 1b-4 - datum check
byId("datum-voorwaarden").addEventListener("blur", function() {
    const datumVoorwaarden = valueOf("datum-voorwaarden");
    const datumOverlijden = valueOf("datum-overlijden");
    if (datumVoorwaarden > datumOverlijden) {
        showDialog("De datum van de voorwaarden kan niet na de datum van overlijden liggen");
        setValue("datum-voorwaarden", "");
    }
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
        showDialog("Vul vraag 1b-1 in");
    } else if (vraag1b2Visible && voorwaardenValue === "") {
        showDialog("Vul vraag 1b-2 in");
    } else if (vraag1b2KopieVisible && kopieAktenValue === "") {
        showDialog("Vul vraag 1b-2-voorwaarden-kopie in");
    } else if (vraag1b3Visible && verrekenbedingValue === "") {
        showDialog("Vul vraag 1b-3 in");
    } else if (moetDatumVoorwaardenIngevuldZijn && datumVoorwaardenValue === "") {
        showDialog("Vul vraag 1b-4 in");
    } else {
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
        showDialog("Vul vraag 1c-1 in");
    } else if (vraag1c2Visible && overledenKinderenValue === "") {
        showDialog("Vul vraag 1c-2 in");
    } else if (vraag1c3Visible && overledenKindKinderenValue === "") {
        showDialog("Vul vraag 1c-3 in");
    } else {
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
});

byId("wel-testament").addEventListener("change", function() {
    setHidden("vraag-1d-2", false);
    setHidden("volgende-vraag-1d", true);
});

// Vraag 1d-2 - datum check
byId("datum-testament").addEventListener("blur", function() {
    const datumTestament = valueOf("datum-testament");
    const datumOverlijden = valueOf("datum-overlijden");
    if (datumTestament > datumOverlijden) {
        showDialog("De datum van het testament kan niet na de datum van overlijden liggen");
        setValue("datum-testament", "");
    }
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
        showDialog("Vul vraag 1d-1 in");
    } else if (vraag1d2Visible && (protocolnummerNotaris === "" || voorlettersNotaris === "" || tussenvoegselsNotaris === "" || achternaamNotaris === "" || vestigingsplaatsNotaris === "" || datumTestament === "")) {
        showDialog("Vul vraag 1d-2 in");
    } else {
        // document.getElementById("vraag-1d").hidden = true;
        // document.getElementById("vraag-1e").hidden = false;
        location.reload();
    }
});

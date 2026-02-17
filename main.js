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
document.getElementById("datum-overlijden").addEventListener("blur", function() {
    const datumOverlijden = document.getElementById("datum-overlijden").value;
    const vandaag = new Date().toISOString().split("T")[0];
    if (datumOverlijden > vandaag) {
        showDialog("De datum van overlijden kan niet in de toekomst liggen");
        document.getElementById("datum-overlijden").value = "";
    }
});

document.getElementById("bsn-overledene").addEventListener("blur", function() {
    const bsnOverledene = document.getElementById("bsn-overledene").value.trim();
    if (bsnOverledene !== "" && !isValidBsn(bsnOverledene)) {
        showDialog("Vul een geldig BSN in met precies 9 cijfers");
        document.getElementById("bsn-overledene").value = "";
    }
});

// Vraag 1a - volgende Check
document.getElementById("volgende-vraag-1a").addEventListener("click", function() {
    const voorlettersOverledene = document.getElementById("voorletters-overledene").value;
    const achternaamOverledene = document.getElementById("achternaam-overledene").value;
    const bsnOverledene = document.getElementById("bsn-overledene").value;
    const datumOverlijden = document.getElementById("datum-overlijden").value;

    if (voorlettersOverledene === "" || achternaamOverledene === "" || bsnOverledene === "" || datumOverlijden === "") {
        showDialog("Vul alle velden in voor vraag 1a");
        return;
    }

    if (!isValidBsn(bsnOverledene.trim())) {
        showDialog("Vul een geldig BSN in met precies 9 cijfers");
        document.getElementById("bsn-overledene").value = "";
        return;
    }
    document.getElementById("vraag-1a").hidden = true;
    document.getElementById("vraag-1b").hidden = false;
});

// Vraag 1b
// Vraag 1b-1
document.getElementById("niet-getrouwd").addEventListener("change", function() {
    document.getElementById("volgende-vraag-1b").hidden = false;
    document.getElementById("vraag-1b-2").hidden = true;
    const voorwaardenSelected = document.querySelector("input[name=\"voorwaarden\"]:checked");
    if (voorwaardenSelected) {
        voorwaardenSelected.checked = false;
    }
    document.getElementById("vraag-1b-2-voorwarden-kopie").hidden = true;
    document.querySelector("input[name=\"kopie-akte\"]").value = "";
    document.getElementById("vraag-1b-3").hidden = true;
    const verrekenbedingSelected = document.querySelector("input[name=\"verrekenbeding\"]:checked");
    if (verrekenbedingSelected) {
        verrekenbedingSelected.checked = false;
    }
    document.getElementById("vraag-1b-4").hidden = true;
    document.getElementById("datum-voorwaarden").value = "";
});

document.getElementById("getrouwd").addEventListener("change", function() {
    document.getElementById("vraag-1b-2").hidden = false;
    document.getElementById("volgende-vraag-1b").hidden = true;
});

// Vraag 1b-2
document.getElementById("geen-voorwaarden").addEventListener("change", function() {
    document.getElementById("volgende-vraag-1b").hidden = false;
    document.getElementById("vraag-1b-2-voorwarden-kopie").hidden = true;
    document.querySelector("input[name=\"kopie-akte\"]").value = "";
    document.getElementById("vraag-1b-3").hidden = true;
    if (document.querySelector("input[name=\"verrekenbeding\"]:checked")) {
        document.querySelector("input[name=\"verrekenbeding\"]:checked").checked = false;
    }
    document.getElementById("vraag-1b-4").hidden = true;
    document.getElementById("datum-voorwaarden").value = "";
});

document.getElementById("wel-voorwaarden").addEventListener("change", function() {
    document.getElementById("vraag-1b-2-voorwarden-kopie").hidden = false;
    document.getElementById("vraag-1b-3").hidden = false;
    document.getElementById("vraag-1b-4").hidden = false;
    document.getElementById("volgende-vraag-1b").hidden = false;
});

// Vraag 1b-4 - datum check
document.getElementById("datum-voorwaarden").addEventListener("blur", function() {
    const datumVoorwaarden = document.getElementById("datum-voorwaarden").value;
    const datumOverlijden = document.getElementById("datum-overlijden").value;
    if (datumVoorwaarden > datumOverlijden) {
        showDialog("De datum van de voorwaarden kan niet na de datum van overlijden liggen");
        document.getElementById("datum-voorwaarden").value = "";
    }
});

// Vraag 1b - Volgende check
document.getElementById("volgende-vraag-1b").addEventListener("click", function() {
    const vraag1b1Visible = document.getElementById("vraag-1b-1").hidden == false;
    const vraag1b2Visible = document.getElementById("vraag-1b-2").hidden == false;
    const vraag1b2KopieVisible = document.getElementById("vraag-1b-2-voorwarden-kopie").hidden == false;
    const vraag1b3Visible = document.getElementById("vraag-1b-3").hidden == false;
    const vraag1b4Visible = document.getElementById("vraag-1b-4").hidden == false;

    const huwelijkValue = document.querySelector("input[name=\"huwelijk\"]:checked")?.value || "";
    const voorwaardenValue = document.querySelector("input[name=\"voorwaarden\"]:checked")?.value || "";
    const kopieAktenValue = document.getElementById("kopie-akte").value;
    const verrekenbedingValue = document.querySelector("input[name=\"verrekenbeding\"]:checked")?.value || "";
    const datumVoorwaardenValue = document.getElementById("datum-voorwaarden").value;

    if (vraag1b1Visible && huwelijkValue === "") {
        showDialog("Vul vraag 1b-1 in");
    } else if (vraag1b2Visible && voorwaardenValue === "") {
        showDialog("Vul vraag 1b-2 in");
    } else if (vraag1b2KopieVisible && kopieAktenValue === "") {
        showDialog("Vul vraag 1b-2-voorwaarden-kopie in");
    } else if (vraag1b3Visible && verrekenbedingValue === "") {
        showDialog("Vul vraag 1b-3 in");
    } else if (vraag1b4Visible && datumVoorwaardenValue === "") {
        showDialog("Vul vraag 1b-4 in");
    } else {
        document.getElementById("vraag-1b").hidden = true;
        document.getElementById("vraag-1c").hidden = false;
    }
});

// Vraag 1c
// Vraag 1c-1
document.getElementById("geen-kinderen").addEventListener("change", function() {
    document.getElementById("volgende-vraag-1c").hidden = false;
    document.getElementById("vraag-1c-2").hidden = true;
    if (document.querySelector("input[name=\"overleden-kinderen\"]:checked")) {
        document.querySelector("input[name=\"overleden-kinderen\"]:checked").checked = false;
    }
    document.getElementById("vraag-1c-3").hidden = true;
    if (document.querySelector("input[name=\"kinderen-overleden-kind\"]:checked")) {
        document.querySelector("input[name=\"kinderen-overleden-kind\"]:checked").checked = false;
    }
});

document.getElementById("wel-kinderen").addEventListener("change", function() {
    document.getElementById("vraag-1c-2").hidden = false;
    document.getElementById("volgende-vraag-1c").hidden = true;
});

// Vraag 1c-2
document.getElementById("geen-overleden-kinderen").addEventListener("change", function() {
    document.getElementById("volgende-vraag-1c").hidden = false;
    document.getElementById("vraag-1c-3").hidden = true;
    if (document.querySelector("input[name=\"kinderen-overleden-kind\"]:checked")) {
        document.querySelector("input[name=\"kinderen-overleden-kind\"]:checked").checked = false;
    }
});

document.getElementById("wel-overleden-kinderen").addEventListener("change", function() {
    document.getElementById("vraag-1c-3").hidden = false;
    document.getElementById("volgende-vraag-1c").hidden = false;
});

// Vraag 1c - Volgende check
document.getElementById("volgende-vraag-1c").addEventListener("click", function() {
    const vraag1c1Visible = document.getElementById("vraag-1c-1").hidden == false;
    const vraag1c2Visible = document.getElementById("vraag-1c-2").hidden == false;
    const vraag1c3Visible = document.getElementById("vraag-1c-3").hidden == false;

    const kinderenValue = document.querySelector("input[name=\"kinderen\"]:checked")?.value || "";
    const overledenKinderenValue = document.querySelector("input[name=\"overleden-kinderen\"]:checked")?.value || "";
    const overledenKindKinderenValue = document.querySelector("input[name=\"kinderen-overleden-kind\"]:checked")?.value || "";

    if (vraag1c1Visible && kinderenValue === "") {
        showDialog("Vul vraag 1c-1 in");
    } else if (vraag1c2Visible && overledenKinderenValue === "") {
        showDialog("Vul vraag 1c-2 in");
    } else if (vraag1c3Visible && overledenKindKinderenValue === "") {
        showDialog("Vul vraag 1c-3 in");
    } else {
        document.getElementById("vraag-1c").hidden = true;
        document.getElementById("vraag-1d").hidden = false;
    }
});

// Vraag 1d
// Vraag 1d-1
document.getElementById("geen-testament").addEventListener("change", function() {
    document.getElementById("volgende-vraag-1d").hidden = false;
    document.getElementById("vraag-1d-2").hidden = true;
    document.getElementById("protocalnummer-notaris").value = "";
    document.getElementById("voorletters-notaris").value = "";
    document.getElementById("achternaam-notaris").value = "";
    document.getElementById("vestigingsplaats-notaris").value = "";
    document.getElementById("datum-testament").value = "";
});

document.getElementById("wel-testament").addEventListener("change", function() {
    document.getElementById("vraag-1d-2").hidden = false;
    document.getElementById("volgende-vraag-1d").hidden = true;
});

// Vraag 1d-2 - datum check
document.getElementById("datum-testament").addEventListener("blur", function() {
    const datumTestament = document.getElementById("datum-testament").value;
    const datumOverlijden = document.getElementById("datum-overlijden").value;
    if (datumTestament > datumOverlijden) {
        showDialog("De datum van het testament kan niet na de datum van overlijden liggen");
        document.getElementById("datum-testament").value = "";
    }
});

// Vraag 1d - Volgende check
document.getElementById("volgende-vraag-1d").addEventListener("click", function() {
    const vraag1d1Visible = document.getElementById("vraag-1d-1").hidden == false;
    const vraag1d2Visible = document.getElementById("vraag-1d-2").hidden == false;

    const testamentValue = document.querySelector("input[name=\"testament\"]:checked")?.value || "";
    const protocalnummerNotaris = document.getElementById("protocalnummer-notaris").value;
    const voorlettersNotaris = document.getElementById("voorletters-notaris").value;
    const achternaamNotaris = document.getElementById("achternaam-notaris").value;
    const vestigingsplaatsNotaris = document.getElementById("vestigingsplaats-notaris").value;
    const datumTestament = document.getElementById("datum-testament").value;
    if (vraag1d1Visible && testamentValue === "") {
        showDialog("Vul vraag 1d-1 in");
    } else if (vraag1d2Visible && (protocalnummerNotaris === "" || voorlettersNotaris === "" || achternaamNotaris === "" || vestigingsplaatsNotaris === "" || datumTestament === "")) {
        showDialog("Vul vraag 1d-2 in");
    } else {
        // document.getElementById("vraag-1d").hidden = true;
        // document.getElementById("vraag-1e").hidden = false;
        location.reload();
    }
});

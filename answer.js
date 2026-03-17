// Theme toggle — zelfde logica als main.js
const themeKey = "erfbelasting-theme";
const savedTheme = localStorage.getItem(themeKey);
if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.setAttribute("data-theme", "dark");
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        const current = document.documentElement.getAttribute("data-theme");
        btn.setAttribute("data-theme-active", current || "light");
        btn.addEventListener("click", () => {
            const now = document.documentElement.getAttribute("data-theme");
            const next = now === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem(themeKey, next);
            btn.setAttribute("data-theme-active", next);
        });
    }
});

const answersList = document.getElementById("answers-list");
const emptyState = document.getElementById("empty-state");

const storedAnswers = localStorage.getItem("answers");
const answers = storedAnswers ? JSON.parse(storedAnswers) : [];

if (!answers.length) {
	emptyState.hidden = false;
} else {
	answers.forEach(({ label, value }) => {
		const term = document.createElement("dt");
		term.textContent = label;

		const description = document.createElement("dd");
		description.textContent = value;

		answersList.append(term, description);
	});
}
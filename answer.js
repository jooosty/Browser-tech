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

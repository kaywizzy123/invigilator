// Each student sees the questions, and each question's options, in their own shuffled order.
// The order is saved with their attempt as its "layout".

// A fair shuffle (the Fisher–Yates shuffle): walk backwards through a copy of the list,
// swapping each item with a random one at or before it.
function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The option numbers in their original order: [0, 1, 2, ...].
function optionNumbers(question) {
  return question.options.map((option, index) => index);
}

// A new random order for one student: the question ids in shuffled order, and for each
// question, its option numbers in shuffled order. True/False keeps True first.
export function randomLayout(exam) {
  return {
    questions: shuffled(exam.questions.map((question) => question.id)),
    options: Object.fromEntries(
      exam.questions.map((question) => [
        question.id,
        question.type === "truefalse" ? optionNumbers(question) : shuffled(optionNumbers(question)),
      ]),
    ),
  };
}

// The exam's questions in this student's order. Each option keeps its original number
// as `index`, so answers, marking and results never depend on where it was shown.
// Attempts from before shuffling existed have no layout and keep the original order.
export function inStudentOrder(exam, layout) {
  const order = layout?.questions ?? exam.questions.map((question) => question.id);
  return order.map((questionId) => {
    const question = exam.questions.find((item) => item.id === questionId);
    // A saved order only fits if the question still has the same number of options.
    const saved = layout?.options[questionId];
    const optionOrder = saved?.length === question.options.length ? saved : optionNumbers(question);
    return {
      ...question,
      options: optionOrder.map((index) => ({ index, text: question.options[index] })),
    };
  });
}

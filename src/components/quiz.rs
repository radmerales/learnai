use std::collections::HashMap;

use dioxus::prelude::*;

use crate::domain::document::QuizQuestion;
use crate::domain::quiz::{
    MIN_QUIZ_OPTIONS, add_option, delete_option, new_question, update_option,
};

#[component]
pub fn QuizPanel(
    questions: Vec<QuizQuestion>,
    on_change: EventHandler<Vec<QuizQuestion>>,
) -> Element {
    let mut editing = use_signal(|| questions.is_empty());
    let mut answers = use_signal(HashMap::<String, usize>::new);
    let answered = !answers.read().is_empty();
    let questions_for_add = questions.clone();

    let add_question = move |_| {
        let mut next = questions_for_add.clone();
        next.push(new_question());
        editing.set(true);
        on_change.call(next);
    };

    rsx! {
        div { class: "h-full overflow-y-auto px-3 py-3",
            if questions.is_empty() {
                button {
                    r#type: "button",
                    class: "flex w-full items-center justify-center gap-2 border border-hairline px-3 py-3 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:border-ink hover:text-ink",
                    onclick: add_question,
                    "+ Click here to add a new question"
                }
            } else {
                div { class: "flex items-baseline justify-between gap-3 px-2 pb-3",
                    div {
                        p { class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink", "Multiple choice" }
                        p { class: "mt-1 text-sm text-[#3f3e3e]", "Pick one answer per question." }
                    }
                    div { class: "flex gap-3",
                        if answered {
                            button {
                                r#type: "button",
                                class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink underline underline-offset-4 hover:text-ink",
                                onclick: move |_| answers.set(HashMap::new()),
                                "Reset"
                            }
                        }
                        button {
                            r#type: "button",
                            class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink underline underline-offset-4 hover:text-ink",
                            onclick: move |_| editing.set(!editing()),
                            if editing() { "Practice" } else { "Edit" }
                        }
                    }
                }

                div { class: "space-y-2",
                    for (index, question) in questions.iter().enumerate() {
                        {
                            let question = question.clone();
                            let answer = answers().get(&question.id).copied();
                            rsx! {
                                if editing() {
                                    div { key: "{question.id}", class: "border border-ink bg-paper p-3",
                                        div { class: "flex items-center justify-between gap-2",
                                            p { class: "font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink",
                                                "Question {index + 1}"
                                            }
                                            {
                                                let delete_questions = questions.clone();
                                                let delete_id = question.id.clone();
                                                rsx! {
                                                    button {
                                                        r#type: "button",
                                                        class: "border border-red-700 bg-red-600 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white hover:bg-red-700",
                                                        onclick: move |_| {
                                                            let mut updated = delete_questions.clone();
                                                            updated.retain(|item| item.id != delete_id);
                                                            on_change.call(updated);
                                                        },
                                                        "Delete"
                                                    }
                                                }
                                            }
                                        }
                                        {
                                            let prompt_questions = questions.clone();
                                            let prompt_id = question.id.clone();
                                            rsx! {
                                                textarea {
                                                    class: "mt-2 w-full resize-y border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:border-ink",
                                                    "aria-label": "Question",
                                                    rows: 2,
                                                    value: "{question.prompt}",
                                                    oninput: move |event| {
                                                        let mut updated = prompt_questions.clone();
                                                        if let Some(item) = updated.iter_mut().find(|item| item.id == prompt_id) {
                                                            item.prompt = event.value();
                                                        }
                                                        on_change.call(updated);
                                                    },
                                                }
                                            }
                                        }
                                        div { class: "mt-3 space-y-2",
                                            for (option_index, option) in question.options.iter().enumerate() {
                                                {
                                                    let option = option.clone();
                                                    let correct = question.answer_index == option_index;
                                                    let radio_questions = questions.clone();
                                                    let radio_id = question.id.clone();
                                                    let input_questions = questions.clone();
                                                    let input_id = question.id.clone();
                                                    let delete_questions = questions.clone();
                                                    let delete_id = question.id.clone();
                                                    rsx! {
                                                        div { key: "{option_index}", class: "flex items-center gap-2",
                                                            input {
                                                                r#type: "radio",
                                                                name: "correct-{question.id}",
                                                                checked: correct,
                                                                onchange: move |_| {
                                                                    let mut updated = radio_questions.clone();
                                                                    if let Some(item) = updated.iter_mut().find(|item| item.id == radio_id) {
                                                                        item.answer_index = option_index;
                                                                    }
                                                                    on_change.call(updated);
                                                                },
                                                            }
                                                            input {
                                                                r#type: "text",
                                                                class: "w-full border border-hairline bg-surface px-2.5 py-1.5 text-sm text-ink outline-none focus-visible:border-ink",
                                                                value: "{option}",
                                                                placeholder: "Option {option_index + 1}",
                                                                oninput: move |event| {
                                                                    let mut updated = input_questions.clone();
                                                                    if let Some(item) = updated.iter_mut().find(|item| item.id == input_id) {
                                                                        *item = update_option(item, option_index, event.value());
                                                                    }
                                                                    on_change.call(updated);
                                                                },
                                                            }
                                                            button {
                                                                r#type: "button",
                                                                class: "shrink-0 border border-hairline px-1.5 py-1 text-mutedink hover:border-red-700 hover:text-red-700 disabled:opacity-40",
                                                                disabled: question.options.len() <= MIN_QUIZ_OPTIONS,
                                                                onclick: move |_| {
                                                                    let mut updated = delete_questions.clone();
                                                                    if let Some(item) = updated.iter_mut().find(|item| item.id == delete_id) {
                                                                        *item = delete_option(item, option_index);
                                                                    }
                                                                    on_change.call(updated);
                                                                },
                                                                "×"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            {
                                                let add_questions = questions.clone();
                                                let add_id = question.id.clone();
                                                rsx! {
                                                    button {
                                                        r#type: "button",
                                                        class: "border border-hairline bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink hover:bg-surface hover:text-ink",
                                                        onclick: move |_| {
                                                            let mut updated = add_questions.clone();
                                                            if let Some(item) = updated.iter_mut().find(|item| item.id == add_id) {
                                                                *item = add_option(item);
                                                            }
                                                            on_change.call(updated);
                                                        },
                                                        "+ Add answer"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    div { key: "{question.id}", class: "px-3 py-2",
                                        p { class: "text-sm font-medium leading-5 text-ink",
                                            span { class: "mr-2 font-mono text-xs text-mutedink", "{index + 1}." }
                                            "{question.prompt}"
                                        }
                                        div { class: "mt-3 space-y-2",
                                            for (option_index, option) in question.options.iter().enumerate() {
                                                {
                                                    let option = option.clone();
                                                    let qid = question.id.clone();
                                                    let correct = answer == Some(option_index) && option_index == question.answer_index;
                                                    let wrong = answer == Some(option_index) && option_index != question.answer_index;
                                                    let tone = if correct {
                                                        "border-ink bg-accent text-accentink"
                                                    } else if wrong {
                                                        "border-red-700 bg-red-600 text-white"
                                                    } else {
                                                        "border-hairline bg-paper text-ink hover:bg-surface"
                                                    };
                                                    rsx! {
                                                        button {
                                                            key: "{option_index}",
                                                            r#type: "button",
                                                            class: "w-full border px-3 py-2 text-left text-sm leading-5 {tone}",
                                                            disabled: answer.is_some(),
                                                            onclick: move |_| {
                                                                answers.write().insert(qid.clone(), option_index);
                                                            },
                                                            "{option}"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        if let Some(selected) = answer {
                                            p { class: "mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink",
                                                if selected == question.answer_index { "Correct" } else { "Incorrect" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                div { class: "group mt-2 border border-transparent hover:border-hairline",
                    button {
                        r#type: "button",
                        class: "flex h-10 w-full items-center justify-center px-3 font-mono text-[10px] uppercase tracking-[0.08em] text-mutedink opacity-0 hover:text-ink focus-visible:opacity-100 group-hover:opacity-100",
                        onclick: add_question,
                        "+ Add question"
                    }
                }
            }
        }
    }
}

use std::collections::HashMap;

use dioxus::html::{Key, ModifiersInteraction};
use dioxus::prelude::*;

use crate::domain::document::QuizQuestion;
use crate::domain::quiz::{
    MIN_QUIZ_OPTIONS, add_option, delete_option, finalize_question, new_question, update_option,
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
    let questions_for_finish = questions.clone();

    let add_question = move |_| {
        let mut next = questions_for_add.clone();
        next.push(new_question());
        editing.set(true);
        on_change.call(next);
    };

    // Leaving edit mode saves the current draft and removes blank choices.
    let finish_editing = use_callback(move |_: ()| {
        editing.set(false);
        on_change.call(questions_for_finish.iter().map(finalize_question).collect());
    });

    rsx! {
        div { class: "scroll-panel",
            if questions.is_empty() {
                button {
                    r#type: "button",
                    class: "add-empty",
                    onclick: add_question,
                    "+ Click here to add a new question"
                }
            } else {
                div { class: "quiz-toolbar",
                    div {
                        p { class: "eyebrow", "Multiple choice" }
                        p { class: "quiz-subtitle", "Pick one answer per question." }
                    }
                    div { class: "quiz-actions",
                        if answered {
                            button {
                                r#type: "button",
                                class: "text-button",
                                onclick: move |_| answers.set(HashMap::new()),
                                "Reset"
                            }
                        }
                        if editing() {
                            button {
                                r#type: "button",
                                class: "text-button",
                                onclick: move |_| finish_editing.call(()),
                                "Practice"
                            }
                        } else {
                            button {
                                r#type: "button",
                                class: "text-button",
                                onclick: move |_| editing.set(true),
                                "Edit"
                            }
                        }
                    }
                }

                div { class: "stack-sm",
                    for (index, question) in questions.iter().enumerate() {
                        {
                            let question = question.clone();
                            let answer = answers().get(&question.id).copied();
                            let can_finish = question
                                .options
                                .iter()
                                .filter(|option| !option.trim().is_empty())
                                .count()
                                >= MIN_QUIZ_OPTIONS;
                            rsx! {
                                if editing() {
                                    div { key: "{question.id}", class: "question-editor",
                                        div { class: "question-editor-head",
                                            p { class: "eyebrow question-editor-title",
                                                "Question {index + 1}"
                                            }
                                            {
                                                let delete_questions = questions.clone();
                                                let delete_id = question.id.clone();
                                                rsx! {
                                                    div { class: "block-actions",
                                                        button {
                                                            r#type: "button",
                                                            class: "button-small",
                                                            disabled: !can_finish,
                                                            title: if can_finish { "" } else { "Add at least two answer choices" },
                                                            onclick: move |_| finish_editing.call(()),
                                                            "Done"
                                                        }
                                                        button {
                                                            r#type: "button",
                                                            class: "button-danger-small",
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
                                        }
                                        {
                                            let prompt_questions = questions.clone();
                                            let prompt_id = question.id.clone();
                                            rsx! {
                                                textarea {
                                                    class: "question-prompt",
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
                                                    onkeydown: move |event| {
                                                        if event.key() == Key::Enter
                                                            && (event.modifiers().ctrl() || event.modifiers().meta())
                                                        {
                                                            event.prevent_default();
                                                            if can_finish {
                                                                finish_editing.call(());
                                                            }
                                                        }
                                                    },
                                                }
                                            }
                                        }
                                        div { class: "option-list",
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
                                                        div { key: "{option_index}", class: "option-edit-row",
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
                                                                class: "option-input",
                                                                value: "{option}",
                                                                placeholder: "Option {option_index + 1}",
                                                                oninput: move |event| {
                                                                    let mut updated = input_questions.clone();
                                                                    if let Some(item) = updated.iter_mut().find(|item| item.id == input_id) {
                                                                        *item = update_option(item, option_index, event.value());
                                                                    }
                                                                    on_change.call(updated);
                                                                },
                                                                onkeydown: move |event| {
                                                                    if event.key() == Key::Enter
                                                                        && (event.modifiers().ctrl() || event.modifiers().meta())
                                                                    {
                                                                        event.prevent_default();
                                                                        if can_finish {
                                                                            finish_editing.call(());
                                                                        }
                                                                    }
                                                                },
                                                            }
                                                            button {
                                                                r#type: "button",
                                                                class: "remove-option",
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
                                                        class: "button-small add-answer",
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
                                    div { key: "{question.id}", class: "practice-question",
                                        p { class: "practice-prompt",
                                            span { class: "question-number", "{index + 1}." }
                                            "{question.prompt}"
                                        }
                                        div { class: "practice-options",
                                            for (option_index, option) in question.options.iter().enumerate() {
                                                {
                                                    let option = option.clone();
                                                    let qid = question.id.clone();
                                                    let correct = answer == Some(option_index) && option_index == question.answer_index;
                                                    let wrong = answer == Some(option_index) && option_index != question.answer_index;
                                                    let tone = if correct {
                                                        "quiz-option is-correct"
                                                    } else if wrong {
                                                        "quiz-option is-wrong"
                                                    } else {
                                                        "quiz-option"
                                                    };
                                                    rsx! {
                                                        button {
                                                            key: "{option_index}",
                                                            r#type: "button",
                                                            class: "{tone}",
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
                                            p { class: "feedback",
                                                if selected == question.answer_index { "Correct" } else { "Incorrect" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                div { class: "add-row",
                    button {
                        r#type: "button",
                        class: "add-row-button",
                        onclick: add_question,
                        "+ Add question"
                    }
                }
            }
        }
    }
}

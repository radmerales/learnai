use std::cell::RefCell;

use katex::{KatexContext, Settings};
use pulldown_cmark::{Options, Parser, html};

thread_local! {
    static KATEX: RefCell<KatexContext> = RefCell::new(KatexContext::default());
}

/// Render Learn markdown to safe HTML, with KaTeX-compatible math support.
pub fn render_markdown(content: &str) -> String {
    let (prepared, math) = extract_math(content);

    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_FOOTNOTES);

    let parser = Parser::new_ext(&prepared, options);
    let mut rendered = String::new();
    html::push_html(&mut rendered, parser);

    let mut sanitizer = ammonia::Builder::default();
    sanitizer.add_tags(["input"]);
    sanitizer.add_tag_attributes("input", ["type", "checked", "disabled"]);
    sanitizer.add_generic_attributes(["class"]);
    let mut html = sanitizer.clean(&rendered).to_string();

    for (token, formula, display) in math {
        html = html.replace(&token, &render_math(&formula, display));
    }
    html
}

fn render_math(formula: &str, display: bool) -> String {
    let settings = Settings {
        display_mode: display,
        throw_on_error: false,
        ..Settings::default()
    };
    KATEX.with(|context| {
        let context = context.borrow();
        katex::render_to_string(&context, formula, &settings)
            .unwrap_or_else(|_| format!("<code>{}</code>", escape_html(formula)))
    })
}

#[allow(clippy::collapsible_if)]
fn extract_math(content: &str) -> (String, Vec<(String, String, bool)>) {
    let mut prepared = String::with_capacity(content.len());
    let mut math = Vec::new();
    let mut index = 0;

    while index < content.len() {
        let rest = &content[index..];
        if let Some(body) = rest.strip_prefix("$$") {
            if let Some(end) = body.find("$$") {
                let formula = body[..end].trim();
                let token = format!("LEARNAIMATHTOKEN{}", math.len());
                prepared.push_str(&token);
                math.push((token, formula.to_string(), true));
                index += 2 + end + 2;
                continue;
            }
        } else if let Some(body) = rest.strip_prefix('$') {
            if let Some(end) = body.find('$') {
                let formula = &body[..end];
                if !formula.contains('\n') {
                    let token = format!("LEARNAIMATHTOKEN{}", math.len());
                    prepared.push_str(&token);
                    math.push((token, formula.trim().to_string(), false));
                    index += 1 + end + 1;
                    continue;
                }
            }
        }

        let ch = rest.chars().next().unwrap();
        prepared.push(ch);
        index += ch.len_utf8();
    }

    (prepared, math)
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

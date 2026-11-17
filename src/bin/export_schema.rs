#[path = "../domain/mod.rs"]
mod domain;

fn main() {
    print!("{}", domain::schema::render_schema());
}

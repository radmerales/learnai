// This small tool includes the whole domain module for its schema types, so
// most validation/geometry helpers are intentionally unused here.
#![allow(dead_code)]

#[path = "../domain/mod.rs"]
mod domain;

fn main() {
    print!("{}", domain::schema::render_schema());
}

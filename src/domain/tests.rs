use crate::domain::document::{
    LearnContent, MindmapDocument, MindmapLink, MindmapNode, NoteStatus, QuizContent, QuizQuestion,
    Side,
};
use crate::domain::geometry::{
    Point, connect_target, edge_target, find_connect_candidate, hit_test_node, nodes_in_rect,
    opposite_side, render_edges, side_from_vector, side_point,
};
use crate::domain::quiz::{
    delete_option, finalize_question, new_node, next_node_number, update_option,
};
use crate::domain::schema::render_schema;
use crate::domain::validation::{normalize_title, validate_document};

fn node(id: &str, x: f64, y: f64) -> MindmapNode {
    MindmapNode {
        id: id.to_string(),
        label: id.to_string(),
        status: NoteStatus::Todo,
        x,
        y,
        width: 140.0,
        learn: LearnContent {
            blocks: vec![String::new()],
        },
        quiz: QuizContent {
            questions: Vec::new(),
        },
    }
}

fn link(id: &str, from: &str, to: &str) -> MindmapLink {
    MindmapLink {
        id: id.to_string(),
        from_node: from.to_string(),
        to: to.to_string(),
        from_side: Side::Right,
        to_side: Side::Left,
    }
}

#[test]
fn validates_a_consistent_document() {
    let document = MindmapDocument {
        schema_version: 1,
        title: "Biology".to_string(),
        nodes: vec![node("a", 100.0, 100.0), node("b", 300.0, 100.0)],
        links: vec![link("l1", "a", "b")],
    };

    assert!(validate_document(&document).is_ok());
}

#[test]
fn rejects_graph_integrity_errors() {
    let mut document = MindmapDocument {
        schema_version: 1,
        title: "Biology".to_string(),
        nodes: vec![node("a", 100.0, 100.0)],
        links: vec![link("l1", "a", "missing")],
    };
    assert!(validate_document(&document).is_err());

    document.links.clear();
    document.nodes.push(node("a", 200.0, 200.0));
    assert!(validate_document(&document).is_err());

    document.nodes.pop();
    document.nodes[0].quiz.questions.push(QuizQuestion {
        id: "q1".to_string(),
        prompt: "Where?".to_string(),
        options: vec!["A".to_string(), "B".to_string()],
        answer_index: 2,
    });
    assert!(validate_document(&document).is_err());
}

#[test]
fn normalizes_blank_titles_and_creates_nodes() {
    assert_eq!(normalize_title("   "), "Untitled mindmap");
    assert_eq!(normalize_title("  Biology  "), "Biology");

    let node = new_node(10.0, 20.0, "Node 4".to_string());
    assert_eq!(node.label, "Node 4");
    assert_eq!(node.learn.blocks.len(), 1);
    assert_eq!(next_node_number(&[node]), 5);
}

#[test]
fn computes_geometry_and_edges() {
    let left = node("a", 100.0, 100.0);
    let right = node("b", 300.0, 100.0);

    assert_eq!(side_point(&left, &Side::Right), Point::new(180.0, 100.0));
    assert_eq!(opposite_side(&Side::Right), Side::Left);
    assert_eq!(
        hit_test_node(&[left.clone(), right.clone()], Point::new(300.0, 100.0)),
        Some(1)
    );

    let rendered = render_edges(&[left, right], &[link("l1", "a", "b")]);
    assert_eq!(rendered.len(), 1);
    assert!(rendered[0].path.starts_with("M "));
    assert_eq!(side_from_vector(10.0, -2.0), Side::Right);
    assert_eq!(side_from_vector(1.0, 9.0), Side::Bottom);
    assert_eq!(
        nodes_in_rect(
            &[node("a", 100.0, 100.0), node("b", 300.0, 100.0)],
            Point::new(0.0, 0.0),
            Point::new(200.0, 200.0),
        ),
        vec!["a".to_string()]
    );
}

#[test]
fn snaps_connections_to_side_anchors() {
    let a = node("a", 100.0, 100.0);
    let b = node("b", 300.0, 100.0);
    let nodes = vec![a, b];
    let right_anchor = side_point(&nodes[1], &Side::Right);

    assert_eq!(
        find_connect_candidate(&nodes, right_anchor),
        Some(("b".to_string(), Side::Right))
    );
    // Just outside the 36px halo, so the pointer is empty canvas.
    assert_eq!(
        find_connect_candidate(&nodes, Point::new(right_anchor.x + 40.0, right_anchor.y)),
        None
    );
    assert_eq!(
        connect_target(&nodes, &[], right_anchor, "a"),
        Some(("b".to_string(), Side::Right))
    );
    // The source is never a valid target.
    assert_eq!(connect_target(&nodes, &[], right_anchor, "b"), None);
    // Nor is a pair that already has an edge.
    assert_eq!(
        connect_target(&nodes, &[link("l1", "a", "b")], right_anchor, "a"),
        None
    );
}

#[test]
fn resolves_valid_edge_rewire_targets() {
    let a = node("a", 100.0, 100.0);
    let b = node("b", 300.0, 100.0);
    let c = node("c", 500.0, 100.0);
    let nodes = vec![a, b, c];
    let links = vec![link("l1", "a", "b")];

    // Moving the "from" end leaves "b" fixed; the pointer is over "c".
    assert_eq!(
        edge_target(&nodes, &links, "l1", "b", Point::new(500.0, 100.0)),
        Some(("c".to_string(), Side::Right))
    );
    // Near the left anchor, outside the node rectangle, snaps to that side.
    assert_eq!(
        edge_target(
            &nodes,
            &links,
            "l1",
            "b",
            side_point(&nodes[2], &Side::Left)
        ),
        Some(("c".to_string(), Side::Left))
    );
    // The fixed end and the other end are not valid targets.
    assert_eq!(
        edge_target(&nodes, &links, "l1", "b", Point::new(300.0, 100.0)),
        None
    );
    assert_eq!(
        edge_target(&nodes, &links, "l1", "b", Point::new(100.0, 100.0)),
        None
    );
    // Empty canvas has no target.
    assert_eq!(
        edge_target(&nodes, &links, "l1", "b", Point::new(900.0, 900.0)),
        None
    );
}

#[test]
fn adjusts_quiz_options() {
    let question = QuizQuestion {
        id: "q1".to_string(),
        prompt: "Where?".to_string(),
        options: vec!["A".to_string(), "B".to_string(), "C".to_string()],
        answer_index: 1,
    };

    let updated = update_option(&question, 0, "Cytosol");
    assert_eq!(updated.options[0], "Cytosol");

    let deleted = delete_option(&question, 0);
    assert_eq!(deleted.options, vec!["B", "C"]);
    assert_eq!(deleted.answer_index, 0);

    let finalized = finalize_question(&QuizQuestion {
        id: "q2".to_string(),
        prompt: "Where?".to_string(),
        options: vec![
            "Cytosol".to_string(),
            " ".to_string(),
            "Mitochondria".to_string(),
            String::new(),
        ],
        answer_index: 2,
    });
    assert_eq!(finalized.options, vec!["Cytosol", "Mitochondria"]);
    assert_eq!(finalized.answer_index, 1);

    let too_few = finalize_question(&QuizQuestion {
        id: "q3".to_string(),
        prompt: String::new(),
        options: vec!["Only one".to_string(), String::new()],
        answer_index: 0,
    });
    assert_eq!(too_few.options.len(), 2);
}

#[test]
fn generates_document_schema() {
    let schema = render_schema();
    assert!(schema.contains("Mindmap document (v1)"));
    assert!(schema.contains("schemaVersion"));
}

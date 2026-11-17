#[derive(Clone, Debug, Default)]
pub struct Selection {
    pub node_ids: Vec<String>,
    pub edge_ids: Vec<String>,
    pub panel_open: bool,
}

impl Selection {
    pub fn clear(&mut self) {
        self.node_ids.clear();
        self.edge_ids.clear();
        self.panel_open = false;
    }

    pub fn select_node(&mut self, id: String, additive: bool) {
        if additive {
            if !self.node_ids.contains(&id) {
                self.node_ids.push(id);
            }
            self.panel_open = false;
        } else {
            self.node_ids = vec![id];
            self.edge_ids.clear();
        }
    }

    pub fn focus_node(&mut self, id: String) {
        self.node_ids = vec![id];
        self.edge_ids.clear();
        self.panel_open = true;
    }

    pub fn select_edge(&mut self, id: String, additive: bool) {
        if additive {
            if !self.edge_ids.contains(&id) {
                self.edge_ids.push(id);
            }
            self.panel_open = false;
        } else {
            self.node_ids.clear();
            self.edge_ids = vec![id];
            self.panel_open = false;
        }
    }

    pub fn select_marquee(&mut self, node_ids: Vec<String>, edge_ids: Vec<String>, additive: bool) {
        if additive {
            for id in node_ids {
                if !self.node_ids.contains(&id) {
                    self.node_ids.push(id);
                }
            }
            for id in edge_ids {
                if !self.edge_ids.contains(&id) {
                    self.edge_ids.push(id);
                }
            }
        } else {
            self.node_ids = node_ids;
            self.edge_ids = edge_ids;
        }
        self.panel_open = false;
    }

    pub fn close_panel(&mut self) {
        self.panel_open = false;
    }

    pub fn single_node(&self) -> Option<&str> {
        if self.node_ids.len() == 1 {
            Some(&self.node_ids[0])
        } else {
            None
        }
    }
}

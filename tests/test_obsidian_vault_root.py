"""to_obsidian / to_canvas exported into a subfolder of a larger Obsidian vault
(``--vault-root``): one vault shared by several projects, each project's graph
under e.g. ``vault/graphify/<project>/``."""
import json
import re

import networkx as nx
import pytest

from graphify.export import to_canvas, to_obsidian


def _graph() -> tuple[nx.Graph, dict[int, list[str]]]:
    G = nx.Graph()
    G.add_node("a", label="config", file_type="code", source_file="a.py")
    G.add_node("b", label="main", file_type="code", source_file="b.py")
    G.add_node("c", label="utils", file_type="code", source_file="c.py")
    G.add_edge("a", "b", relation="calls", confidence="EXTRACTED")
    G.add_edge("b", "c", relation="imports", confidence="EXTRACTED")
    return G, {0: ["a", "b"], 1: ["c"]}


def _links(text: str) -> list[str]:
    return re.findall(r"\[\[([^\]]+)\]\]", text)


def test_wikilinks_are_path_qualified_and_resolve(tmp_path):
    vault = tmp_path / "vault"
    out = vault / "graphify" / "my-project"
    G, comms = _graph()
    to_obsidian(G, comms, str(out), community_labels={0: "Core", 1: "Helpers"},
                vault_root=str(vault))

    links = []
    for note in out.glob("*.md"):
        links += _links(note.read_text())
    assert links
    for link in links:
        target, _, alias = link.partition("|")
        assert target.startswith("graphify/my-project/")
        assert alias == target.rsplit("/", 1)[1]
        assert (vault / f"{target}.md").is_file(), target


def test_same_label_in_two_projects_links_stay_separate(tmp_path):
    vault = tmp_path / "vault"
    G, comms = _graph()
    for proj in ("proj-a", "proj-b"):
        to_obsidian(G, comms, str(vault / "graphify" / proj), vault_root=str(vault))
    main_a = (vault / "graphify" / "proj-a" / "main.md").read_text()
    assert "[[graphify/proj-a/config|config]]" in main_a
    assert "proj-b" not in main_a


def test_no_obsidian_config_written_in_subfolder(tmp_path):
    vault = tmp_path / "vault"
    out = vault / "graphify" / "my-project"
    G, comms = _graph()
    to_obsidian(G, comms, str(out), community_labels={0: "Core", 1: "Helpers"},
                vault_root=str(vault))
    assert not (out / ".obsidian").exists()


def test_previously_owned_obsidian_config_is_pruned(tmp_path):
    vault = tmp_path / "vault"
    out = vault / "graphify" / "my-project"
    G, comms = _graph()
    labels = {0: "Core", 1: "Helpers"}
    to_obsidian(G, comms, str(out), community_labels=labels)
    assert (out / ".obsidian" / "graph.json").is_file()
    to_obsidian(G, comms, str(out), community_labels=labels, vault_root=str(vault))
    assert not (out / ".obsidian" / "graph.json").exists()


def test_canvas_files_are_vault_relative(tmp_path):
    vault = tmp_path / "vault"
    out = vault / "graphify" / "my-project"
    G, comms = _graph()
    to_obsidian(G, comms, str(out), vault_root=str(vault))
    to_canvas(G, comms, str(out / "graph.canvas"), vault_root=str(vault))
    canvas = json.loads((out / "graph.canvas").read_text())
    files = [n["file"] for n in canvas["nodes"] if n.get("type") == "file"]
    assert files
    for f in files:
        assert f.startswith("graphify/my-project/")
        assert (vault / f).is_file(), f


def test_vault_root_equal_to_dir_keeps_plain_links(tmp_path):
    G, comms = _graph()
    to_obsidian(G, comms, str(tmp_path), vault_root=str(tmp_path))
    assert "[[config]]" in (tmp_path / "main.md").read_text()


def test_dir_outside_vault_root_raises(tmp_path):
    G, comms = _graph()
    with pytest.raises(ValueError, match="not inside vault root"):
        to_obsidian(G, comms, str(tmp_path / "elsewhere"),
                    vault_root=str(tmp_path / "vault"))


def test_wikilink_breaking_folder_name_raises(tmp_path):
    vault = tmp_path / "vault"
    G, comms = _graph()
    with pytest.raises(ValueError, match="breaks"):
        to_obsidian(G, comms, str(vault / "proj#1"), vault_root=str(vault))

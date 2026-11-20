"""Build the seventh-grade first-term graph from local Jyeoo book/point pairs."""
import json
import sys
from pathlib import Path


def read(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))["response"]


def tree_paths(nodes, parents=()):
    for node in nodes:
        yield str(node["No"]), parents
        yield from tree_paths(node.get("Children") or [], (*parents, node["Name"]))


def catalog(node, paths):
    points = {}
    for point in node.get("Points") or []:
        point_id = str(point["No"])
        points.setdefault(point_id, {
            "id": point_id,
            "name": point["Name"],
            "treePath": paths[point_id],
        })
    return {
        "id": node["ID"],
        "name": node["Name"],
        "children": [catalog(child, paths) for child in node.get("Children") or []],
        "points": list(points.values()),
    }


def main(source):
    output = Path(__file__).resolve().parents[1] / "data" / "learning-books" / "grade7-first-term"
    subjects = {}
    for book_file in sorted(source.rglob("*_book2_*.json")):
        code = book_file.name.split("_book2_")[0]
        if code.endswith("3"):
            continue
        point_files = sorted(book_file.parent.glob(f"{code}_point2_*.json"))
        if len(point_files) != 1 or code in subjects:
            raise ValueError(f"Expected one book and point file pair for {code}")
        paths = dict(tree_paths(read(point_files[0])))
        subjects[code] = [
            {
                "id": book["ID"], "name": book["Name"], "edition": book["EditionName"],
                "grade": book["GradeName"], "term": book["TermName"],
                "children": [catalog(child, paths) for child in book.get("Children") or []],
            }
            for book in read(book_file)
            if book["GradeID"] == 7 and book["TermID"] == 1
        ]
    if not subjects:
        raise ValueError("No Jyeoo book files found")
    output.mkdir(parents=True, exist_ok=True)
    for code, books in subjects.items():
        rows = [json.dumps(book, ensure_ascii=False, separators=(",", ":")) for book in books]
        (output / f"{code}.json").write_text("[\n" + ",\n".join(rows) + "\n]\n", encoding="utf-8")
        print(code, len(books))


if __name__ == "__main__":
    main(Path(sys.argv[1]))

"""
SuperFences formatters for DataDojo code blocks.
Extracts solutions to assets/solutions/<id>.json to prevent spoiling solutions.
"""

import os
import json
import html
import re

SOLUTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "assets", "solutions")

def parse_exercise_block(source):
    lines = source.strip().splitlines()
    metadata = {}
    sections = {}
    current_section = None
    section_lines = []

    for line in lines:
        if line.startswith("%%"):
            if current_section is not None:
                sections[current_section] = "\n".join(section_lines).strip()
            sec_name = line[2:].strip().lower()
            current_section = sec_name
            section_lines = []
        elif current_section is None:
            # Metadata line before first %%
            if ":" in line:
                key, val = line.split(":", 1)
                metadata[key.strip().lower()] = val.strip()
        else:
            section_lines.append(line)

    if current_section is not None:
        sections[current_section] = "\n".join(section_lines).strip()

    return metadata, sections

def fence_dojo_run(source, language, class_name, options, md, **kwargs):
    starter = source.strip()
    escaped_starter = html.escape(starter, quote=True)
    packages = options.get("packages", "") if options else ""
    return (
        f'<div class="dojo-cell" data-type="run" '
        f'data-starter="{escaped_starter}" '
        f'data-packages="{html.escape(packages, quote=True)}"></div>'
    )

def fence_dojo_exercise(source, language, class_name, options, md, **kwargs):
    metadata, sections = parse_exercise_block(source)
    exercise_id = metadata.get("id", "exercise")
    xp = metadata.get("xp", "10")

    starter = sections.get("starter", "")
    tests = sections.get("tests", "")
    solution = sections.get("solution", "")
    tips_raw = sections.get("tips", "")

    # Parse tips
    tips = []
    for line in tips_raw.splitlines():
        line = line.strip()
        if not line:
            continue
        # Strip "Tip 1:", "Tip 2:", etc. if present
        clean_tip = re.sub(r"^Tip\s*\d+:\s*", "", line, flags=re.IGNORECASE)
        tips.append(clean_tip)

    # Save solution to external JSON
    os.makedirs(SOLUTIONS_DIR, exist_ok=True)
    solution_file = os.path.join(SOLUTIONS_DIR, f"{exercise_id}.json")
    with open(solution_file, "w", encoding="utf-8") as f:
        json.dump({"id": exercise_id, "solution": solution}, f, indent=2)

    tip1 = tips[0] if len(tips) > 0 else ""
    tip2 = tips[1] if len(tips) > 1 else ""
    tip3 = tips[2] if len(tips) > 2 else ""

    return (
        f'<div class="dojo-cell" data-type="exercise" '
        f'data-id="{html.escape(exercise_id, quote=True)}" '
        f'data-xp="{html.escape(str(xp), quote=True)}" '
        f'data-starter="{html.escape(starter, quote=True)}" '
        f'data-tests="{html.escape(tests, quote=True)}" '
        f'data-tip1="{html.escape(tip1, quote=True)}" '
        f'data-tip2="{html.escape(tip2, quote=True)}" '
        f'data-tip3="{html.escape(tip3, quote=True)}"></div>'
    )

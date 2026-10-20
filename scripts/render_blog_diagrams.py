"""Regenerate the desktop and mobile editorial illustrations."""
from pathlib import Path
import json
from blog_artwork import render

ASSETS = Path(__file__).resolve().parents[1] / 'assets/blog-idi'

if __name__ == '__main__':
    data = json.loads((ASSETS / 'diagrams.json').read_text(encoding='utf-8'))
    for name, item in data.items():
        for mobile in (False, True):
            target = ASSETS / (name + ('-mobile' if mobile else '') + '.svg')
            target.write_text(render(name, item, mobile), encoding='utf-8')
    print(f'Rendered {len(data)} diagrams in desktop and mobile formats.')

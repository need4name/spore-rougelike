#!/usr/bin/env python3
"""Stamp a release number on every file that carries one: python3 tools/stamp.py 21.4

index.html (file addresses and the build check), the build stamp at the end of each script,
and the offline helper (sw.js), so phones fetch the new release instead of an old saved copy."""
import glob, os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
new = sys.argv[1]
changed = []
for f in [os.path.join(root, 'index.html'), os.path.join(root, 'sw.js')] + glob.glob(os.path.join(root, 'js', '*.js')) + glob.glob(os.path.join(root, 'js', 'data', '*.js')):
    t = open(f).read()
    n = re.sub(r'\?v=[0-9.]+', '?v=' + new, t)
    n = re.sub(r"var want = '[0-9.]+'", "var want = '%s'" % new, n)
    n = re.sub(r"(PRIMORDIA_FILES = window.PRIMORDIA_FILES \|\| \{\}\)\.\w+ = )'[0-9.]+'", r"\g<1>'%s'" % new, n)
    n = re.sub(r"^const VERSION = '[0-9.]+';", "const VERSION = '%s';" % new, n, flags=re.M)
    if n != t:
        open(f, 'w').write(n)
        changed.append(os.path.relpath(f, root))
print('Stamped', new, 'on', ', '.join(changed))

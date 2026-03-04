import re

with open('src/components/FormatEditor.tsx', 'r') as f:
    content = f.read()

# I see my previous replace had a bug where it matched the end incorrectly, or rather didn't remove the whole `return (` part.
# Let's cleanly replace the file instead of doing regex to avoid syntax errors.

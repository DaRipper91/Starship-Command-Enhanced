with open('src/components/FormatEditor.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { StyleEditor } from './StyleEditor'; // Reusing StyleEditor for segment styling\n", "")

with open('src/components/FormatEditor.tsx', 'w') as f:
    f.write(content)

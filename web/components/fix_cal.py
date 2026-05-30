path = 'dashboard-calendar-tab.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('Â·', '·')
content = content.replace('â€"', '—')
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('done:', path)

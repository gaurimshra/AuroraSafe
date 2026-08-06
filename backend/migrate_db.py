import sqlite3

conn = sqlite3.connect('aurorasafe.db')
c = conn.cursor()

c.execute('PRAGMA table_info(incidents)')
existing_cols = [row[1] for row in c.fetchall()]
print('Current columns:', existing_cols)

new_columns = [
    ('source', 'TEXT NOT NULL DEFAULT "user_report"'),
    ('news_url', 'TEXT'),
    ('expires_at', 'DATETIME')
]

for col, coldef in new_columns:
    if col not in existing_cols:
        sql = f'ALTER TABLE incidents ADD COLUMN {col} {coldef}'
        c.execute(sql)
        print(f'Added column: {col}')
    else:
        print(f'Column already exists: {col}')

conn.commit()
conn.close()
print('DB migration complete!')

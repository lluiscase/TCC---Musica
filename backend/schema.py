"""Keeps an existing analises.db up to date with the models.

db.create_all only creates the tables that don't exist, it never changes the ones that do.
"""

from flask import current_app
from sqlalchemy import func, inspect, select, text
from sqlalchemy.schema import CreateColumn

from backend.extensions import db


def upgrade_schema():
    """Empty tables with an old structure are created again. Tables with data only get the
    missing columns, when they are nullable (the data stays untouched)."""
    inspector = inspect(db.engine)
    existing_tables = set(inspector.get_table_names())

    for table in db.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue

        existing = {column["name"] for column in inspector.get_columns(table.name)}
        expected = {column.name for column in table.columns}
        if existing == expected:
            continue

        with db.engine.begin() as connection:
            empty = connection.scalar(select(func.count()).select_from(table)) == 0
            if empty:
                table.drop(connection)
                table.create(connection)
                continue

            for column in table.columns:
                if column.name in existing:
                    continue
                if not column.nullable:
                    current_app.logger.warning(
                        "Coluna obrigatória %s.%s não existe no banco, apague o analises.db",
                        table.name,
                        column.name,
                    )
                    continue
                ddl = CreateColumn(column).compile(dialect=connection.dialect)
                connection.execute(text(f"ALTER TABLE {table.name} ADD COLUMN {ddl}"))

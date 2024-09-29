"""Initial migration.

Revision ID: 846202630611
Revises: 8f471bae8fcc
Create Date: 2024-09-22 13:23:10.925868

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '846202630611'
down_revision = '8f471bae8fcc'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('direccion',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('direccion', sa.String(length=200), nullable=False),
    sa.Column('categoria', sa.String(length=50), nullable=False),
    sa.Column('contacto', sa.String(length=100), nullable=True),
    sa.Column('comentarios', sa.Text(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.drop_table('direcciones')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('direcciones',
    sa.Column('id', sa.INTEGER(), autoincrement=True, nullable=False),
    sa.Column('nombre', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('direccion', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('categoria', sa.VARCHAR(), autoincrement=False, nullable=False),
    sa.Column('contacto', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('comentarios', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name='direcciones_pkey')
    )
    op.drop_table('direccion')
    # ### end Alembic commands ###
"""empty message

Revision ID: 5acb96dc3bda
Revises: fa074c6b706d
Create Date: 2025-01-03 00:07:02.126087

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5acb96dc3bda'
down_revision = 'fa074c6b706d'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('company',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('company_name', sa.String(length=120), nullable=False),
    sa.Column('nif', sa.String(length=9), nullable=False),
    sa.Column('address', sa.String(length=120), nullable=False),
    sa.Column('phone', sa.Integer(), nullable=False),
    sa.Column('email', sa.String(length=34), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('nif')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('company')
    # ### end Alembic commands ###

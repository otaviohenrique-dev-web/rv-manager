from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
from typing import Optional

class Chapa(Base):
    __tablename__ = "chapas"

    id = Column(Integer, primary_key=True, index=True)
    categoria = Column(String, default="OUTROS", index=True)
    descricao = Column(String, index=True)
    espessura = Column(String)
    altura = Column(Float, default=0.0)
    largura = Column(Float, default=0.0)

    preco_custo_m2 = Column(Float, default=0.0)  # Custo do material por m² (sem frete)
    preco_m2 = Column(Float, default=0.0)        # Preço de venda configurado
    valor_frete_padrao = Column(Float, default=0.0) # Frete padrão/unitário sugerido cadastrado na entrada

    estoque_chapas = Column(Integer, default=0)

    limite_vermelho_m2 = Column(Float, default=50.0)
    limite_amarelo_m2 = Column(Float, default=150.0)
    limite_verde_m2 = Column(Float, default=250.0)

    itens_venda = relationship("ItemVenda", back_populates="chapa")

class Venda(Base):
    __tablename__ = "vendas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_nome = Column(String, index=True)
    data_criacao = Column(DateTime, default=datetime.now)

    itens = relationship("ItemVenda", back_populates="venda", cascade="all, delete-orphan")

class ItemVenda(Base):
    __tablename__ = "itens_venda"

    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"))
    chapa_id = Column(Integer, ForeignKey("chapas.id"))

    altura = Column(Float)
    largura = Column(Float)
    quantidade_pecas = Column(Integer)
    preco_venda_m2 = Column(Float)
    metragem_total_m2 = Column(Float)
    valor_total = Column(Float)
    valor_frete_item: Optional[float] = Column(Float, default=0.0)

    venda = relationship("Venda", back_populates="itens")
    chapa = relationship("Chapa", back_populates="itens_venda")
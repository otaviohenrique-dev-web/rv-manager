from typing import Optional, List
from pydantic import BaseModel, Field

# --- SCHEMAS DE COMERCIAL E CALCULADORA ---
class CalculoPecaRequest(BaseModel):
    descricao: Optional[str] = Field("INCOLOR", description="Descrição/Tipo do vidro", example="INCOLOR")
    espessura: Optional[str] = Field("4MM", description="Espessura do vidro", example="4MM")
    largura: float = Field(..., gt=0, description="Largura da peça em metros", example=3.21)
    altura: float = Field(..., gt=0, description="Altura da peça em metros", example=2.40)
    quantidade: int = Field(1, gt=0, description="Quantidade de peças", example=5)
    chapa_id: Optional[int] = Field(None, description="ID/Índice da chapa no estoque", example=1)

class CalculoPecaResponse(BaseModel):
    descricao: str
    espessura: str
    dimensoes: str
    quantidade: int
    metragem_total_m2: float
    preco_unitario_m2: float
    valor_total: float

# --- OS #02: SCHEMAS DE AUDITORIA E QUEBRAS ---
class NovaQuebraRequest(BaseModel):
    chapa_id: int = Field(..., description="ID/Índice da chapa no estoque", example=12)
    tipo_ocorrencia: str = Field(..., description="'DESPERDICIO_TOTAL' ou 'REAPROVEITADA'", example="REAPROVEITADA")
    m2_reaproveitado: Optional[float] = Field(0.0, ge=0, description="Metragem quadrada salva", example=1.45)

class QuebraItem(BaseModel):
    id: str
    lote_origem: str
    descricao_vidro: str
    espessura: str
    m2_original: float
    m2_salvo_reciclagem: float
    m2_perda_total: float
    status: str
    data_registro: str

class ResumoAuditoriaQuebras(BaseModel):
    total_registros: int
    total_m2_bruto_quebrado: float
    total_m2_recuperado: float
    total_m2_desperdicio_real: float
    taxa_recuperacao_percentual: float

class HistoricoQuebrasResponse(BaseModel):
    resumo: ResumoAuditoriaQuebras
    quebras: List[QuebraItem]

# --- SCHEMAS DE MOVIMENTAÇÃO E ESTOQUE ---
class NovaEntradaRequest(BaseModel):
    chapa_id: Optional[int] = Field(None, description="ID da chapa no estoque (se existir)")
    nova_categoria: Optional[str] = Field(None, description="Categoria/Família do produto novo")
    nova_descricao: Optional[str] = Field(None, description="Descrição se for produto novo")
    nova_espessura: Optional[str] = Field(None, description="Espessura se for produto novo")

    limite_vermelho_m2: Optional[float] = Field(50.0)
    limite_amarelo_m2: Optional[float] = Field(150.0)
    limite_verde_m2: Optional[float] = Field(250.0)

    quantidade_m2: float = Field(..., gt=0)
    altura: float = Field(..., gt=0)
    largura: float = Field(..., gt=0)

    preco_custo_m2: float = Field(..., gt=0, description="Custo base de aquisição por m²")
    preco_venda_m2: float = Field(..., gt=0, description="Preço de venda desejado por m²")
    valor_frete: Optional[float] = Field(0.0, ge=0, description="Valor do frete informado na nota/entrada")

class ChapaUpdateRequest(BaseModel):
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    espessura: Optional[str] = None
    altura: Optional[float] = Field(None, gt=0)
    largura: Optional[float] = Field(None, gt=0)
    preco_custo_m2: Optional[float] = Field(None, gt=0)
    preco_m2: Optional[float] = Field(None, gt=0)
    valor_frete_padrao: Optional[float] = Field(None, ge=0)
    estoque_chapas: Optional[int] = Field(None, ge=0)
    limite_vermelho_m2: Optional[float] = None
    limite_amarelo_m2: Optional[float] = None
    limite_verde_m2: Optional[float] = None

# --- SCHEMAS DE VENDAS ---
class ItemVenda(BaseModel):
    chapa_id: int = Field(..., description="ID/Índice da chapa no estoque", example=1)
    altura: float = Field(..., gt=0, description="Altura da peça em metros", example=2.10)
    largura: float = Field(..., gt=0, description="Largura da peça em metros", example=1.50)
    quantidade_pecas: int = Field(..., gt=0, description="Quantidade de peças deste produto", example=3)
    preco_venda_m2: float = Field(..., gt=0, description="Preço final cobrado por m²", example=45.00)
    valor_frete_item: Optional[float] = Field(0.0, ge=0, description="Valor do frete cobrado para este item na venda", example=10.00)

class NovaVendaRequest(BaseModel):
    cliente_nome: str = Field(..., description="Nome ou identificação do cliente", example="Vidraçaria Silva")
    itens: List[ItemVenda] = Field(..., min_items=1, description="Lista de itens inclusos no pedido de venda")

class RelatorioItemResponse(BaseModel):
    descricao: str
    espessura: str
    dimensoes: str
    quantidade_pecas: int
    metragem_total_m2: float
    preco_venda_m2: float
    valor_total: float
    valor_frete_item: Optional[float] = Field(0.0)

class RelatorioVendaResponse(BaseModel):
    id_venda: int
    cliente_nome: str
    data_venda: str
    hora_venda: Optional[str] = Field(None, description="Horário da venda", example="14:35") # <--- ADICIONADO AQUI
    metragem_total: float
    valor_total: float
    valor_total_frete_venda: Optional[float] = Field(0.0)
    itens: List[RelatorioItemResponse]
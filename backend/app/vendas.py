from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional

# Importações dos schemas atualizados
from app.schemas import NovaVendaRequest, RelatorioVendaResponse

# Importe sua sessão de banco e modelos conforme a estrutura do projeto
from app.database import get_db
from app import models

router = APIRouter(prefix="/api/v1/vendas", tags=["Vendas"])

@router.post("/nova", status_code=status.HTTP_201_CREATED)
def registrar_nova_venda(payload: NovaVendaRequest, db: Session = Depends(get_db)):
    if not payload.itens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A venda deve conter pelo menos um item no carrinho."
        )

    try:
        total_venda_acumulado = 0.0
        total_m2_acumulado = 0.0
        total_frete_acumulado = 0.0

        # 1. Cria o registro Mestre (Capa da Venda)
        nova_venda = models.Venda(
            cliente_nome=payload.cliente_nome
        )
        db.add(nova_venda)
        db.flush() # Gera o nova_venda.id sem commitar

        itens_espelho = [] # Lista para retornar pro front-end montar o espelho

        # Iteração sobre os itens da venda (Estrutura Mestre-Detalhe)
        for item in payload.itens:
            m2_item = (item.altura * item.largura) * item.quantidade_pecas
            valor_item = m2_item * item.preco_venda_m2 
            valor_total_item_com_frete = valor_item + (item.valor_frete_item or 0.0)

            # Consulta o produto no estoque pelo chapa_id
            chapa = db.query(models.Chapa).filter(models.Chapa.id == item.chapa_id).first()
            if not chapa:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Chapa com ID {item.chapa_id} não encontrada no estoque."
                )

            # Validação preventiva de estoque
            if chapa.estoque_chapas < item.quantidade_pecas:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Estoque insuficiente para a chapa '{chapa.descricao}'. Disponível: {chapa.estoque_chapas}, Solicitado: {item.quantidade_pecas}"
                )

            # Abate do estoque individual
            chapa.estoque_chapas -= item.quantidade_pecas

            # Registra a saída do item associada ao pedido
            item_venda_db = models.ItemVenda(
                venda_id=nova_venda.id,
                chapa_id=item.chapa_id,
                altura=item.altura,
                largura=item.largura,
                quantidade_pecas=item.quantidade_pecas,
                preco_venda_m2=item.preco_venda_m2,
                metragem_total_m2=m2_item,
                valor_total=valor_item,
                valor_frete_item=item.valor_frete_item 
            )
            db.add(item_venda_db)

            # Acumuladores
            total_venda_acumulado += valor_total_item_com_frete 
            total_m2_acumulado += m2_item
            total_frete_acumulado += (item.valor_frete_item or 0.0)

            # Popula o array que será retornado para o Front-end imediatamente
            itens_espelho.append({
                "descricao": chapa.descricao if chapa else "Desconhecido",
                "espessura": chapa.espessura if chapa else "-",
                "dimensoes": f"{item.altura} x {item.largura}",
                "quantidade_pecas": item.quantidade_pecas,
                "metragem_total_m2": m2_item,
                "preco_venda_m2": item.preco_venda_m2,
                "valor_total": valor_item,
                "valor_frete_item": item.valor_frete_item or 0.0
            })

        # Commit atômico de toda a transação
        db.commit()
        db.refresh(nova_venda)

        # Formatação de data/hora para o front-end
        data_formatada = nova_venda.data_criacao.strftime("%d/%m/%Y") if getattr(nova_venda, 'data_criacao', None) else datetime.now().strftime("%d/%m/%Y")
        hora_formatada = nova_venda.data_criacao.strftime("%H:%M") if getattr(nova_venda, 'data_criacao', None) else datetime.now().strftime("%H:%M")

        return {
            "mensagem": "Venda registrada com sucesso!",
            "venda": {
                "id_venda": nova_venda.id,
                "cliente_nome": payload.cliente_nome,
                "data_venda": data_formatada,
                "hora_venda": hora_formatada,
                "metragem_total": round(total_m2_acumulado, 2),
                "valor_total": round(total_venda_acumulado, 2),
                "valor_total_frete_venda": round(total_frete_acumulado, 2),
                "itens": itens_espelho
            }
        }

    except Exception as err:
        db.rollback()
        if isinstance(err, HTTPException):
            raise err
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno ao processar transação de venda: {str(err)}"
        )

# --- ÉPICO 2: RELATÓRIO ESPELHO DE VENDA ---
@router.get("/{id_venda}/relatorio", response_model=RelatorioVendaResponse, tags=["Relatórios"])
def relatorio_venda(id_venda: int, db: Session = Depends(get_db)):
    """
    Recupera os dados consolidados da venda (Capa + Itens + Chapa) utilizando JOINs (joinedload).
    """
    venda = (
        db.query(models.Venda)
        .options(
            joinedload(models.Venda.itens).joinedload(models.ItemVenda.chapa)
        )
        .filter(models.Venda.id == id_venda)
        .first()
    )

    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada.")

    itens_relatorio = []
    total_m2 = 0.0
    total_venda = 0.0
    total_frete_itens = 0.0

    for item in venda.itens:
        chapa = item.chapa

        itens_relatorio.append({
            "descricao": chapa.descricao if chapa else "Desconhecido",
            "espessura": chapa.espessura if chapa else "-",
            "dimensoes": f"{item.altura} x {item.largura}",
            "quantidade_pecas": item.quantidade_pecas,
            "metragem_total_m2": item.metragem_total_m2,
            "preco_venda_m2": item.preco_venda_m2,
            "valor_total": item.valor_total,
            "valor_frete_item": item.valor_frete_item or 0.0
        })

        total_m2 += item.metragem_total_m2
        total_venda += item.valor_total + (item.valor_frete_item or 0.0)
        total_frete_itens += (item.valor_frete_item or 0.0)

    if hasattr(venda, 'data_criacao') and venda.data_criacao:
        data_formatada = venda.data_criacao.strftime("%d/%m/%Y")
        hora_formatada = venda.data_criacao.strftime("%H:%M")
    else:
        data_formatada = datetime.now().strftime("%d/%m/%Y")
        hora_formatada = datetime.now().strftime("%H:%M")

    return {
        "id_venda": venda.id,
        "cliente_nome": venda.cliente_nome,
        "data_venda": data_formatada,
        "hora_venda": hora_formatada,
        "metragem_total": round(total_m2, 2),
        "valor_total": round(total_venda, 2), 
        "valor_total_frete_venda": round(total_frete_itens, 2), 
        "itens": itens_relatorio
    }


# --- ÉPICO 3: HISTÓRICO E AUDITORIA DE VENDAS ---

@router.get("", tags=["Auditoria"])
def listar_historico_vendas(
    cliente: Optional[str] = None,
    id: Optional[int] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lista histórico completo de vendas para auditoria,
    consulta e reimpressão de espelhos.
    """

    query = (
        db.query(models.Venda)
        .options(
            joinedload(models.Venda.itens).joinedload(models.ItemVenda.chapa)
        )
    )

    if id:
        query = query.filter(models.Venda.id == id)

    if cliente:
        query = query.filter(models.Venda.cliente_nome.ilike(f"%{cliente}%"))

    if data_inicio:
        try:
            inicio = datetime.strptime(data_inicio, "%Y-%m-%d")
            query = query.filter(models.Venda.data_criacao >= inicio)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato data_inicio inválido. Use YYYY-MM-DD.")

    if data_fim:
        try:
            fim = datetime.strptime(data_fim, "%Y-%m-%d")
            fim = fim.replace(hour=23, minute=59, second=59)
            query = query.filter(models.Venda.data_criacao <= fim)
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato data_fim inválido. Use YYYY-MM-DD.")

    vendas = query.order_by(models.Venda.data_criacao.desc()).all()
    historico = []

    for venda in vendas:
        total_itens = len(venda.itens)
        metragem_total = sum(item.metragem_total_m2 or 0 for item in venda.itens)
        valor_frete = sum(item.valor_frete_item or 0 for item in venda.itens)
        valor_total = sum((item.valor_total or 0) + (item.valor_frete_item or 0) for item in venda.itens)

        historico.append({
            "id_venda": venda.id,
            "cliente_nome": venda.cliente_nome,
            "data_venda": venda.data_criacao.strftime("%d/%m/%Y") if venda.data_criacao else "",
            "hora_venda": venda.data_criacao.strftime("%H:%M") if venda.data_criacao else "",
            "total_itens": total_itens,
            "metragem_total": round(metragem_total, 2),
            "valor_total_frete": round(valor_frete, 2),
            "valor_total_venda": round(valor_total, 2),
            
            "itens": [
                {
                    "chapa_id": item.chapa_id,
                    "descricao": item.chapa.descricao if item.chapa else "Desconhecido",
                    "espessura": item.chapa.espessura if item.chapa else "-",
                    "altura": item.altura,
                    "largura": item.largura,
                    "quantidade_pecas": item.quantidade_pecas,
                    "m2_total": item.metragem_total_m2,
                    "preco_venda_m2": item.preco_venda_m2,
                    "valor_frete_item": item.valor_frete_item,
                    "valor_total": item.valor_total
                }
                for item in venda.itens
            ]
        })
      
    return historico
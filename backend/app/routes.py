from datetime import datetime
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.schemas import (
    CalculoPecaRequest,
    CalculoPecaResponse,
    HistoricoQuebrasResponse,
    NovaEntradaRequest,
    NovaVendaRequest,
    NovaQuebraRequest,
    ChapaUpdateRequest
)
from app import models
from app.database import get_db

router = APIRouter()

def extrair_categoria(descricao: str) -> str:
    desc_upper = str(descricao).upper() if descricao else ""
    if "INCOLOR" in desc_upper: return "INCOLOR"
    elif "ESPELHO" in desc_upper: return "ESPELHOS"
    elif "FUMÊ" in desc_upper or "FUME" in desc_upper: return "FUMÊ (NACIONAL)"
    elif "BRONZE" in desc_upper: return "BRONZE"
    elif "VERDE" in desc_upper: return "VERDE"
    elif "CANELADO" in desc_upper: return "CANELADO"
    elif "REFLETIVO" in desc_upper: return "REFLETIVO"
    return "OUTROS"

@router.get("/api/v1/dashboard/tabela-precos", tags=["Dashboard"])
def get_tabela_precos(db: Session = Depends(get_db)):
    chapas = db.query(models.Chapa).all()
    tabela = []

    for chapa in chapas:
        preco_custo_seguro = chapa.preco_custo_m2 or 0.0
        preco_venda_seguro = chapa.preco_m2 or 0.0
        valor_frete_seguro = chapa.valor_frete_padrao or 0.0

        limite_amarelo = chapa.limite_amarelo_m2 if chapa.limite_amarelo_m2 is not None else 150.0
        limite_verde = chapa.limite_verde_m2 if chapa.limite_verde_m2 is not None else 250.0

        m2_total = (chapa.altura * chapa.largura) * chapa.estoque_chapas

        status_cor = "dark"
        if m2_total > 0:
            if m2_total < limite_amarelo:
                status_cor = "danger"
            elif m2_total < limite_verde:
                status_cor = "warning"
            else:
                status_cor = "success"

        tabela.append({
            "id": chapa.id,
            "categoria": chapa.categoria,
            "descricao": chapa.descricao,
            "espessura": chapa.espessura,
            "dimensoes": f"{chapa.altura:.3f} x {chapa.largura:.3f}",
            "preco_custo_m2": round(preco_custo_seguro, 2),
            "preco_m2": round(preco_venda_seguro, 2),
            "valor_frete": round(valor_frete_seguro, 2),
            "estoque_chapas": chapa.estoque_chapas,
            "m2_estoque": round(m2_total, 2),
            "status": status_cor
        })
    return tabela

@router.get("/api/v1/dashboard/cards-graficos", tags=["Dashboard"])
def get_cards_graficos(db: Session = Depends(get_db)):
    chapas = db.query(models.Chapa).all()

    metragem_total_estoque = 0.0
    valor_investido_estoque = 0.0
    familias = {}

    for c in chapas:
        m2_chapa = (c.altura * c.largura) * c.estoque_chapas
        metragem_total_estoque += m2_chapa
        valor_investido_estoque += (m2_chapa * (c.preco_custo_m2 or 0.0))

        nome_cat = c.categoria if c.categoria else "OUTROS"
        familias[nome_cat] = familias.get(nome_cat, 0.0) + m2_chapa

    grafico_estoque_familia = [
        {"familia": f, "m2": round(v, 2)} for f, v in familias.items() if v > 0
    ]

    itens_venda = db.query(models.ItemVenda).all()
    faturamento_total_com_frete = sum(i.valor_total + (i.valor_frete_item or 0.0) for i in itens_venda)

    mes_atual_str = datetime.now().strftime("%b")
    grafico_vendas = [
        { "mes": "Jan", "vendas": 0, "compras": 0 },
        { "mes": "Fev", "vendas": 0, "compras": 0 },
        { "mes": "Mar", "vendas": 0, "compras": 0 },
        { "mes": "Abr", "vendas": 0, "compras": 0 },
        { "mes": "Mai", "vendas": 0, "compras": 0 },
        { "mes": mes_atual_str, "vendas": round(faturamento_total_com_frete, 2), "compras": round(valor_investido_estoque, 2) }
    ]

    total_quebras_qtd = db.query(models.Quebra).count() if hasattr(models, 'Quebra') else 0

    return {
        "kpis": {
            "faturamento_total": round(faturamento_total_com_frete, 2),
            "valor_investido": round(valor_investido_estoque, 2),
            "metragem_total_m2": round(metragem_total_estoque, 2),
            "total_quebras": total_quebras_qtd
        },
        "grafico_vendas_mensal": grafico_vendas,
        "grafico_estoque_familia": grafico_estoque_familia
    }

@router.get("/api/v1/vendedor/estoque", tags=["Vendedor"])
def get_estoque_vendedor(db: Session = Depends(get_db)):
    chapas = db.query(models.Chapa).all()
    tabela = []
    for chapa in chapas:
        limite_amarelo = chapa.limite_amarelo_m2 if chapa.limite_amarelo_m2 is not None else 150.0
        limite_verde = chapa.limite_verde_m2 if chapa.limite_verde_m2 is not None else 250.0

        m2_total = (chapa.altura * chapa.largura) * chapa.estoque_chapas

        status_cor = "dark"
        if m2_total > 0:
            if m2_total < limite_amarelo: status_cor = "danger"
            elif m2_total < limite_verde: status_cor = "warning"
            else: status_cor = "success"

        tabela.append({
            "chapa_id": chapa.id,
            "categoria": chapa.categoria,
            "descricao": chapa.descricao,
            "espessura": chapa.espessura,
            "dimensoes": f"{chapa.altura:.3f} x {chapa.largura:.3f}",
            "estoque_chapas": chapa.estoque_chapas,
            "m2_estoque": round(m2_total, 2),
            "valor_frete": round(chapa.valor_frete_padrao or 0.0, 2),
            "status": status_cor
        })
    return tabela

@router.get("/api/v1/dashboard/categorias", tags=["Dashboard"])
def get_categorias(db: Session = Depends(get_db)):
    chapas = db.query(models.Chapa).all()
    return {"categorias": sorted(list({extrair_categoria(c.descricao) for c in chapas if c.descricao}))}

# --- MOVIMENTAÇÕES & VENDAS ---
@router.post("/api/v1/estoque/entrada", tags=["Movimentações"])
def registrar_entrada_estoque(payload: NovaEntradaRequest, db: Session = Depends(get_db)):
    if not payload.chapa_id and not payload.nova_descricao:
        raise HTTPException(status_code=400, detail="Informe Produto existente ou Descrição do novo.")

    area_chapa_m2 = payload.altura * payload.largura
    quantidade_chapas_inteiras = int(payload.quantidade_m2 // area_chapa_m2) if area_chapa_m2 > 0 else 0

    custo_novo_m2_material = payload.preco_custo_m2
    frete_informado = payload.valor_frete if hasattr(payload, 'valor_frete') and payload.valor_frete is not None else 0.0

    if payload.chapa_id:
        chapa = db.query(models.Chapa).filter(models.Chapa.id == payload.chapa_id).first()
        if not chapa:
            raise HTTPException(status_code=404, detail="Chapa não encontrada.")

        estoque_atual_m2 = (chapa.altura * chapa.largura) * chapa.estoque_chapas
        custo_atual_m2 = chapa.preco_custo_m2 or 0.0

        divisor = estoque_atual_m2 + payload.quantidade_m2

        custo_medio_m2 = (
            ((estoque_atual_m2 * custo_atual_m2) + (payload.quantidade_m2 * custo_novo_m2_material)) / divisor
            if divisor > 0 else custo_novo_m2_material
        )

        chapa.estoque_chapas += quantidade_chapas_inteiras
        chapa.preco_custo_m2 = round(custo_medio_m2, 4)
        chapa.preco_m2 = payload.preco_venda_m2
        chapa.valor_frete_padrao = frete_informado
        chapa.altura = payload.altura
        chapa.largura = payload.largura

        if payload.limite_vermelho_m2: chapa.limite_vermelho_m2 = payload.limite_vermelho_m2
        if payload.limite_amarelo_m2: chapa.limite_amarelo_m2 = payload.limite_amarelo_m2
        if payload.limite_verde_m2: chapa.limite_verde_m2 = payload.limite_verde_m2

        mensagem = f"Entrada processada: +{quantidade_chapas_inteiras} chs adicionadas. Custo médio ponderado recalculado."
    else:
        chapa = models.Chapa(
            categoria=payload.nova_categoria.strip().upper() if payload.nova_categoria else "OUTROS",
            descricao=payload.nova_descricao.strip().upper(),
            espessura=payload.nova_espessura.strip().upper() if payload.nova_espessura else "N/A",
            altura=payload.altura,
            largura=payload.largura,
            preco_custo_m2=round(custo_novo_m2_material, 4),
            preco_m2=payload.preco_venda_m2,
            valor_frete_padrao=frete_informado,
            estoque_chapas=quantidade_chapas_inteiras,
            limite_vermelho_m2=payload.limite_vermelho_m2,
            limite_amarelo_m2=payload.limite_amarelo_m2,
            limite_verde_m2=payload.limite_verde_m2
        )
        db.add(chapa)
        mensagem = f"Novo produto cadastrado: {chapa.descricao}."

    db.commit()
    db.refresh(chapa)
    return {
        "sucesso": True,
        "mensagem": mensagem,
        "custo_medio_m2_atual": round(chapa.preco_custo_m2, 2),
        "preco_venda_m2_atual": round(chapa.preco_m2, 2),
        "valor_frete_padrao_atual": round(chapa.valor_frete_padrao or 0.0, 2),
        "valor_total_compra": round(payload.quantidade_m2 * custo_novo_m2_material, 2),
        "chapa_id": chapa.id
    }

@router.put("/api/v1/chapas/{chapa_id}", tags=["Estoque"])
def atualizar_chapa(chapa_id: int, payload: ChapaUpdateRequest, db: Session = Depends(get_db)):
    chapa = db.query(models.Chapa).filter(models.Chapa.id == chapa_id).first()
    if not chapa:
        raise HTTPException(status_code=404, detail="Chapa não encontrada.")

    dados = payload.dict(exclude_unset=True)
    for campo, valor in dados.items():
        if campo in ("categoria", "descricao", "espessura") and isinstance(valor, str):
            valor = valor.strip().upper()
        setattr(chapa, campo, valor)

    db.commit()
    db.refresh(chapa)
    return {
        "sucesso": True,
        "mensagem": f"Chapa #{chapa_id} atualizada com sucesso.",
        "chapa_id": chapa.id
    }

@router.delete("/api/v1/chapas/{chapa_id}", tags=["Estoque"])
def excluir_chapa(chapa_id: int, db: Session = Depends(get_db)):
    chapa = db.query(models.Chapa).filter(models.Chapa.id == chapa_id).first()
    if not chapa:
        raise HTTPException(status_code=404, detail="Chapa não encontrada.")

    tem_historico_venda = db.query(models.ItemVenda).filter(models.ItemVenda.chapa_id == chapa_id).first()
    if tem_historico_venda:
        chapa.estoque_chapas = 0
        db.commit()
        return {
            "sucesso": True,
            "mensagem": f"Chapa #{chapa_id} possui vendas vinculadas. Estoque zerado (exclusão lógica).",
            "tipo_exclusao": "logica"
        }

    db.delete(chapa)
    db.commit()
    return {
        "sucesso": True,
        "mensagem": f"Chapa #{chapa_id} removida definitivamente do estoque.",
        "tipo_exclusao": "fisica"
    }

@router.post("/api/v1/comercial/calcular-peca", response_model=CalculoPecaResponse, tags=["Comercial"])
def calcular_peca(payload: CalculoPecaRequest, db: Session = Depends(get_db)):
    chapa = db.query(models.Chapa).filter(
        models.Chapa.descricao.ilike(f"%{payload.descricao}%"),
        models.Chapa.espessura.ilike(f"%{payload.espessura}%")
    ).first()

    if not chapa:
        raise HTTPException(status_code=404, detail="Produto não localizado no banco.")

    preco_venda_seguro = chapa.preco_m2 or 0.0
    metragem_total = payload.altura * payload.largura * payload.quantidade
    return {
        "descricao": chapa.descricao.upper(),
        "espessura": chapa.espessura.upper(),
        "dimensoes": f"{payload.altura:.3f} x {payload.largura:.3f}",
        "quantidade": payload.quantidade,
        "metragem_total_m2": round(metragem_total, 3),
        "preco_unitario_m2": round(preco_venda_seguro, 2),
        "valor_total": round(metragem_total * preco_venda_seguro, 2)
    }

@router.post("/api/v1/quebras/registrar", tags=["Auditoria & Quebras"])
def registrar_nova_quebra(payload: NovaQuebraRequest, db: Session = Depends(get_db)):
    chapa = db.query(models.Chapa).filter(models.Chapa.id == payload.chapa_id).first()
    if not chapa:
        raise HTTPException(status_code=404, detail="Chapa não encontrada.")

    m2_original = chapa.altura * chapa.largura
    m2_salvo = payload.m2_reaproveitado if payload.tipo_ocorrencia == "REAPROVEITADA" else 0.0

    if hasattr(models, 'Quebra'):
        nova_quebra = models.Quebra(
            chapa_id=payload.chapa_id,
            m2_original=m2_original,
            m2_salvo_reciclagem=m2_salvo,
            status=payload.tipo_ocorrencia,
            observacao=getattr(payload, 'observacao', '')
        )
        db.add(nova_quebra)
        db.commit()

    return {
        "sucesso": True,
        "mensagem": "Quebra registrada com sucesso.",
        "dados": {
            "descricao_vidro": chapa.descricao,
            "espessura": chapa.espessura,
            "m2_original": round(m2_original, 2),
            "m2_salvo_reciclagem": round(m2_salvo, 2),
            "status": payload.tipo_ocorrencia
        }
    }

@router.get("/api/v1/quebras/historico", response_model=HistoricoQuebrasResponse, tags=["Auditoria & Quebras"])
@router.get("/api/v1/quebras/rastreamento", response_model=HistoricoQuebrasResponse, tags=["Auditoria & Quebras"])
def get_historico_quebras(db: Session = Depends(get_db)):
    if hasattr(models, 'Quebra'):
        quebras = db.query(models.Quebra).all()
        tot_orig = sum(q.m2_original for q in quebras)
        tot_salvo = sum(q.m2_salvo_reciclagem for q in quebras)
        lista = [
            {
                "id": f"QBR-{q.id}",
                "lote_origem": f"LOTE-{q.id}",
                "descricao_vidro": getattr(q, 'descricao_vidro', 'N/A'),
                "espessura": getattr(q, 'espessura', 'N/A'),
                "m2_original": round(q.m2_original, 2),
                "m2_salvo_reciclagem": round(q.m2_salvo_reciclagem, 2),
                "m2_perda_total": round(q.m2_original - q.m2_salvo_reciclagem, 2),
                "status": q.status,
                "data_registro": datetime.now().strftime('%Y-%m-%d')
            } for q in quebras
        ]
        resumo = {
            "total_registros": len(quebras),
            "total_m2_bruto_quebrado": round(tot_orig, 2),
            "total_m2_recuperado": round(tot_salvo, 2),
            "total_m2_desperdicio_real": round(tot_orig - tot_salvo, 2),
            "taxa_recuperacao_percentual": round((tot_salvo / tot_orig) * 100, 1) if tot_orig > 0 else 0.0
        }
        return {"resumo": resumo, "quebras": lista}

    return {
        "resumo": {
            "total_registros": 0, "total_m2_bruto_quebrado": 0.0,
            "total_m2_recuperado": 0.0, "total_m2_desperdicio_real": 0.0,
            "taxa_recuperacao_percentual": 0.0
        },
        "quebras": []
    }
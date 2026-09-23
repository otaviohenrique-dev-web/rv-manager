"""
Script de Backfill - OS #09/#10
Corrige registros legados de `Chapa` cujo preco_custo_m2 esteja NULL ou 0.0,
estimando o custo real a partir do preco_m2 (venda) vigente e de uma margem
de lucro padrão assumida pelo negócio, até que uma entrada oficial recalcule
o custo médio ponderado real.

Uso:
    python -m scripts.backfill_preco_custo
    python -m scripts.backfill_preco_custo --dry-run
"""

import argparse
from app.database import SessionLocal
from app import models

# Margem de lucro padrão assumida sobre o custo (30% => preco_venda = custo * 1.30)
# Ajuste este valor conforme a margem histórica praticada pela empresa.
MARGEM_PADRAO_ESTIMADA = 0.30


def calcular_custo_estimado(preco_venda: float, margem: float = MARGEM_PADRAO_ESTIMADA) -> float:
    if not preco_venda or preco_venda <= 0:
        return 0.0
    return preco_venda / (1 + margem)

    # Alternativa conservadora (NÃO recomendada, superestima o custo):
    # return preco_venda


def executar_backfill(dry_run: bool = False):
    db = SessionLocal()
    try:
        chapas_legadas = db.query(models.Chapa).filter(
            (models.Chapa.preco_custo_m2 == None) | (models.Chapa.preco_custo_m2 == 0.0)
        ).all()

        if not chapas_legadas:
            print("Nenhum registro legado encontrado. Base já íntegra.")
            return

        print(f"Registros legados encontrados: {len(chapas_legadas)}")
        print(f"Margem padrão aplicada na estimativa: {MARGEM_PADRAO_ESTIMADA * 100:.0f}%\n")

        for chapa in chapas_legadas:
            preco_venda_atual = chapa.preco_m2 or 0.0
            custo_estimado = round(calcular_custo_estimado(preco_venda_atual), 4)

            print(
                f"[ID {chapa.id}] {chapa.descricao} | "
                f"preco_m2={preco_venda_atual:.2f} -> "
                f"preco_custo_m2_estimado={custo_estimado:.2f}"
            )

            if not dry_run:
                chapa.preco_custo_m2 = custo_estimado

        if dry_run:
            print("\n[DRY-RUN] Nenhuma alteração persistida. Rode sem --dry-run para aplicar.")
        else:
            db.commit()
            print(f"\n{len(chapas_legadas)} registros corrigidos e persistidos com sucesso.")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill de preco_custo_m2 para registros legados.")
    parser.add_argument("--dry-run", action="store_true", help="Simula sem gravar no banco.")
    args = parser.parse_args()

    executar_backfill(dry_run=args.dry_run)
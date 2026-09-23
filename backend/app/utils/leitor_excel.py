import os
import pandas as pd

def testar_leitura_chaparia():
    """
    Lê a aba 'VALORES ATUALIZADOS CHAPARIA' e exibe os dados no terminal.
    Garante a validação inicial do insumo do cliente.
    """
    caminho_base = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/dados_cliente.xlsx'))
    aba_alvo = "VALORES ATUALIZADOS CHAPARIA"
    
    print(f"🔄 Tentando ler o arquivo em: {caminho_base}...")
    
    if not os.path.exists(caminho_base):
        print(f"❌ Erro: O arquivo 'dados_cliente.xlsx' não foi encontrado na pasta /data.")
        return

    try:
        # Carrega a aba específica usando openpyxl como engine
        df = pd.read_excel(caminho_base, sheet_name=aba_alvo)
        
        print(f"✅ Sucesso! Aba '{aba_alvo}' carregada perfeitamente.")
        print("\n--- Primeiras linhas da planilha ---")
        print(df.head())
        print("------------------------------------\n")
        
    except ValueError:
        print(f"❌ Erro: A aba '{aba_alvo}' não foi encontrada no arquivo Excel.")
    except Exception as e:
        print(f"❌ Erro inesperado na leitura: {str(e)}")

if __name__ == "__main__":
    testar_leitura_chaparia()
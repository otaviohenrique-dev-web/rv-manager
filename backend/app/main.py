import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Importação dos arquivos de rotas
from app.routes import router
from app.vendas import router as vendas_router

# Importações do Banco de Dados (Corrigido com a importação da Base)
from app.database import engine, Base
from app import models

# Cria as tabelas físicas no banco SQLite de forma segura
Base.metadata.create_all(bind=engine)

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("⚡ [BANCO] API iniciada 100% conectada ao SQLite. Módulo Pandas removido.")
    yield

app = FastAPI(
    title="MVP Marketing - Vidros e Chaparia",
    description="API para processamento de dados e faturamento (Go-Live Relacional)",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Injeção das rotas no aplicativo principal
app.include_router(router)
app.include_router(vendas_router)
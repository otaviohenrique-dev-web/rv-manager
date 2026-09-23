from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cria um arquivo SQLite local na raiz do backend chamado 'rvmanager.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./rvmanager.db"

# connect_args={"check_same_thread": False} é necessário apenas para SQLite no FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependência do FastAPI para injetar a sessão do banco nas rotas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
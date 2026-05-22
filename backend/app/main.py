from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes import router


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Gestión de Pedidos y Facturación",
    description="API para administrar productos, pedidos y facturas de un restaurante.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def home():
    return {
        "message": "API del sistema de restaurante funcionando correctamente"
    }
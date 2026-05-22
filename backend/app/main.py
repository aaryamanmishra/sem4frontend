from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.models.database_models import Base
from app.database import engine
from app.routes import auth, payments, user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Banking App API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(user.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "banking-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

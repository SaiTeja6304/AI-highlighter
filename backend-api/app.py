from fastapi import FastAPI 
from api_routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI( 
   title="VLM Chat", 
   version="1.0.0" 
) 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
 

# Include the routers 
app.include_router(router) 
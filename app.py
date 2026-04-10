# api.py
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
from sqlalchemy import create_engine
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langgraph.graph import StateGraph, START, END
from fastapi import UploadFile, File, Form
import pandas as pd
from python import HoloState, get_config, execute_sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","https://holograph-lemon.vercel.app"], # Your Next.js URL
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def home():
    return {"status": "FastAPI is working 🚀"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Read file
        if file.filename.endswith(".csv"):
            df = pd.read_csv(file.file)
        elif file.filename.endswith(".json"):
            df = pd.read_json(file.file)
        else:
            return {"error": "Unsupported file format"}

        # 🔥 Save to SAME DB used by get_db_schema()
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, "holograph.db")

        engine = create_engine(f"sqlite:///{db_path}")

        # Use dynamic table name (important)
        table_name = "user_data"

        df.to_sql(table_name, engine, if_exists="replace", index=False)

        return {
            "message": f"Data uploaded to table '{table_name}'",
            "columns": list(df.columns)
        }

    except Exception as e:
        return {"error": str(e)}

# 3. The API Endpoint
@app.post("/ask")
async def ask_agent(request: QueryRequest):
    print(f"📩 Received query: {request.query}")
    
    try:
        # Initialize your Graph
        graph = StateGraph(HoloState)
        graph.add_node("get_config", get_config)
        graph.add_node("execute_sql", execute_sql)
        graph.add_edge(START, "get_config")
        graph.add_edge("get_config", "execute_sql")
        graph.add_edge("execute_sql", END)
        workflow = graph.compile()
        
        # Run the workflow
        result = workflow.invoke({'user_query': request.query})
        
        # Extract the data to send back
        reasoning = result.get('reasoning_response', {})
        data = result.get('data', [])
        
        return {
            "status": "success",
            "config": reasoning.get('visualization_config'),
            "data": data,
            "narrative": reasoning.get('narrative'),
            "sql": reasoning.get('sql_query'),
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# api.py
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langgraph.graph import StateGraph, START, END

from python import HoloState, get_config, execute_sql

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Your Next.js URL
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.get("/")
def home():
    return {"status": "FastAPI is working 🚀"}

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

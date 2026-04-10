from langchain_core.prompts import PromptTemplate
from typing_extensions import TypedDict
from typing import Literal,Optional
from langgraph.graph import StateGraph,START,END
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain_core.output_parsers import PydanticOutputParser
from sqlalchemy import create_engine, text
import os
import sqlalchemy
load_dotenv()
os.environ['GROQ_API_KEY']=os.getenv('GROQ_API_KEY')
llm=ChatGroq(model='llama-3.3-70b-versatile',  temperature=0)

class HoloState(TypedDict):
    user_query: str          
    reasoning_response:dict
    data:dict


class VisualizationConfig(BaseModel):
    chart_type: Literal["bar_chart_3d", "globe_3d", "scatter_3d", "pie_3d","bubble_3d","heatmap_3d", "funnel_3d",] = Field(
        ..., 
        description="The type of 3D visualization to render."
    )
    x_axis: Optional[str] = Field(
        default=None,
        description="The column name to use for the X-axis"
    )

    y_axis: Optional[str] = Field(
        default=None,
        description="The column name to use for the value"
    )



    color_theme:Optional[str] = Field(
        "neon_blue", 
        description="The aesthetic theme for the 3D scene."
    )
    camera_action:Optional[str]= Field(
        "zoom_in", 
        description="The initial camera movement animation when data loads."
    )

class HoloGraphResponse(BaseModel):
    thought_process: str = Field(
        ..., 
        description="Brief reasoning on why you chose this data and visualization."
    )
    sql_query: str = Field(
        ..., 
        description="The raw SQL query to fetch data from the PostgreSQL database."
    )
    visualization_config: VisualizationConfig = Field(
        ..., 
        description="Configuration instructions for the React Three Fiber engine."
    )
    narrative: str = Field(
        ..., 
        description="A short, spoken-style summary of the data findings for the TTS engine."
    )




def get_db_schema():
    # 1. Setup Path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "holograph.db")
    
    if not os.path.exists(db_path):
        print(f"⚠️ Warning: Database not found at {db_path}")
        return "Error: Database file not found."

    # 2. Connect
    engine = create_engine(f"sqlite:///{db_path}")
    inspector = sqlalchemy.inspect(engine)
    
    schema_info = []
    
    # 3. Loop Tables & Fetch Samples
    for table_name in inspector.get_table_names():
        # Get Columns
        columns = inspector.get_columns(table_name)
        col_names = [f"{col['name']} ({col['type']})" for col in columns]
        
        # Get 3 Sample Rows
        with engine.connect() as conn:
            try:
                # We use text() to safely write the query
                sample_rows = conn.execute(text(f"SELECT * FROM {table_name} LIMIT 3")).fetchall()
            except Exception as e:
                sample_rows = [f"Could not fetch samples: {e}"]
        
        # Format samples as string
        sample_data_str = "\n".join([str(row) for row in sample_rows])
        
        # Combine into context
        table_desc = (
            f"Table: {table_name}\n"
            f"Columns: {', '.join(col_names)}\n"
            f"Sample Data (Context):\n{sample_data_str}"
        )
        schema_info.append(table_desc)
        
    return "\n\n".join(schema_info)

def get_config(state: HoloState):
    query = state['user_query']
    db_context = get_db_schema()

    template_text = """You are a SQLite Text-to-SQL agent that returns ONLY valid JSON.

### DATABASE SCHEMA
{db_schema}

### SQLITE RULES
- Use strftime('%Y', column) instead of EXTRACT()
- Use exact table/column names from schema
- Always alias aggregates: SUM(x) AS x, COUNT(*) AS count
- Always GROUP BY when using aggregates
- Use LOWER() for text filters

### CHART SELECTION
Pick chart_type based on the user's query:
- "pie_3d"      → words like: distribution, proportion, breakdown, share, percentage
- "scatter_3d"  → words like: correlation, vs, versus, relationship
- "globe_3d"    → words like: map, globe, world, geographic, country
- "bubble_3d"   → bubble, 3 metrics, size comparison       
- "heatmap_3d"  → heatmap, intensity, density, pattern      
- "funnel_3d"   → funnel, pipeline, conversion, stages 
- "bar_chart_3d"→ everything else (default)

### OUTPUT FORMAT (strict JSON, nothing else)
{{
  "thought_process": "one line reasoning",
  "sql_query": "valid sqlite query",
  "visualization_config": {{
    "chart_type": "bar_chart_3d | pie_3d | scatter_3d | globe_3d",
    "x_axis": "MUST be exact column name from SELECT (e.g. product, region)",
    "y_axis": "MUST be exact aggregate column name from SELECT (e.g. sales, count)",
    "color_theme": "neon_blue",
    "camera_action": "zoom_in"
  }},
  "narrative": "one line summary"
}}


### REQUEST
"{query_input}"
""".format(db_schema=db_context, query_input=query)  # 👈 direct .format()

    parser = PydanticOutputParser(pydantic_object=HoloGraphResponse)

    try:
        response = llm.invoke(template_text)
        json_string = response.content.replace("```json", "").replace("```", "").strip()
        structured_data = parser.parse(json_string)
        result_dict = structured_data.model_dump()
        print(f"hello: {result_dict}")
        return {"reasoning_response": result_dict}
    except Exception as e:
        print(f"Parsing Error: {e}")
        return {"reasoning_response": None}
    



def execute_sql(state: HoloState):

    response_data = state['reasoning_response']
    sql_query = response_data['sql_query']

    
    if not sql_query:
        print("❌ No SQL query found to execute.")
        return {"query_results": []}

    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "holograph.db")
    db_uri = f"sqlite:///{db_path}"
    
    engine = create_engine(db_uri)

    try:
        print(f"🔹 Executing SQL: {sql_query}")
        
        with engine.connect() as connection:
            result = connection.execute(text(sql_query))
            
            keys = result.keys()
            data = [dict(zip(keys, row)) for row in result.fetchall()]
            print(f"data:{data}")
            
            print(f"✅ Fetched {len(data)} rows.")
            return {"data": data}
            
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return {"query_results": [{"error": str(e)}]}


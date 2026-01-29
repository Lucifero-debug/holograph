from langchain_core.prompts import PromptTemplate
from typing_extensions import TypedDict
from typing import Annotated,List,Any,Literal
from langgraph.graph import StateGraph,START,END
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import os
import streamlit as st
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from langchain.output_parsers import PydanticOutputParser
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
    chart_type: Literal["bar_chart_3d", "globe_3d", "scatter_3d", "pie_3d"] = Field(
        ..., 
        description="The type of 3D visualization to render."
    )
    x_axis: str = Field(
        ..., 
        description="The column name to use for the X-axis (e.g., 'quarter', 'region')."
    )
    y_axis: str = Field(
        ..., 
        description="The column name to use for the height/value (e.g., 'revenue', 'users')."
    )
    color_theme:str = Field(
        "neon_blue", 
        description="The aesthetic theme for the 3D scene."
    )
    camera_action:str= Field(
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
    template_text = """### SYSTEM ROLE
You are an expert **SQLite** Text-to-SQL Agent.

### DATABASE SCHEMA (ABSOLUTE TRUTH)
{{ db_schema }}

### CRITICAL SQLITE RULES (DO NOT BREAK)
1. **NO `EXTRACT()` Function:** SQLite does NOT support `EXTRACT(YEAR FROM ...)`.
   - **Use this instead:** `strftime('%Y', date_column)` OR simply use the `year` column if available.
2. **Table Names:** You MUST use the EXACT table names from the schema above.
   - **BANNED:** `sales_data`, `software_sales`
   - **CORRECT:** `sales`
3. **Column Names:** Never invent columns like `sale_date` or `total_sales`. Use `transaction_date` and `sales_amount`.
4. ALWAYS alias aggregate columns:
   - SUM(sales_amount) AS sales_amount
   - COUNT(*) AS count
   - AVG(price) AS avg_price

### Visualization Rules (STRICT AND NON-NEGOTIABLE)

1. chart_type MUST be exactly one of:
   - "bar_chart_3d"
   - "pie_3d"
   - "scatter_3d"
   - "globe_3d"

2. NEVER invent chart types such as:
   - "pie_chart", "bar", "line", "area", etc.

3. PIE CHART RULES (VERY IMPORTANT):
   - You may ONLY use "pie_3d" if ALL conditions are met:
     a) Exactly ONE metric
     b) Exactly ONE categorical dimension
     c) NO temporal dimension (year, quarter, month, date)
   - If ANY temporal dimension exists → pie_3d is FORBIDDEN.

4. BAR CHART RULES:
   - Use "bar_chart_3d" for:
     a) Comparisons across categories
     b) Comparisons across time
     c) Grouped or multi-dimensional comparisons
   - If unsure, ALWAYS choose "bar_chart_3d".

5. SCATTER CHART RULES:
   - Use "scatter_3d" ONLY when the user asks for distribution, correlation, or spread.

6. GLOBE CHART RULES:
   - Use "globe_3d" ONLY when the user explicitly asks for geographic or world-based visualization.

7. DEFAULT BEHAVIOR:
   - If multiple chart types seem possible, ALWAYS default to "bar_chart_3d".


### DYNAMIC EXECUTION PROTOCOL
1. **Step 1: Semantic Mapping:**
   - Map "Sales" -> `sales_amount` (or closest numeric column).
   - Map "Software" -> `product_category` (or closest text column).
   
2. **Step 2: Case-Insensitive Filtering:**
   - You do NOT know if the database stores 'Asia' or 'asia'.
   - **ALWAYS** use `LOWER()`: `WHERE LOWER(region) = 'asia'`
   - **ALWAYS** use `LOWER()`: `WHERE LOWER(product_category) = 'software'`

3. **Step 3: Final Verification:**
   - Check your generated SQL. Did you use `sales_data`? If yes, change it to `sales`.
   - Did you use `EXTRACT()`? If yes, change it to `strftime()` or `year`.

### TARGET SCHEMA
You must return a single valid JSON object with `thought_process`, `sql_query`, `visualization_config`, and `narrative`.

### FEW-SHOT EXAMPLES

**Input:**
"Show me sales for 2025."

**Output:**
{
  "thought_process": "1. User wants 'sales' (sales_amount) for '2025'. 2. Schema has a 'year' column. 3. Dialect is SQLite, so I will use the 'year' column directly to avoid date function errors.",
  "sql_query": "SELECT SUM(sales_amount) as sales_amount FROM sales WHERE year = 2025",
  "visualization_config": {
    "chart_type": "bar_chart_3d",
    "x_axis": "year",
    "y_axis": "sales_amount",
    "color_theme": "neon_blue",
    "camera_action": "zoom_in"
  },
  "narrative": "Total sales for the year 2025."
}

**Input:**
"Compare software revenue in Asia vs Europe."

**Output:**
{
  "thought_process": "1. Mapping 'revenue' to 'sales_amount'. 2. Filtering 'product_category' for 'software'. 3. Filtering 'region' for Asia/Europe. 4. Using LOWER() for all text matches.",
  "sql_query": "SELECT region, SUM(sales_amount) as sales_amount FROM sales WHERE LOWER(product_category) = 'software' AND LOWER(region) IN ('asia', 'europe') GROUP BY region",
  "visualization_config": {
    "chart_type": "bar_chart_3d",
    "x_axis": "region",
    "y_axis": "sales_amount",
    "color_theme": "neon_blue",
    "camera_action": "rotate_360"
  },
  "narrative": "Comparison of software sales between Asia and Europe."
}

### CURRENT REQUEST
**Input:**
"{{ query_input }}"

**Output:**"""

    prompt_template = PromptTemplate(
        template=template_text,
        input_variables=["query_input","db_schema"], # This name must match the {{ query_input }} above
        template_format="jinja2"
    )

    parser=PydanticOutputParser(pydantic_object=HoloGraphResponse)
    final_prompt = prompt_template.format(query_input=query,db_schema=db_context)
    
    
    response = llm.invoke(final_prompt)
    # json_string = response.content.replace("```json", "").replace("```", "").strip()
    try:
        structured_data = parser.parse(response.content)
        
        
        return {"reasoning_response": structured_data.model_dump()}
        
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


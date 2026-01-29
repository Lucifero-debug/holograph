# 🌐 Holograph - AI-Powered 3D Data Visualization Platform

Transform natural language queries into stunning 3D visualizations. Holograph combines the power of LangGraph, FastAPI, and React Three Fiber to create an intelligent data visualization assistant that understands your questions and renders beautiful 3D charts.

## ✨ Features

- **Natural Language to SQL**: Converts plain English questions into SQL queries using LLM intelligence
- **Intelligent Visualization Selection**: Automatically chooses the best 3D chart type based on your data
- **4 Stunning 3D Visualizations**:
  - 📊 3D Bar Charts
  - 🥧 3D Pie Charts  
  - 🌍 3D Globe Visualizations
  - ⚡ 3D Scatter Plots
- **Multi-Agent Workflow**: Powered by LangGraph for intelligent query processing
- **Real-time Rendering**: Interactive 3D scenes built with React Three Fiber
- **Smart Data Narratives**: AI-generated insights and summaries
- **Dynamic Camera Animations**: Automatic camera movements for engaging visualizations

## 🏗️ Architecture

```
holograph/
├── app.py                  # FastAPI backend server
├── python.py               # LangGraph workflow & agents
├── setup.py                # Database setup script
├── holograph.db            # SQLite database
└── holograph-next/         # Next.js frontend
    ├── app/                # Next.js application
    ├── public/             # Static assets
    └── package.json        # Frontend dependencies
```

### System Flow

```
User Query → LangGraph Agent → SQL Generation → Database Query → 
3D Visualization Config → React Three Fiber → Rendered 3D Scene
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- Groq API Key ([Get one here](https://console.groq.com))

### Backend Setup

1. **Navigate to the holograph directory:**
```bash
cd holograph
```

2. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**

Create a `.env` file:
```env
GROQ_API_KEY=your_groq_api_key_here
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langchain_api_key  # Optional for debugging
```

4. **Initialize the database:**
```bash
python setup.py
```

This creates `holograph.db` with sample sales and customer data.

5. **Start the FastAPI server:**
```bash
uvicorn app:app --reload
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
```bash
cd holograph-next
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Sample Queries

Try these natural language queries:

- "Show me sales for 2025"
- "Compare software revenue in Asia vs Europe"
- "What are the top 3 regions by revenue?"
- "Display sales by quarter for 2024"
- "Show me customer distribution by age group"
- "Which product category has the highest sales in North America?"

## 🤖 How It Works

### 1. Query Understanding (LangGraph Agent)

The `get_config` node analyzes your natural language query:
- Extracts intent and entities
- Maps user terms to database columns
- Determines optimal visualization type
- Generates SQLite-compatible queries

### 2. SQL Execution

The `execute_sql` node:
- Runs the generated SQL against `holograph.db`
- Fetches and formats results
- Handles errors gracefully

### 3. Visualization Rendering

React Three Fiber renders the 3D scene with:
- Dynamic chart type selection
- Custom color themes
- Animated camera movements
- Interactive controls

## 🎨 Visualization Types

### Bar Chart 3D
**Use for:** Comparisons across categories or time
```json
{
  "chart_type": "bar_chart_3d",
  "x_axis": "region",
  "y_axis": "sales_amount"
}
```

### Pie Chart 3D
**Use for:** Single metric composition (no time dimension)
```json
{
  "chart_type": "pie_3d",
  "x_axis": "category",
  "y_axis": "percentage"
}
```

### Scatter 3D
**Use for:** Distribution and correlation analysis
```json
{
  "chart_type": "scatter_3d",
  "x_axis": "metric_1",
  "y_axis": "metric_2"
}
```

### Globe 3D
**Use for:** Geographic data visualization
```json
{
  "chart_type": "globe_3d",
  "x_axis": "country",
  "y_axis": "value"
}
```

## 📚 Tech Stack

### Backend
- **FastAPI**: High-performance API framework
- **LangGraph**: Multi-agent workflow orchestration
- **LangChain**: LLM integration framework
- **Groq**: Fast LLM inference (Llama 3.3 70B)
- **SQLAlchemy**: SQL toolkit and ORM
- **SQLite**: Lightweight database
- **Pydantic**: Data validation

### Frontend
- **Next.js 16**: React framework
- **React 19**: UI library
- **React Three Fiber**: 3D rendering engine
- **Three.js**: 3D graphics library
- **@react-three/drei**: Useful 3D helpers
- **Tailwind CSS**: Styling

## 🔌 API Endpoints

### `GET /`
Health check endpoint
```json
{
  "status": "FastAPI is working 🚀"
}
```

### `POST /ask`
Submit a natural language query

**Request:**
```json
{
  "query": "Show me sales for 2025"
}
```

**Response:**
```json
{
  "status": "success",
  "config": {
    "chart_type": "bar_chart_3d",
    "x_axis": "year",
    "y_axis": "sales_amount",
    "color_theme": "neon_blue",
    "camera_action": "zoom_in"
  },
  "data": [
    {"year": 2025, "sales_amount": 125000}
  ],
  "narrative": "Total sales for the year 2025 reached $125,000.",
  "sql": "SELECT year, SUM(sales_amount) as sales_amount FROM sales WHERE year = 2025 GROUP BY year"
}
```

## 📁 Database Schema

### Sales Table
```sql
CREATE TABLE sales (
    id INTEGER PRIMARY KEY,
    region TEXT,
    country TEXT,
    product_category TEXT,
    quarter TEXT,
    year INTEGER,
    sales_amount REAL,
    revenue REAL,
    transaction_date DATE
)
```

### Customers Table
```sql
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY,
    age_group TEXT,
    signup_date DATE,
    region TEXT
)
```

## 🛠️ Development

### Adding New Data

Modify `setup.py` to add more tables or data:

```python
cursor.execute('''
    CREATE TABLE your_table (
        id INTEGER PRIMARY KEY,
        column_name TEXT
    )
''')
```

### Customizing Visualizations

Edit the LangGraph prompt in `python.py` to:
- Add new chart types
- Modify color themes
- Customize camera animations
- Change narrative styles

### Frontend Customization

Navigate to `holograph-next/app/` to modify:
- 3D scene components
- UI layouts
- Color schemes
- Interaction controls

## 🧪 Testing

### Test the backend:
```bash
# Test health endpoint
curl http://localhost:8000/

# Test query endpoint
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "Show sales for 2024"}'
```

### Test the database:
```bash
python setup.py
```

## 🔒 Security Considerations

- Never commit `.env` files with API keys
- Use environment variables for all secrets
- Implement rate limiting for production
- Add authentication for public deployments
- Sanitize user inputs before SQL execution

## 🚧 Common Issues & Solutions

### Issue: "Database not found"
**Solution:** Run `python setup.py` to create the database

### Issue: "ModuleNotFoundError"
**Solution:** Install dependencies: `pip install -r requirements.txt`

### Issue: "CORS error"
**Solution:** Check that frontend URL matches CORS settings in `app.py`

### Issue: "Invalid SQL query"
**Solution:** The LLM might need better examples - update the prompt template in `python.py`

## 📈 Performance Optimization

- Use connection pooling for database queries
- Implement caching for common queries
- Optimize 3D rendering with LOD (Level of Detail)
- Add request rate limiting
- Consider using PostgreSQL for production

## 🔮 Future Enhancements

- [ ] Add more chart types (heatmaps, network graphs)
- [ ] Implement real-time data streaming
- [ ] Add voice input for queries
- [ ] Export visualizations as images/videos
- [ ] Multi-user collaboration features
- [ ] Custom data source integration
- [ ] Mobile responsive 3D views
- [ ] Advanced filtering and drill-down

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [LangGraph](https://langchain-ai.github.io/langgraph/) for intelligent workflows
- Powered by [Groq](https://groq.com/) for lightning-fast LLM inference
- 3D visualizations by [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [documentation](docs/)
- Contact the maintainers

---

**Built with ❤️ for the future of data visualization**

Transform your data into immersive 3D experiences with the power of AI! 🚀✨

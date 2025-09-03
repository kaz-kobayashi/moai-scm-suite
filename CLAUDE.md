# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a supply chain management optimization system (scmopt) being refactored from Jupyter notebooks into a web application with FastAPI backend and React frontend.

**Core Components:**
- `nbs/`: Original Jupyter notebooks containing optimization algorithms (ABC analysis, VRP, inventory optimization)
- `webapp/`: FastAPI backend API with complete ports of notebook functionality
- `frontend/`: React TypeScript frontend for data visualization
- `core.py`: Core shared utilities including SCMGraph class and time/distance calculations

## Common Development Commands

### Frontend (React/TypeScript)
```bash
cd frontend
npm install           # Install dependencies
npm start            # Run development server (localhost:3000)
npm test             # Run tests
npm run build        # Build for production
```

### Backend (FastAPI/Python)
```bash
cd webapp
pip install -r requirements.txt    # Install dependencies
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000    # Run development server
pytest tests/ -v     # Run tests
```

### Testing
- Frontend: Uses Jest and React Testing Library
- Backend: Uses pytest with FastAPI TestClient
- All tests should pass before committing changes

## Architecture

### Backend Structure (webapp/)
- `app/main.py`: FastAPI application entry point
- `app/api/endpoints/`: API route handlers (abc.py, vrp.py)
- `app/services/`: Business logic services (ports from notebooks)
- `app/models/`: Pydantic data models for API requests/responses
- Tests follow the same structure in `tests/`

### Frontend Structure (frontend/src/)
- `components/`: React components for UI
- `services/api.ts`: API client for backend communication
- `types/index.ts`: TypeScript type definitions

### Notebooks (nbs/)
- `00core.ipynb`: Core utilities (SCMGraph, distance calculations)
- `01abc.ipynb`: ABC analysis and supply chain basic analysis
- `02metroVI.ipynb`: Vehicle routing problem (VRP) optimization
- `03inventory.ipynb`: Inventory optimization algorithms
- Additional notebooks for specialized optimization problems

## Key Technical Details

### Supply Chain Graph (SCMGraph)
- Custom NetworkX DiGraph subclass for supply chain modeling
- Methods for layered networks, topological ordering, and layout algorithms
- Used throughout optimization algorithms for network-based problems

### Optimization Algorithms
- **ABC Analysis**: Product/customer classification by importance
- **VRP (Vehicle Routing Problem)**: Multi-constraint vehicle routing with OSRM integration
- **Inventory Optimization**: Safety stock, lot sizing, and demand forecasting
- **Production Planning**: Multi-stage production optimization

### Data Processing
- Heavy use of pandas for data manipulation
- Plotly for interactive visualizations
- OSRM integration for real-world distance/time calculations
- NetworkX for graph-based optimization problems

### API Design
- RESTful endpoints under `/api/v1/`
- Comprehensive input validation with Pydantic models
- All notebook functions faithfully ported to maintain compatibility
- Rich visualization data returned for frontend plotting

## Development Notes

- The webapp is a 100% faithful port of notebook functionality - do not modify calculation logic
- Use existing patterns and libraries found in the codebase
- OSRM server required for VRP distance/time calculations (host: test-osrm-intel.aq-cloud.com)
- Mapbox token available for map visualizations
- All optimization algorithms expect specific data formats - check existing models
# CLAUDE.md

## Project Overview

### Theme
School meal information inquiry and review sharing platform

### Core Value
- Provide a space where students can easily check meal information and share opinions
- Contribute to improving meal quality through accumulated feedback data

---

## Key Features

### Priority 1 (Required Implementation)

#### School Search
- Search functionality based on school name
- Auto-display meal information for the nearest weekday in search results

#### Meal Information Display
- Separate display for breakfast, lunch, and dinner
- Date navigation (previous/next date navigation via arrows)
- Display overall average meal rating for the school

#### Review and Rating
- Star rating registration by meal type (breakfast/lunch/dinner)
- User authentication: Cookie-based simple authentication (initial version)

### Priority 1 (Optional Implementation)

#### School Location Display
- Small map display of school location via map API
- Map service: To be selected considering development convenience (Kakao Map/Naver Map, etc.)

---

## Tech Stack

### Frontend
- **Framework**: React

### Backend
- **Framework**: FastAPI (Python)
- **Primary Roles**:
  - NEIS API integration and data processing
  - Review data processing
  - Rating calculation logic

### Database
- **Platform**: Supabase
- **Stored Data**:
  - User reviews and ratings
  - Average ratings by school

### External APIs
- **NEIS Open API**: School meal information inquiry
- **Map API**: School location display (optional implementation)

---

## Deployment

- **Domain**: meal.newme.dev
- **Server Location**: `/home/kth88/services/incoding_meal/(prod/dev)`
- **Container Name**: `incoding_meal(prod/dev)`
- **Deployment Solution**: Docker Compose
- **Reverse Proxying**: Traefik
  - Traefik label configuration in docker-compose:
    ```yaml
    services:
      {NAME}:
        networks:
          - traefik-net 
        labels:
          - "traefik.enable=true"
          - "traefik.http.routers.{CONTAINER_NAME}.rule=Host(`${DOMAIN}`)"
          - "traefik.http.routers.{CONTAINER_NAME}.entrypoints=web,websecure"
          - "traefik.http.routers.{CONTAINER_NAME}.tls.certresolver=letsencrypt"
          - "traefik.http.services.{CONTAINER_NAME}.loadbalancer.server.port=${PORT}"
        ports:
          - ${PORT:-4892}:4892

    networks:
      traefik-net:
        external: true
    ```
  - Port: `4892:4892`

---

## Building and Running

### Prerequisites
- Node.js and npm
- Python 3.x
- Docker and Docker Compose

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm i
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   This will start a development server on http://localhost:3000.

3. **Build for production:**
   ```bash
   npm run build
   ```
   This will create a `build` directory with the production-ready files.

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run FastAPI server:**
   ```bash
   uvicorn main:app --reload
   ```

### Docker Deployment

```bash
docker-compose up -d
```

---

## Development Conventions

### Frontend
- **Framework**: React with Vite
- **UI Components**: Extensive use of Radix UI components for component-based UI architecture
- **Icons**: `lucide-react`
- **Charts**: `recharts`
- **Styling**: Tailwind CSS with `tailwind-merge` and `clsx` utilities
- **Recommended**: Add ESLint and Prettier for code consistency

### Backend
- **Framework**: FastAPI
- **Database ORM**: Supabase client library
- **API Integration**: NEIS Open API for meal data

### General
- Follow component-based architecture
- Maintain separation between frontend and backend
- Use environment variables for configuration
- Implement proper error handling and validation
- IF you need to make multi tasking, you can make multitask process 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel

from database import get_db
from models.saved_route import SavedRoute

router = APIRouter()

class SavedRouteCreate(BaseModel):
    user_id: str
    name: str
    start_lat: float
    start_lng: float
    start_address: str = None
    end_lat: float
    end_lng: float
    end_address: str = None

class SavedRouteResponse(SavedRouteCreate):
    id: str
    model_config = {"from_attributes": True}

@router.get("/{user_id}", response_model=List[SavedRouteResponse])
async def get_saved_routes(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavedRoute).where(SavedRoute.user_id == user_id))
    return result.scalars().all()

@router.post("/", response_model=SavedRouteResponse)
async def add_saved_route(route: SavedRouteCreate, db: AsyncSession = Depends(get_db)):
    db_route = SavedRoute(**route.model_dump())
    db.add(db_route)
    await db.commit()
    await db.refresh(db_route)
    return db_route

@router.delete("/{route_id}")
async def delete_saved_route(route_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavedRoute).where(SavedRoute.id == route_id))
    route = result.scalars().first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    await db.delete(route)
    await db.commit()
    return {"message": "Route deleted"}

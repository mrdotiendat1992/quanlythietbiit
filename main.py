from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="IT Equipment Management API")

# --- Departments API ---
@app.post("/api/departments", response_model=schemas.Department)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    db_department = models.Department(**department.model_dump())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

@app.get("/api/departments", response_model=List[schemas.Department])
def read_departments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    departments = db.query(models.Department).offset(skip).limit(limit).all()
    return departments

@app.delete("/api/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"ok": True}

# --- Equipments API ---
@app.post("/api/equipments", response_model=schemas.Equipment)
def create_equipment(equipment: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    db_equipment = models.Equipment(**equipment.model_dump())
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment

@app.get("/api/equipments", response_model=List[schemas.Equipment])
def read_equipments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    equipments = db.query(models.Equipment).offset(skip).limit(limit).all()
    return equipments

@app.delete("/api/equipments/{eq_id}")
def delete_equipment(eq_id: int, db: Session = Depends(get_db)):
    eq = db.query(models.Equipment).filter(models.Equipment.id == eq_id).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Equipment not found")
    db.delete(eq)
    db.commit()
    return {"ok": True}

# --- IT Logs API ---
@app.post("/api/logs", response_model=schemas.ITLog)
def create_log(log: schemas.ITLogCreate, db: Session = Depends(get_db)):
    db_log = models.ITLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/logs", response_model=List[schemas.ITLog])
def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ITLog).order_by(models.ITLog.date.desc()).offset(skip).limit(limit).all()
    return logs

# Serve static files for Frontend
import os
import sys

# PyInstaller uses sys._MEIPASS for the temporary extraction dir
if getattr(sys, 'frozen', False):
    application_path = sys._MEIPASS
else:
    application_path = os.path.dirname(os.path.abspath(__file__))

static_dir = os.path.join(application_path, "static")

if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    import multiprocessing
    # Freeze support for Windows environment
    multiprocessing.freeze_support()
    uvicorn.run(app, host="0.0.0.0", port=8000)

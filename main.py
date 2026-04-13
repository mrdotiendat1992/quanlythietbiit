from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from typing import List

import models
import schemas
from database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

def ensure_equipment_specs_column():
    inspector = inspect(engine)
    columns = [column["name"] for column in inspector.get_columns("equipments")]
    if "specs" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE equipments ADD COLUMN specs TEXT"))


def ensure_itlog_department_column():
    inspector = inspect(engine)
    columns = [column["name"] for column in inspector.get_columns("it_logs")]
    if "department_id" not in columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE it_logs ADD COLUMN department_id INTEGER"))


ensure_equipment_specs_column()
ensure_itlog_department_column()

app = FastAPI(title="IT Equipment Management API")

# --- Departments API ---
@app.post("/api/departments", response_model=schemas.Department)
def create_department(department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    payload = department.model_dump()
    payload["name"] = payload["name"].strip()
    if db.query(models.Department).filter(models.Department.name == payload["name"]).first():
        raise HTTPException(status_code=409, detail="Department already exists")

    db_department = models.Department(**payload)
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

@app.put("/api/departments/{dept_id}", response_model=schemas.Department)
def update_department(dept_id: int, department: schemas.DepartmentCreate, db: Session = Depends(get_db)):
    db_department = db.query(models.Department).filter(models.Department.id == dept_id).first()
    if not db_department:
        raise HTTPException(status_code=404, detail="Department not found")

    payload = department.model_dump()
    payload["name"] = payload["name"].strip()
    duplicate = db.query(models.Department).filter(models.Department.name == payload["name"], models.Department.id != dept_id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Department already exists")

    for key, value in payload.items():
        setattr(db_department, key, value)

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

@app.put("/api/equipments/{eq_id}", response_model=schemas.Equipment)
def update_equipment(eq_id: int, equipment: schemas.EquipmentCreate, db: Session = Depends(get_db)):
    db_equipment = db.query(models.Equipment).filter(models.Equipment.id == eq_id).first()
    if not db_equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    for key, value in equipment.model_dump().items():
        setattr(db_equipment, key, value)

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

@app.put("/api/logs/{log_id}", response_model=schemas.ITLog)
def update_log(log_id: int, log: schemas.ITLogCreate, db: Session = Depends(get_db)):
    db_log = db.query(models.ITLog).filter(models.ITLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Log not found")

    for key, value in log.model_dump().items():
        setattr(db_log, key, value)

    db.commit()
    db.refresh(db_log)
    return db_log

@app.get("/api/logs", response_model=List[schemas.ITLog])
def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logs = db.query(models.ITLog).order_by(models.ITLog.date.desc()).offset(skip).limit(limit).all()
    return logs

@app.delete("/api/logs/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(models.ITLog).filter(models.ITLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    db.delete(log)
    db.commit()
    return {"ok": True}

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

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)

    equipments = relationship("Equipment", back_populates="department")


class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(String, index=True)
    status = Column(String) # e.g. 'Active', 'Broken', 'Repairing'
    user_assigned = Column(String)
    
    department_id = Column(Integer, ForeignKey("departments.id"))
    department = relationship("Department", back_populates="equipments")
    logs = relationship("ITLog", back_populates="equipment")


class ITLog(Base):
    __tablename__ = "it_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.datetime.utcnow)
    it_personnel = Column(String, index=True)
    description = Column(String)
    status = Column(String) # e.g. 'Done', 'Pending'
    
    equipment_id = Column(Integer, ForeignKey("equipments.id"), nullable=True)
    equipment = relationship("Equipment", back_populates="logs")

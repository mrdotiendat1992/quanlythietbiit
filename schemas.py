from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    
    class Config:
        from_attributes = True

# ITLog Schemas
class ITLogBase(BaseModel):
    it_personnel: str
    description: str
    status: str
    equipment_id: Optional[int] = None

class ITLogCreate(ITLogBase):
    pass

class ITLog(ITLogBase):
    id: int
    date: datetime
    
    class Config:
        from_attributes = True

# Equipment Schemas
class EquipmentBase(BaseModel):
    name: str
    type: str
    status: str
    user_assigned: Optional[str] = None
    department_id: Optional[int] = None

class EquipmentCreate(EquipmentBase):
    pass

class Equipment(EquipmentBase):
    id: int
    department: Optional[Department] = None
    
    class Config:
        from_attributes = True

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional, Any
from datetime import datetime


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    college_name: Optional[str] = Field(None, max_length=150)
    living_situation: str = Field("Hostel", pattern="^(Home|Hostel|PG)$")
    monthly_allowance: float = Field(0.0, ge=0.0)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Any) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: Any) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    college_name: Optional[str] = None
    living_situation: str
    monthly_allowance: float
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    college_name: Optional[str] = None
    living_situation: Optional[str] = Field(None, pattern="^(Home|Hostel|PG)$")
    monthly_allowance: Optional[float] = Field(None, ge=0.0)
    password: Optional[str] = Field(None, min_length=6, max_length=128)

    @field_validator("password", mode="before")
    @classmethod
    def validate_empty_password(cls, v: Any):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class LogoutResponse(BaseModel):
    message: str = "Logged out successfully"


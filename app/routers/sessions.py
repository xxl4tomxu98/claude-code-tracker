from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app import models
from app.costing import estimate_cost_usd
from app.database import get_db
from auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


class SessionIn(BaseModel):
    project_id: int
    model: str
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)


class SessionOut(BaseModel):
    id: int
    project_id: int
    model: str
    input_tokens: int
    output_tokens: int
    cost_usd: float

    model_config = ConfigDict(from_attributes=True)


@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    project = (
        db.query(models.Project)
        .filter(models.Project.id == payload.project_id, models.Project.user_id == current_user.id)
        .first()
    )
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    log = models.SessionLog(
        user_id=current_user.id,
        project_id=payload.project_id,
        model=payload.model,
        input_tokens=payload.input_tokens,
        output_tokens=payload.output_tokens,
        cost_usd=estimate_cost_usd(payload.model, payload.input_tokens, payload.output_tokens),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("", response_model=list[SessionOut])
def list_sessions(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = db.query(models.SessionLog).filter(models.SessionLog.user_id == current_user.id)
    if project_id is not None:
        query = query.filter(models.SessionLog.project_id == project_id)
    return query.order_by(models.SessionLog.id.desc()).all()

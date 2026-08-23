from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(
            models.SessionLog.model,
            func.count(models.SessionLog.id),
            func.coalesce(func.sum(models.SessionLog.input_tokens), 0),
            func.coalesce(func.sum(models.SessionLog.output_tokens), 0),
            func.coalesce(func.sum(models.SessionLog.cost_usd), 0.0),
        )
        .filter(models.SessionLog.user_id == current_user.id)
        .group_by(models.SessionLog.model)
        .all()
    )

    by_model = []
    total_sessions = 0
    total_input = 0
    total_output = 0
    total_cost = 0.0
    for model, count, inp, out, cost in rows:
        by_model.append(
            {
                "model": model,
                "sessions": int(count),
                "input_tokens": int(inp),
                "output_tokens": int(out),
                "cost_usd": round(float(cost), 6),
            }
        )
        total_sessions += int(count)
        total_input += int(inp)
        total_output += int(out)
        total_cost += float(cost)

    return {
        "total_sessions": total_sessions,
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_cost_usd": round(total_cost, 6),
        "by_model": by_model,
    }

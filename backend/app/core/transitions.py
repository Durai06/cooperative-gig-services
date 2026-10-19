from fastapi import HTTPException, status

VALID_TRANSITIONS = {
    "pending": ["worker_assigned", "cancelled"],
    "worker_assigned": ["accepted", "pending", "cancelled"],
    "accepted": ["in_progress", "cancelled"],
    "in_progress": ["completed"],
}

def assert_transition(from_status: str, to_status: str):
    allowed = VALID_TRANSITIONS.get(from_status, [])
    if to_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition booking status from '{from_status}' to '{to_status}'."
        )

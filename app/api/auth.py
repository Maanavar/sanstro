from __future__ import annotations

import logging
import smtplib
from datetime import timedelta
from email.mime.text import MIMEText
from uuid import UUID, uuid4

import bcrypt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.auth import create_access_token, decode_token
from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RegisterRequest,
    UpdateUserSettingsRequest,
)

router = APIRouter()
_COOKIE_NAME = "vinaadi_token"
_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24
_logger = logging.getLogger(__name__)


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=_COOKIE_MAX_AGE_SECONDS,
        path="/",
    )


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))


def _send_password_reset_email(user_email: str, token: str) -> None:
    settings = get_settings()
    if not settings.smtp_host or not settings.notification_from_email:
        _logger.info("password_reset_stub email=%s SMTP not configured", user_email)
        return

    reset_link = f"http://localhost:3000/login?resetToken={token}"
    body = (
        "You requested a password reset for your Vinaadi AI account.\n\n"
        f"Use this link to continue: {reset_link}\n\n"
        "If you did not request this, you can ignore this message."
    )
    message = MIMEText(body, "plain", "utf-8")
    message["Subject"] = "Vinaadi AI password reset"
    message["From"] = f"{settings.notification_from_name} <{settings.notification_from_email}>"
    message["To"] = user_email

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:  # type: ignore[arg-type]
            server.ehlo()
            if settings.smtp_user and settings.smtp_pass:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_pass)
            server.sendmail(settings.notification_from_email, user_email, message.as_string())
    except Exception:
        _logger.exception("password_reset_send_failed email=%s", user_email)


@router.post("/register", response_model=AuthUserResponse)
def register(
    payload: RegisterRequest,
    response: Response,
    session: Session = Depends(get_db),
) -> AuthUserResponse:
    existing = session.query(User).filter(User.email == payload.email).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    user = User(
        user_id=uuid4(),
        email=payload.email,
        hashed_password=_hash_password(payload.password),
    )
    session.add(user)
    session.flush()

    token = create_access_token(subject=str(user.user_id))
    _set_auth_cookie(response, token)
    return AuthUserResponse(userId=str(user.user_id), email=user.email or payload.email, userMode="BALANCED", goalTrack=None)


@router.post("/login", response_model=AuthUserResponse)
def login(
    payload: LoginRequest,
    response: Response,
    session: Session = Depends(get_db),
) -> AuthUserResponse:
    user = session.query(User).filter(User.email == payload.email).first()
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
    )

    if user is None or not user.hashed_password:
        raise invalid_credentials
    if not _verify_password(payload.password, user.hashed_password):
        raise invalid_credentials

    token = create_access_token(subject=str(user.user_id))
    _set_auth_cookie(response, token)
    return AuthUserResponse(userId=str(user.user_id), email=user.email or payload.email, userMode="BALANCED", goalTrack=None)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    response.delete_cookie(key=_COOKIE_NAME, path="/")
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=AuthUserResponse)
def me(
    session: Session = Depends(get_db),
    vinaadi_token: str | None = Cookie(default=None),
) -> AuthUserResponse:
    if not vinaadi_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    payload = decode_token(vinaadi_token)
    sub: str | None = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    try:
        user_id = UUID(sub)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.") from exc

    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    if user.email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    return AuthUserResponse(
        userId=str(user.user_id),
        email=user.email,
        userMode=getattr(user, "user_mode", "BALANCED") or "BALANCED",
        goalTrack=getattr(user, "goal_track", None),
    )


@router.patch("/me", response_model=AuthUserResponse)
def patch_me(
    payload: UpdateUserSettingsRequest,
    session: Session = Depends(get_db),
    vinaadi_token: str | None = Cookie(default=None),
) -> AuthUserResponse:
    if not vinaadi_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    token_payload = decode_token(vinaadi_token)
    sub: str | None = token_payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    try:
        user_id = UUID(sub)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.") from exc

    user = session.get(User, user_id)
    if user is None or user.email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")

    if payload.user_mode is not None:
        user.user_mode = payload.user_mode
    if payload.goal_track is not None:
        user.goal_track = payload.goal_track
    session.flush()

    return AuthUserResponse(
        userId=str(user.user_id),
        email=user.email,
        userMode=user.user_mode or "BALANCED",
        goalTrack=user.goal_track,
    )


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    session: Session = Depends(get_db),
) -> ForgotPasswordResponse:
    user = session.query(User).filter(User.email == payload.email).first()
    if user and user.email:
        reset_token = create_access_token(subject=str(user.user_id), expires_delta=timedelta(minutes=30))
        _send_password_reset_email(user.email, reset_token)
    return ForgotPasswordResponse(
        detail="If an account exists for this email, you will receive a password reset link shortly."
    )

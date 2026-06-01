from __future__ import annotations

from datetime import time

from pydantic import BaseModel, ConfigDict, Field


class NotificationPreferenceData(BaseModel):
    notification_channel: str = Field(description="none | email | push | both")
    morning_alert_enabled: bool = Field(alias="morningAlertEnabled")
    morning_alert_time: str = Field(alias="morningAlertTime", description="HH:MM local time")
    dasha_alert_enabled: bool = Field(alias="dashaAlertEnabled")
    pirantha_naal_alert_enabled: bool = Field(alias="piranthaNaalAlertEnabled")
    smart_silence_enabled: bool = Field(alias="smartSilenceEnabled")
    fcm_token_registered: bool = Field(alias="fcmTokenRegistered")

    model_config = ConfigDict(populate_by_name=True)


class NotificationPreferenceResponse(BaseModel):
    success: bool = True
    data: NotificationPreferenceData

    model_config = ConfigDict(populate_by_name=True)


class NotificationPreferenceUpdateRequest(BaseModel):
    notification_channel: str | None = Field(default=None, alias="notificationChannel")
    morning_alert_enabled: bool | None = Field(default=None, alias="morningAlertEnabled")
    morning_alert_time: str | None = Field(default=None, alias="morningAlertTime", description="HH:MM")
    dasha_alert_enabled: bool | None = Field(default=None, alias="dashaAlertEnabled")
    pirantha_naal_alert_enabled: bool | None = Field(default=None, alias="piranthaNaalAlertEnabled")
    smart_silence_enabled: bool | None = Field(default=None, alias="smartSilenceEnabled")

    model_config = ConfigDict(populate_by_name=True)


class FcmTokenUpdateRequest(BaseModel):
    # Accept either {fcmDeviceToken: "..."} (legacy) or {token: "...", platform: "..."} (web SDK)
    fcm_device_token: str | None = Field(default=None, alias="fcmDeviceToken", min_length=10, max_length=512)
    token: str | None = Field(default=None, min_length=10, max_length=512)
    platform: str | None = Field(default=None)

    model_config = ConfigDict(populate_by_name=True)

    def resolved_token(self) -> str:
        t = self.fcm_device_token or self.token
        if not t:
            raise ValueError("FCM token is required (provide fcmDeviceToken or token)")
        return t

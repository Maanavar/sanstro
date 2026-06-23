import { Stack } from "expo-router";
import { ProfileManagerScreen } from "@/screens/ProfileManager";

export default function ProfileManagerPage() {
  return (
    <>
      <Stack.Screen options={{ title: "Manage Profiles", headerShown: true }} />
      <ProfileManagerScreen />
    </>
  );
}

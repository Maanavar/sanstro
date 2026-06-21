import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PRIMARY_CHART_ID = "vinaadi_primary_chart_id";
const KEY_PRIMARY_PROFILE_ID = "vinaadi_primary_profile_id";

export async function setPrimaryChartId(chartId: string): Promise<void> {
  await AsyncStorage.setItem(KEY_PRIMARY_CHART_ID, chartId);
}

export async function getPrimaryChartId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_PRIMARY_CHART_ID);
}

export async function setPrimaryProfileId(profileId: string): Promise<void> {
  await AsyncStorage.setItem(KEY_PRIMARY_PROFILE_ID, profileId);
}

export async function getPrimaryProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(KEY_PRIMARY_PROFILE_ID);
}

export async function clearUserPrefs(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_PRIMARY_CHART_ID, KEY_PRIMARY_PROFILE_ID]);
}

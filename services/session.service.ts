import AsyncStorage from "@react-native-async-storage/async-storage";
import { LoggedInUser } from "../context/AuthContext";

const SESSION_KEY = "smartpos_user";

class SessionService {
  async saveUser(user: LoggedInUser) {
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify(user)
    );
  }

  async getUser(): Promise<LoggedInUser | null> {
    const data = await AsyncStorage.getItem(SESSION_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  }

  async clearUser() {
    await AsyncStorage.removeItem(SESSION_KEY);
  }
}

export default new SessionService();
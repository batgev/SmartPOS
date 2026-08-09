import { getDatabase } from "../database/sqlite";
import { verifyPassword, hashPassword } from "../utils/password";

export type User = {
  id: number;
  username: string;
  password: string;
  password_salt: string | null;
  fullName: string;
  role: string;
  createdAt: string;
};

type UserRow = {
  id: number;
  username: string;
  password: string;
  password_salt: string | null;
  fullName: string;
  role: string;
  createdAt: string;
};

export type CreateUserData = {
  username: string;
  password: string;
  fullName: string;
  role: string;
};

class UserService {
  async login(
    username: string,
    password: string
  ): Promise<User | null> {
    console.log("🔐 LOGIN STARTED");

    const db = await getDatabase();

    console.log("✅ DATABASE READY");

    const users = await db.getAllAsync<UserRow>(
      `
      SELECT
        id,
        username,
        password,
        password_salt,
        full_name AS fullName,
        role,
        created_at AS createdAt
      FROM users
      WHERE username = ?
      LIMIT 1;
      `,
      [username.trim()]
    );

    console.log("✅ DATABASE QUERY COMPLETED");

    const user = users.length > 0 ? users[0] : null;

    console.log("USER FOUND:", user);

    if (!user) {
      return null;
    }

    if (!user.password_salt) {
      console.log("❌ USER HAS NO PASSWORD SALT");
      return null;
    }

    console.log("🔐 STARTING PASSWORD VERIFICATION");

    const passwordMatches = await verifyPassword(
      password,
      user.password,
      user.password_salt
    );

    console.log("PASSWORD MATCH:", passwordMatches);

    if (!passwordMatches) {
      console.log("❌ PASSWORD DOES NOT MATCH");
      return null;
    }

    console.log("✅ LOGIN SUCCESSFUL");

    return {
      id: user.id,
      username: user.username,
      password: user.password,
      password_salt: user.password_salt,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async getUsers(): Promise<User[]> {
    console.log("👥 LOADING USERS");

    const db = await getDatabase();

    const users = await db.getAllAsync<UserRow>(
      `
      SELECT
        id,
        username,
        password,
        password_salt,
        full_name AS fullName,
        role,
        created_at AS createdAt
      FROM users
      ORDER BY full_name ASC;
      `
    );

    console.log("✅ USERS LOADED:", users.length);

    return users;
  }

  async createUser(
    data: CreateUserData
  ): Promise<User> {
    const db = await getDatabase();

    const username = data.username.trim();
    const fullName = data.fullName.trim();

    if (!username) {
      throw new Error("Username is required.");
    }

    if (!fullName) {
      throw new Error("Full name is required.");
    }

    if (!data.password) {
      throw new Error("Password is required.");
    }

    const existingUsers =
      await db.getAllAsync<{ id: number }>(
        `
        SELECT id
        FROM users
        WHERE username = ?
        LIMIT 1;
        `,
        [username]
      );

    if (existingUsers.length > 0) {
      throw new Error(
        "A user with this username already exists."
      );
    }

    console.log("🔐 HASHING NEW USER PASSWORD");

    const { hash, salt } =
      await hashPassword(data.password);

    console.log("✅ NEW USER PASSWORD HASHED");

    const result = await db.runAsync(
      `
      INSERT INTO users (
        username,
        password,
        password_salt,
        full_name,
        role
      )
      VALUES (?, ?, ?, ?, ?);
      `,
      [
        username,
        hash,
        salt,
        fullName,
        data.role,
      ]
    );

    console.log(
      "✅ USER CREATED:",
      result.lastInsertRowId
    );

    const createdUsers =
      await db.getAllAsync<UserRow>(
        `
        SELECT
          id,
          username,
          password,
          password_salt,
          full_name AS fullName,
          role,
          created_at AS createdAt
        FROM users
        WHERE id = ?
        LIMIT 1;
        `,
        [result.lastInsertRowId]
      );

    if (createdUsers.length === 0) {
      throw new Error(
        "User was created but could not be retrieved."
      );
    }

    return createdUsers[0];
  }
    async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const db = await getDatabase();

    const users = await db.getAllAsync<UserRow>(
      `
      SELECT
        id,
        username,
        password,
        password_salt,
        full_name AS fullName,
        role,
        created_at AS createdAt
      FROM users
      WHERE id = ?
      LIMIT 1;
      `,
      [userId]
    );

    if (users.length === 0) {
      throw new Error("User not found.");
    }

    const user = users[0];

    if (!user.password_salt) {
      throw new Error(
        "This user does not have a valid password."
      );
    }

    const currentPasswordMatches =
      await verifyPassword(
        currentPassword,
        user.password,
        user.password_salt
      );

    if (!currentPasswordMatches) {
      throw new Error(
        "Current password is incorrect."
      );
    }

    if (newPassword.length < 6) {
      throw new Error(
        "New password must be at least 6 characters."
      );
    }

    const { hash, salt } =
      await hashPassword(newPassword);

    await db.runAsync(
      `
      UPDATE users
      SET
        password = ?,
        password_salt = ?
      WHERE id = ?;
      `,
      [hash, salt, userId]
    );

    console.log(
      "✅ PASSWORD CHANGED SUCCESSFULLY"
    );
  }
  async deleteUser(
  userId: number,
  currentUserId: number
): Promise<void> {
  const db = await getDatabase();

  if (userId === currentUserId) {
    throw new Error(
      "You cannot remove your own account."
    );
  }

  const users = await db.getAllAsync<{
    id: number;
    role: string;
  }>(
    `
    SELECT
      id,
      role
    FROM users;
    `
  );

  const userToDelete = users.find(
    (item) => item.id === userId
  );

  if (!userToDelete) {
    throw new Error("User not found.");
  }

  if (userToDelete.role === "admin") {
    const adminCount = users.filter(
      (item) => item.role === "admin"
    ).length;

    if (adminCount <= 1) {
      throw new Error(
        "The last administrator cannot be removed."
      );
    }
  }

  await db.runAsync(
    `
    DELETE FROM users
    WHERE id = ?;
    `,
    [userId]
  );

  console.log(
    "✅ USER DELETED:",
    userId
  );
}
}

export default new UserService();
import User from "../models/User.js";

export const USERS_TO_SEED = [
  {
    email: "test@gmail.com",
    password: "traceadmin@123",
    firstName: "Trace",
    lastName: "Admin",
    role: "admin",
    legacyEmails: ["email-test@gmail.com"],
  },
  {
    email: "user@gmail.com",
    password: "admintls123",
    firstName: "Admintls",
    lastName: "User",
    role: "user",
    legacyEmails: ["admintls@123", "admin@123"],
  },
  {
    email: "testing-user@gmail.com",
    password: "user@123",
    firstName: "Testing",
    lastName: "User",
    role: "user",
    legacyEmails: [],
  },
];

async function upsertUser({
  email,
  password,
  firstName,
  lastName,
  role,
  legacyEmails = [],
}) {
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.firstName = firstName;
    existing.lastName = lastName;
    existing.role = role;
    existing.password = password;
    await existing.save();
    return { action: "updated", email: normalizedEmail, role };
  }

  // If the user was previously created with a different email, update it.
  const legacyNormalized = legacyEmails
    .map((e) => String(e || "").trim().toLowerCase())
    .filter(Boolean);
  if (legacyNormalized.length > 0) {
    const legacyUser = await User.findOne({ email: { $in: legacyNormalized } });
    if (legacyUser) {
      legacyUser.email = normalizedEmail;
      legacyUser.firstName = firstName;
      legacyUser.lastName = lastName;
      legacyUser.role = role;
      legacyUser.password = password;
      await legacyUser.save();
      return { action: "migrated", email: normalizedEmail, role };
    }
  }

  await User.create({
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    role,
  });

  return { action: "created", email: normalizedEmail, role };
}

export async function seedUsers({ users = USERS_TO_SEED } = {}) {
  const results = [];
  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await upsertUser(user));
  }
  return results;
}

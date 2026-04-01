import { getDb } from "../db";

export type UserProfile = {
  chat_id: number;
  name: string;
  timezone: string;
  about: string;
  onboarding_done: number;
  extra_facts: string;
  created_at: string;
  updated_at: string;
};

export const ProfileService = {
  get: (chatId: number): UserProfile | null => {
    const db = getDb();
    return db.prepare("SELECT * FROM user_profile WHERE chat_id = ?").get(chatId) as UserProfile | null;
  },

  getOrCreate: (chatId: number): UserProfile => {
    const existing = ProfileService.get(chatId);
    if (existing) return existing;

    const db = getDb();
    db.prepare(`INSERT OR IGNORE INTO user_profile (chat_id) VALUES (?)`).run(chatId);
    return ProfileService.get(chatId)!;
  },

  update: (chatId: number, fields: Partial<Omit<UserProfile, "chat_id" | "created_at">>): void => {
    const db = getDb();
    const sets = Object.keys(fields)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(fields);
    db.prepare(`UPDATE user_profile SET ${sets}, updated_at = datetime('now', 'localtime') WHERE chat_id = ?`).run(...values, chatId);
  },

  addFact: (chatId: number, fact: string): void => {
    const profile = ProfileService.getOrCreate(chatId);
    const existing = profile.extra_facts ? profile.extra_facts.split("\n").filter(Boolean) : [];
    existing.push(fact.trim());
    const unique = [...new Set(existing)];
    ProfileService.update(chatId, { extra_facts: unique.join("\n") });
  },

  clearFacts: (chatId: number): void => {
    ProfileService.update(chatId, { extra_facts: "" });
  },

  resetProfile: (chatId: number): void => {
    const db = getDb();
    db.prepare("DELETE FROM user_profile WHERE chat_id = ?").run(chatId);
  },

  buildSystemContext: (chatId: number): string => {
    const profile = ProfileService.get(chatId);
    if (!profile) return "";

    const parts: string[] = [];
    if (profile.name) parts.push(`Пользователя зовут: ${profile.name}`);
    if (profile.timezone) parts.push(`Часовой пояс: ${profile.timezone}`);
    if (profile.about) parts.push(`О пользователе: ${profile.about}`);
    if (profile.extra_facts) {
      const facts = profile.extra_facts.split("\n").filter(Boolean);
      if (facts.length > 0) {
        parts.push(`Запомненные факты:\n${facts.map((f) => `- ${f}`).join("\n")}`);
      }
    }
    return parts.length > 0 ? parts.join("\n") : "";
  },

  isOnboardingDone: (chatId: number): boolean => {
    const profile = ProfileService.get(chatId);
    return !!profile?.onboarding_done;
  },

  markOnboardingDone: (chatId: number): void => {
    ProfileService.getOrCreate(chatId);
    ProfileService.update(chatId, { onboarding_done: 1 });
  },
};

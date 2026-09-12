import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const learningProgress = sqliteTable("learning_progress", {
  userId: text("user_id").primaryKey(),
  stateJson: text("state_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

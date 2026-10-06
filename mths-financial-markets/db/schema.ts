import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const siteContent=sqliteTable('site_content',{id:integer('id').primaryKey(),body:text('body').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull()});

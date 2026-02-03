import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  posts: defineTable({
    id: v.string(),
    title: v.string(),
    body: v.string(),
  }).index('id', ['id']),

  // Todos table for CRUD demo
  // Note: Convex automatically generates `_id` (unique identifier) and
  // `_creationTime` (timestamp) fields for every document - no need to define them!
  todos: defineTable({
    title: v.string(), // The todo item text
    completed: v.boolean(), // Whether the todo is done
  }),
})

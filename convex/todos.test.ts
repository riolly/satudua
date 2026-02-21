import { convexTest } from 'convex-test'
import { expect, test, describe } from 'vitest'
import { api } from './_generated/api'
import schema from './schema'
import { modules } from './test.setup'

/**
 * Unit tests for Todo CRUD operations using convex-test
 *
 * These tests run in isolation without needing the full app or browser.
 * Each test gets a fresh database state.
 */

describe('Todos CRUD', () => {
  test('list returns empty array initially', async () => {
    const t = convexTest(schema, modules)
    const todos = await t.query(api.todos.list)
    expect(todos).toEqual([])
  })

  test('create adds a new todo', async () => {
    const t = convexTest(schema, modules)

    // Create a todo
    const todoId = await t.mutation(api.todos.create, { title: 'Buy groceries' })

    // Verify it was created
    expect(todoId).toBeDefined()

    // Fetch all todos
    const todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(1)
    expect(todos[0]).toMatchObject({
      title: 'Buy groceries',
      completed: false,
    })
  })

  test('create multiple todos and list returns them in descending order', async () => {
    const t = convexTest(schema, modules)

    // Create multiple todos
    await t.mutation(api.todos.create, { title: 'First todo' })
    await t.mutation(api.todos.create, { title: 'Second todo' })
    await t.mutation(api.todos.create, { title: 'Third todo' })

    // Fetch all todos - should be in descending order (newest first)
    const todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(3)

    // Newest should be first
    expect(todos[0].title).toBe('Third todo')
    expect(todos[1].title).toBe('Second todo')
    expect(todos[2].title).toBe('First todo')
  })

  test('toggleComplete flips completed status', async () => {
    const t = convexTest(schema, modules)

    // Create a todo (initially not completed)
    const todoId = await t.mutation(api.todos.create, { title: 'Test toggle' })

    // Verify initial state
    let todos = await t.query(api.todos.list)
    expect(todos[0].completed).toBe(false)

    // Toggle to completed
    await t.mutation(api.todos.toggleComplete, { id: todoId })

    todos = await t.query(api.todos.list)
    expect(todos[0].completed).toBe(true)

    // Toggle back to not completed
    await t.mutation(api.todos.toggleComplete, { id: todoId })

    todos = await t.query(api.todos.list)
    expect(todos[0].completed).toBe(false)
  })

  test('toggleComplete throws error for non-existent todo', async () => {
    const t = convexTest(schema, modules)

    // Create a todo first to get a valid-looking ID format, then delete it
    const todoId = await t.mutation(api.todos.create, { title: 'Temp' })
    await t.mutation(api.todos.remove, { id: todoId })

    // Try to toggle the deleted todo
    await expect(
      t.mutation(api.todos.toggleComplete, { id: todoId })
    ).rejects.toThrow('Todo not found')
  })

  test('remove deletes a todo', async () => {
    const t = convexTest(schema, modules)

    // Create a todo
    const todoId = await t.mutation(api.todos.create, { title: 'To be deleted' })

    // Verify it exists
    let todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(1)

    // Delete it
    await t.mutation(api.todos.remove, { id: todoId })

    // Verify it's gone
    todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(0)
  })

  test('remove only deletes the specified todo', async () => {
    const t = convexTest(schema, modules)

    // Create multiple todos
    await t.mutation(api.todos.create, { title: 'Keep this' })
    const todo2 = await t.mutation(api.todos.create, { title: 'Delete this' })
    await t.mutation(api.todos.create, { title: 'Keep this too' })

    // Delete only the middle one
    await t.mutation(api.todos.remove, { id: todo2 })

    // Verify only the correct one was deleted
    const todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(2)
    expect(todos.map((t) => t.title)).toContain('Keep this')
    expect(todos.map((t) => t.title)).toContain('Keep this too')
    expect(todos.map((t) => t.title)).not.toContain('Delete this')
  })

  test('full CRUD workflow', async () => {
    const t = convexTest(schema, modules)

    // Create
    const todoId = await t.mutation(api.todos.create, { title: 'Workflow test' })
    let todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(1)
    expect(todos[0].completed).toBe(false)

    // Update (toggle)
    await t.mutation(api.todos.toggleComplete, { id: todoId })
    todos = await t.query(api.todos.list)
    expect(todos[0].completed).toBe(true)

    // Delete
    await t.mutation(api.todos.remove, { id: todoId })
    todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(0)
  })
})

describe('Todos with direct database access', () => {
  test('can seed data and query', async () => {
    const t = convexTest(schema, modules)

    // Seed data directly using ctx.db
    await t.run(async (ctx) => {
      await ctx.db.insert('todos', { title: 'Seeded todo 1', completed: false })
      await ctx.db.insert('todos', { title: 'Seeded todo 2', completed: true })
    })

    // Query using the API
    const todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(2)

    // Verify we have one completed and one not
    const completedCount = todos.filter((t) => t.completed).length
    expect(completedCount).toBe(1)
  })
})

describe('Todos cleanup', () => {
  test('clearAll removes all todos', async () => {
    const t = convexTest(schema, modules)

    // Create some todos
    await t.mutation(api.todos.create, { title: 'Todo 1' })
    await t.mutation(api.todos.create, { title: 'Todo 2' })
    await t.mutation(api.todos.create, { title: 'Todo 3' })

    // Verify they exist
    let todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(3)

    // Clear all
    const result = await t.mutation(api.todos.clearAll, {})
    expect(result.deleted).toBe(3)

    // Verify they're gone
    todos = await t.query(api.todos.list)
    expect(todos).toHaveLength(0)
  })

  test('clearAll returns 0 when no todos exist', async () => {
    const t = convexTest(schema, modules)

    const result = await t.mutation(api.todos.clearAll, {})
    expect(result.deleted).toBe(0)
  })
})

/**
 * Todo CRUD Demo Page
 *
 * This page demonstrates how to use Convex with TanStack Query (React Query).
 *
 * Key integration concepts:
 *
 * 1. DATA FETCHING with `convexQuery()`
 *    - Bridges Convex queries with TanStack Query's caching/state management
 *    - `convexQuery(api.todos.list, {})` creates a query config object
 *    - The `api` object is auto-generated from your Convex functions with full type safety
 *
 * 2. PREFETCHING in `loader`
 *    - `ensureQueryData()` prefetches data during route loading
 *    - This enables instant page renders (no loading spinners on navigation)
 *
 * 3. REACTIVE QUERIES with `useSuspenseQuery()`
 *    - Automatically re-fetches when Convex data changes
 *    - Combined with React Suspense for cleaner loading states
 *
 * 4. MUTATIONS with `useMutation()` from convex/react
 *    - Used for create, update, delete operations
 *    - Convex handles optimistic updates and cache invalidation automatically!
 */

import { api } from 'convex/_generated/api'
import { convexQuery } from '@convex-dev/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'

export const Route = createFileRoute('/todos')({
  // Prefetch todos data when navigating to this route
  // This ensures the data is ready before the component renders
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      ...convexQuery(api.todos.list, {}),
    })
  },
  component: TodosComponent,
})

function TodosComponent() {
  // useSuspenseQuery provides reactive data fetching
  // When ANY client creates/updates/deletes a todo, this automatically re-fetches!
  // This is the magic of Convex's real-time sync
  const { data: todos } = useSuspenseQuery(convexQuery(api.todos.list, {}))

  // Convex mutations - these are type-safe functions that modify data
  // The `api.todos.create` path is auto-generated from convex/todos.ts
  const createTodo = useMutation(api.todos.create)
  const toggleTodo = useMutation(api.todos.toggleComplete)
  const deleteTodo = useMutation(api.todos.remove)

  const [newTodoTitle, setNewTodoTitle] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTodoTitle.trim()) return

    // Call the mutation - Convex handles everything else
    await createTodo({ title: newTodoTitle.trim() })
    setNewTodoTitle('')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Todo List (Convex CRUD Demo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Todo Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="What needs to be done?"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!newTodoTitle.trim()}>
              Add
            </Button>
          </form>

          {/* Todo List */}
          <ul className="space-y-2">
            {todos.length === 0 ? (
              <li className="text-center text-muted-foreground py-4">
                No todos yet. Add one above!
              </li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo._id} // Convex auto-generates _id for every document
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  {/* Checkbox to toggle completion */}
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo({ id: todo._id })}
                    className="h-5 w-5 rounded border-gray-300 cursor-pointer"
                  />

                  {/* Todo title with strikethrough when completed */}
                  <span
                    className={`flex-1 ${
                      todo.completed
                        ? 'line-through text-muted-foreground'
                        : ''
                    }`}
                  >
                    {todo.title}
                  </span>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo({ id: todo._id })}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </li>
              ))
            )}
          </ul>

          {/* Show count */}
          {todos.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {todos.filter((t) => !t.completed).length} of {todos.length} remaining
            </p>
          )}
        </CardContent>
      </Card>

      {/* Educational note */}
      <p className="mt-4 text-sm text-muted-foreground text-center">
        Try opening this page in two browser tabs - changes sync automatically!
      </p>
    </div>
  )
}

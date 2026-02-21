import { test, expect, type Page } from '@playwright/test'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'

/**
 * Todo Feature E2E Tests
 *
 * These tests focus on UI interactions. The Convex backend logic is tested
 * separately in convex/todos.test.ts using convex-test.
 *
 * Run with: pnpm test:e2e
 *
 * Prerequisites:
 * - Dev server running on localhost:3001 (pnpm dev)
 * - Convex backend running
 */

// Convex client for cleanup - uses local dev server
const convexUrl = process.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210'
const convex = new ConvexHttpClient(convexUrl)

// Helper to wait for the todo page to be fully loaded (Convex connected)
async function waitForTodosPageReady(page: Page) {
  // Wait for the input to be visible - this means Suspense resolved and Convex is connected
  await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible({
    timeout: 15000,
  })
}

// Helper to type into input using keyboard simulation
async function typeIntoInput(page: Page, text: string) {
  const input = page.getByPlaceholder('What needs to be done?')

  // Wait for input to be ready
  await expect(input).toBeVisible()

  // Clear using triple-click to select all, then type
  await input.click({ clickCount: 3 })
  await page.waitForTimeout(50)

  // Type the new text (this will replace any selected text)
  await page.keyboard.type(text, { delay: 20 })
}

// Helper to create a todo and wait for it to appear
async function createTodo(page: Page, title: string) {
  const addButton = page.getByRole('button', { name: 'Add' })

  // Type into input using keyboard
  await typeIntoInput(page, title)

  // Wait for button to become enabled (React state updated)
  await expect(addButton).toBeEnabled({ timeout: 5000 })

  // Click add
  await addButton.click()

  // Wait for the todo to appear in the list
  await expect(page.getByText(title)).toBeVisible({ timeout: 10000 })

  // Wait for input to be cleared (mutation completed)
  await expect(page.getByPlaceholder('What needs to be done?')).toHaveValue(
    '',
    {
      timeout: 5000,
    },
  )
}

test.describe('Todo Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the todos page before each test
    await page.goto('/todos')
    // Wait for Convex to connect and page to be fully ready
    await waitForTodosPageReady(page)
  })

  // Clean up all todos after all tests in this describe block
  test.afterAll(async () => {
    const result = await convex.mutation(api.todos.clearAll, {})
    console.log(`Cleaned up ${result.deleted} todos after tests`)
  })

  test('should display the todo page with form and list', async ({ page }) => {
    // Check that the input form is present
    await expect(page.getByPlaceholder('What needs to be done?')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible()
    // Check that the card title is present (CardTitle renders as div, not heading)
    await expect(page.getByText('Todo List')).toBeVisible()
  })

  test('should create a new todo', async ({ page }) => {
    const todoTitle = `Test todo ${Date.now()}`

    // Create a todo
    await createTodo(page, todoTitle)

    // Verify the todo appears in the list
    await expect(page.getByText(todoTitle)).toBeVisible()
  })

  test('should not create a todo with empty title', async ({ page }) => {
    // The Add button should be disabled when input is empty
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled()

    // Type only spaces using keyboard
    await typeIntoInput(page, '   ')

    // Button should still be disabled (spaces only)
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled()
  })

  test('should toggle todo completion', async ({ page }) => {
    const todoTitle = `Toggle test ${Date.now()}`

    // Create a new todo first
    await createTodo(page, todoTitle)

    // Find the checkbox for this todo and click it
    const todoItem = page.locator('li').filter({ hasText: todoTitle })
    const checkbox = todoItem.locator('input[type="checkbox"]')

    // Initially unchecked
    await expect(checkbox).not.toBeChecked()

    // Click to complete
    await checkbox.click()
    await expect(checkbox).toBeChecked({ timeout: 5000 })

    // The text should have strikethrough (line-through class)
    await expect(todoItem.locator('span.flex-1')).toHaveClass(/line-through/, {
      timeout: 5000,
    })

    // Click again to uncomplete
    await checkbox.click()
    await expect(checkbox).not.toBeChecked({ timeout: 5000 })
    await expect(todoItem.locator('span.flex-1')).not.toHaveClass(
      /line-through/,
      { timeout: 5000 },
    )
  })

  test('should delete a todo', async ({ page }) => {
    const todoTitle = `Delete test ${Date.now()}`

    // Create a new todo first
    await createTodo(page, todoTitle)

    // Find and click the delete button for this todo
    const todoItem = page.locator('li').filter({ hasText: todoTitle })
    await todoItem.getByRole('button', { name: 'Delete' }).click()

    // Verify the todo is removed
    await expect(page.getByText(todoTitle)).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Todo Navigation', () => {
  test('should navigate to todos page from nav link', async ({ page }) => {
    // Start at home page
    await page.goto('/')

    // Wait for page to load
    await expect(page.getByRole('link', { name: 'Todos' })).toBeVisible()

    // Click the Todos link in navigation
    await page.getByRole('link', { name: 'Todos' }).click()

    // Verify we're on the todos page
    await expect(page).toHaveURL('/todos')

    // Wait for the page to be fully ready
    await waitForTodosPageReady(page)
  })

  test('should highlight active nav link', async ({ page }) => {
    await page.goto('/todos')

    // Wait for page to be ready
    await waitForTodosPageReady(page)

    // The Todos link should have the font-bold class when active
    const todosLink = page.getByRole('link', { name: 'Todos' })
    await expect(todosLink).toHaveClass(/font-bold/)
  })
})

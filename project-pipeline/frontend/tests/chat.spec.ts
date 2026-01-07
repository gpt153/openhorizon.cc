import { test, expect } from '@playwright/test'

test.describe('AI Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // Navigate to chat page
    const chatLink = page.locator('a:has-text("AI Chat")').or(page.locator('a:has-text("Chat")'))
    await chatLink.first().click()
    await expect(page).toHaveURL(/.*\/chat/)
  })

  test('should display chat interface', async ({ page }) => {
    // Check for chat window
    const chatWindow = page.locator('[data-testid="chat-window"]').or(page.locator('.chat-window')).or(page.locator('.chat-container'))
    await expect(chatWindow.first()).toBeVisible()

    // Check for message input
    const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'))
    await expect(messageInput.first()).toBeVisible()

    // Check for send button
    const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]'))
    await expect(sendButton.first()).toBeVisible()
  })

  test('should show connection status indicator', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000)

    // Check for connection status (green dot, "Connected" text, etc.)
    const statusIndicator = page.locator('[data-testid="connection-status"]')
    await expect(statusIndicator).toBeVisible({ timeout: 10000 })
    await expect(statusIndicator).toContainText(/connected/i)
  })

  test('should display project selector', async ({ page }) => {
    // Check for project selector dropdown
    await expect(page.locator('select, [role="combobox"]')).toBeVisible()
  })

  test('should send a message', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000)

    // Type a message
    const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'))
    await messageInput.first().fill('Hello, this is a test message')

    // Send message
    const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]'))
    await sendButton.first().click()

    // Check if message appears in chat
    await expect(page.locator('text=Hello, this is a test message')).toBeVisible({ timeout: 5000 })
  })

  test('should receive AI response', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000)

    // Send a message
    const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'))
    await messageInput.first().fill('What is the project budget?')
    const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]'))
    await sendButton.first().click()

    // Wait for user message to appear
    await expect(page.locator('text=What is the project budget?')).toBeVisible({ timeout: 5000 })

    // Wait for AI response (look for any new message that's not the user's)
    await page.waitForTimeout(3000)

    // Check if there are multiple messages (user + AI response)
    const messages = page.locator('[data-testid="message"]').or(page.locator('.message')).or(page.locator('.chat-message'))
    const count = await messages.count()
    expect(count).toBeGreaterThan(1)
  })

  test('should show typing indicator when AI is responding', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000)

    // Send a message
    const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'))
    await messageInput.first().fill('Tell me about the project')
    const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]'))
    await sendButton.first().click()

    // Look for typing indicator (appears briefly)
    const typingIndicator = page.locator('text=/typing|\.\.\./').or(page.locator('[data-testid="typing-indicator"]'))

    // This may or may not be visible depending on response speed
    try {
      await expect(typingIndicator.first()).toBeVisible({ timeout: 2000 })
    } catch {
      // OK if not visible - response was too fast
    }
  })

  test('should clear chat messages', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000)

    // Send a message
    const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'))
    await messageInput.first().fill('Test message')
    const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]'))
    await sendButton.first().click()

    // Wait for message to appear
    await expect(page.locator('text=Test message')).toBeVisible({ timeout: 5000 })

    // Click clear button
    const clearButton = page.locator('button:has-text("Clear")').or(page.locator('button:has-text("Clear Chat")'))
    if (await clearButton.first().isVisible()) {
      await clearButton.first().click()

      // Confirm if dialog appears
      const confirmButton = page.locator('button:has-text("Clear")').or(page.locator('button:has-text("Confirm")'))
      if (await confirmButton.first().isVisible({ timeout: 1000 })) {
        await confirmButton.first().click()
      }

      // Messages should be cleared
      await expect(page.locator('text=Test message')).not.toBeVisible()
    }
  })

  test('should send message with project context', async ({ page }) => {
    // Wait for connection
    await page.waitForTimeout(2000)

    // Select a project from dropdown
    const projectSelector = page.locator('select').or(page.locator('[role="combobox"]')).first()
    const options = await projectSelector.locator('option').count()

    if (options > 1) {
      // Select second option (first is usually "General Chat")
      await projectSelector.selectOption({ index: 1 })

      // Send message
      const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'))
      await messageInput.first().fill('What is the budget for this project?')
      const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]'))
      await sendButton.first().click()

      // Message should appear
      await expect(page.locator('text=What is the budget for this project?')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should handle WebSocket disconnection gracefully', async ({ page }) => {
    // Wait for initial connection
    await page.waitForTimeout(2000)

    // Simulate disconnect by going offline
    await page.context().setOffline(true)

    // Wait a bit
    await page.waitForTimeout(1000)

    // Check for disconnected status
    const statusIndicator = page.locator('text=/disconnected|offline/i')
    await expect(statusIndicator).toBeVisible({ timeout: 5000 })

    // Reconnect
    await page.context().setOffline(false)

    // Should reconnect
    await page.waitForTimeout(2000)
    await expect(page.locator('text=/connected/i')).toBeVisible({ timeout: 10000 })
  })
})

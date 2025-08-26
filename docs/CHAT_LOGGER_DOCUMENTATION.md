# Comprehensive Chat Agent Logger

This system provides comprehensive logging and analytics for the chat agent using AI SDK hooks and custom client-side analytics.

## Features

### Server-Side Logging (AI SDK Hooks)

-   **Real-time streaming monitoring** - Tracks chunks, steps, and completion
-   **Token usage tracking** - Monitors input/output tokens for cost analysis
-   **Tool call monitoring** - Logs all tool executions and results
-   **Error tracking** - Captures and logs all errors with context
-   **Performance metrics** - Measures response times and session duration
-   **Session analytics** - Tracks complete conversation flows

### Client-Side Analytics

-   **Status monitoring** - Tracks chat status changes (submitted, streaming, ready, error)
-   **Message tracking** - Logs all message additions and changes
-   **Local storage logging** - Optional persistent logging in browser
-   **Session metrics** - Real-time analytics for current session
-   **Custom event logging** - Log application-specific events

## Setup

### 1. Environment Variables

Add to your `.env.local`:

```bash
# Enable logging (development only)
LOG_CHAT_TO_CSV=true

# Also enable performance logging if desired
LOG_PERF_TO_CSV=true
```

### 2. Server-Side Integration

The chat API (`/app/api/chat/route.ts`) automatically includes comprehensive logging:

```typescript
import { createChatLogger } from "@/lib/chat-logger";

const logger = createChatLogger(chatId);

const result = streamText({
    // ... model config
    onChunk: logger.onChunk,
    onStepFinish: logger.onStepFinish,
    onFinish: logger.onFinish,
    onError: logger.onError,
    onAbort: logger.onAbort,
});
```

### 3. Client-Side Integration

Components automatically include analytics when using `useChatAnalytics`:

```typescript
import { useChatAnalytics } from "@/hooks/use-chat-with-logging";

const analytics = useChatAnalytics(chatHook, {
    enableLogging: true,
    logToConsole: true,
    logToLocalStorage: true,
});

// Log custom events
analytics.logCustomEvent("user_action", { action: "button_click" });
```

## Data Output

### Server Logs

Located at: `./chat_log.csv`

Columns:

-   `timestamp` - ISO timestamp
-   `eventType` - Type of event (chat_start, step_finish, tool_call, etc.)
-   `chatId` - Session identifier
-   `messageId` - Message identifier (if applicable)
-   `stepType` - Step type (initial, continue, tool-result)
-   `finishReason` - Why the step/chat finished
-   `duration_ms` - Duration in milliseconds
-   `inputTokens` - Number of input tokens
-   `outputTokens` - Number of output tokens
-   `totalTokens` - Total token count
-   `toolName` - Name of tool called
-   `toolCallId` - Tool call identifier
-   `errorMessage` - Error details
-   `chunkType` - Type of chunk received
-   `status` - success/error/warning/info
-   `metadata` - Additional context

### Session Summaries

Located at: `./chat_sessions_summary.csv`

Columns:

-   `timestamp` - Session end time
-   `chatId` - Session identifier
-   `sessionDuration_ms` - Total session duration
-   `messageCount` - Number of messages
-   `stepCount` - Number of processing steps
-   `toolCalls` - Number of tool calls
-   `totalTokens` - Total tokens used
-   `errors` - Number of errors
-   `avgTokensPerMessage` - Average tokens per message

### Client Logs

Stored in localStorage as `chat-logs` (if enabled)

Example events:

-   `session_start` - Chat session begins
-   `status_change` - Chat status changes
-   `message_added` - New message added
-   `request_complete` - Request finished
-   `chat_error_state` - Error occurred
-   `chat_mode_activated` - User entered chat mode

## Analytics Methods

### Session Metrics

```typescript
const metrics = analytics.getSessionMetrics();
console.log(metrics);
// {
//   sessionDuration: 45000,
//   messageCount: 5,
//   currentStatus: 'ready',
//   hasError: false,
//   sessionId: 'chat_123'
// }
```

### Export Logs

```typescript
// Export as CSV
const csvData = analytics.exportLogsAsCSV();

// Get raw logs
const logs = analytics.getLogs();

// Get analytics summary
const summary = analytics.getAnalytics();
// {
//   totalSessions: 3,
//   totalMessages: 15,
//   totalErrors: 1,
//   messagesByRole: { user: 8, assistant: 7 },
//   errorTypes: { NetworkError: 1 }
// }
```

## Use Cases

### 1. Performance Monitoring

Track response times and identify bottlenecks:

```sql
SELECT
    AVG(duration_ms) as avg_response_time,
    MAX(duration_ms) as max_response_time,
    COUNT(*) as total_requests
FROM chat_log
WHERE eventType = 'chat_finish';
```

### 2. Cost Analysis

Monitor token usage for cost optimization:

```sql
SELECT
    DATE(timestamp) as date,
    SUM(totalTokens) as daily_tokens,
    COUNT(DISTINCT chatId) as daily_sessions
FROM chat_log
WHERE eventType = 'chat_finish'
GROUP BY DATE(timestamp);
```

### 3. Tool Usage Analytics

Understand which tools are most used:

```sql
SELECT
    toolName,
    COUNT(*) as usage_count,
    AVG(duration_ms) as avg_duration
FROM chat_log
WHERE eventType = 'tool_call'
GROUP BY toolName
ORDER BY usage_count DESC;
```

### 4. Error Analysis

Identify common error patterns:

```sql
SELECT
    errorMessage,
    COUNT(*) as error_count,
    MAX(timestamp) as last_occurrence
FROM chat_log
WHERE eventType = 'chat_error'
GROUP BY errorMessage
ORDER BY error_count DESC;
```

### 5. User Engagement

Track session patterns:

```sql
SELECT
    AVG(sessionDuration_ms / 1000.0) as avg_session_seconds,
    AVG(messageCount) as avg_messages_per_session,
    AVG(totalTokens) as avg_tokens_per_session
FROM chat_sessions_summary;
```

## Best Practices

### 1. Data Retention

-   Logs can grow large quickly
-   Consider implementing log rotation
-   Archive old logs periodically

### 2. Privacy

-   Be mindful of logging sensitive user data
-   Consider anonymizing or hashing user identifiers
-   Follow your privacy policy guidelines

### 3. Performance

-   Logging is designed to be non-blocking
-   Monitor log file sizes in production
-   Consider using a dedicated logging service for high-volume applications

### 4. Monitoring

Set up alerts for:

-   High error rates
-   Unusual response times
-   Token usage spikes
-   Failed tool calls

## Customization

### Add Custom Events

```typescript
// Server-side custom logging
const logger = createChatLogger(chatId);
logger.onStepFinish = (result) => {
    // Custom processing
    logCustomMetric("custom_metric", value);

    // Call original
    originalOnStepFinish(result);
};

// Client-side custom events
analytics.logCustomEvent("user_scroll", { position: scrollY });
```

### Custom Analytics

```typescript
// Extend analytics with custom metrics
const customAnalytics = {
    ...analytics.getAnalytics(),
    averageResponseTime: calculateAverageResponseTime(),
    userSatisfactionScore: calculateSatisfaction(),
};
```

## Troubleshooting

### Common Issues

1. **Logs not appearing**

    - Check `LOG_CHAT_TO_CSV=true` in environment
    - Verify development environment
    - Check console for logging errors

2. **Large log files**

    - Implement log rotation
    - Filter out verbose events
    - Use log aggregation service

3. **Missing events**
    - Verify hook integration
    - Check for TypeScript errors
    - Monitor console for warnings

### Debug Mode

Enable detailed logging:

```typescript
const logger = createChatLogger(chatId);
// Logs are automatically verbose in development
```

This comprehensive logging system provides insights into:

-   **Performance** - Response times, token usage
-   **Usage patterns** - Popular tools, session lengths
-   **Error rates** - Failure points, retry needs
-   **Cost optimization** - Token consumption patterns
-   **User experience** - Session flows, interaction patterns

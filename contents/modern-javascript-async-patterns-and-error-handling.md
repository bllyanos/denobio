```yaml
title: modern javascript async patterns and error handling [ai generated]
slug: modern-javascript-async-patterns-and-error-handling
short: Modern JavaScript applications rely heavily on asynchronous operations. Understanding async/await patterns, Promise handling, and robust error management is crucial for building reliable applications. This guide covers practical async patterns and error handling strategies for JavaScript developers.
createdAt: 2025-08-02T02:11:32.927Z
updatedAt: 2025-08-02T02:11:32.927Z
tags:
  - javascript
  - async
  - promises
  - error-handling
  - generated_content
```

%%split%%

# modern javascript async patterns and error handling [ai generated]

Modern JavaScript applications rely heavily on asynchronous operations. Understanding async/await patterns, Promise handling, and robust error management is crucial for building reliable applications.

This guide covers practical async patterns and error handling strategies for JavaScript developers.

---

## Core Async Patterns

### 1. **Basic Async/Await**

```javascript
async function fetchUserData(id) {
  try {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw error;
  }
}
```

**Use When:** Simple sequential async operations.

---

### 2. **Parallel Execution**

```javascript
async function fetchUserProfile(id) {
  try {
    // Run multiple requests concurrently
    const [user, posts, followers] = await Promise.all([
      fetch(`/api/users/${id}`).then(r => r.json()),
      fetch(`/api/users/${id}/posts`).then(r => r.json()),
      fetch(`/api/users/${id}/followers`).then(r => r.json())
    ]);
    
    return { user, posts, followers };
  } catch (error) {
    throw new Error('Failed to load profile data');
  }
}
```

**Use When:** Multiple independent async operations.

---

### 3. **Promise.allSettled for Partial Success**

```javascript
async function fetchMultipleResources(urls) {
  const results = await Promise.allSettled(
    urls.map(url => fetch(url).then(r => r.json()))
  );
  
  const successful = results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value);
    
  const failed = results
    .filter(result => result.status === 'rejected')
    .map(result => result.reason);
    
  return { successful, failed };
}
```

**Use When:** You want to handle partial failures gracefully.

---

## Error Handling Strategies

### 1. **Try-Catch with Specific Error Types**

```javascript
class APIError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
  }
}

async function apiRequest(endpoint) {
  try {
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new APIError(
        'API request failed',
        response.status,
        response.statusText
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      // Handle API-specific errors
      console.error(`API Error ${error.status}:`, error.message);
    } else if (error instanceof TypeError) {
      // Handle network errors
      console.error('Network error:', error.message);
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

---

### 2. **Retry Pattern with Exponential Backoff**

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const data = await retryWithBackoff(
  () => fetch('/api/data').then(r => r.json()),
  3,
  1000
);
```

---

### 3. **Circuit Breaker Pattern**

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const breaker = new CircuitBreaker(3, 30000);
const data = await breaker.call(() => fetch('/api/unreliable'));
```

---

## Advanced Patterns

### 1. **Async Iterator Pattern**

```javascript
async function* fetchPaginatedData(endpoint) {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const response = await fetch(`${endpoint}?page=${page}`);
      const data = await response.json();
      
      yield data.items;
      
      hasMore = data.hasMore;
      page++;
    } catch (error) {
      console.error(`Failed to fetch page ${page}:`, error);
      break;
    }
  }
}

// Usage
for await (const items of fetchPaginatedData('/api/posts')) {
  console.log('Processing batch:', items.length);
  // Process items
}
```

---

### 2. **Queue with Concurrency Control**

```javascript
class AsyncQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }
  
  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject
      });
      
      this.process();
    });
  }
  
  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }
    
    this.running++;
    const { fn, resolve, reject } = this.queue.shift();
    
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// Usage
const queue = new AsyncQueue(2);

const results = await Promise.all([
  queue.add(() => fetch('/api/data1')),
  queue.add(() => fetch('/api/data2')),
  queue.add(() => fetch('/api/data3')),
  queue.add(() => fetch('/api/data4'))
]);
```

---

## Best Practices

### Handle Errors at the Right Level

```javascript
// Good: Handle errors where you can take meaningful action
async function saveUserProfile(userData) {
  try {
    await validateUserData(userData);
    await apiRequest('/api/users/profile', userData);
    showSuccessMessage('Profile saved!');
  } catch (error) {
    if (error instanceof ValidationError) {
      showValidationErrors(error.fields);
    } else {
      showErrorMessage('Failed to save profile. Please try again.');
      logError('Profile save failed', error);
    }
  }
}
```

### Use AbortController for Cancellation

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}
```

---

## Common Pitfalls to Avoid

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Unhandled Promise Rejections | Silent failures | Always add `.catch()` or `try/catch` |
| Sequential when Parallel | Slower execution | Use `Promise.all()` for independent operations |
| Blocking Event Loop | UI freezes | Break large operations into chunks |
| Memory Leaks | Uncancelled requests | Use AbortController |

---

## Summary

- Use **async/await** for readable asynchronous code.
- Implement **proper error handling** with specific error types.
- Use **Promise.all()** for parallel operations and **Promise.allSettled()** for partial failures.
- Implement **retry logic** and **circuit breakers** for resilient applications.
- **Control concurrency** to prevent overwhelming APIs or servers.
- Always **handle errors at the appropriate level** in your application.

Mastering these async patterns will help you build more reliable, performant, and maintainable JavaScript applications.
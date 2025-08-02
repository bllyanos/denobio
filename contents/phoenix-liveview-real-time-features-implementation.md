```yaml
title: phoenix liveview real-time features implementation [ai generated]
slug: phoenix-liveview-real-time-features-implementation
short: Phoenix LiveView enables building rich, interactive web applications with real-time features using server-side rendering and WebSockets. This guide covers practical patterns for implementing live updates, real-time communication, and interactive components without writing JavaScript.
createdAt: 2025-08-02T02:14:32.927Z
updatedAt: 2025-08-02T02:14:32.927Z
tags:
  - elixir
  - phoenix
  - liveview
  - real-time
  - websockets
  - generated_content
```

%%split%%

# phoenix liveview real-time features implementation [ai generated]

Phoenix LiveView enables building rich, interactive web applications with real-time features using server-side rendering and WebSockets. This guide covers practical patterns for implementing live updates, real-time communication, and interactive components without writing JavaScript.

---

## Basic LiveView Setup

### 1. **Simple Interactive Counter**

```elixir
defmodule MyAppWeb.CounterLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    socket = assign(socket, :count, 0)
    {:ok, socket}
  end

  def handle_event("increment", _params, socket) do
    socket = assign(socket, :count, socket.assigns.count + 1)
    {:noreply, socket}
  end

  def handle_event("decrement", _params, socket) do
    socket = assign(socket, :count, socket.assigns.count - 1)
    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="counter">
      <h1>Count: <%= @count %></h1>
      <button phx-click="increment">+</button>
      <button phx-click="decrement">-</button>
    </div>
    """
  end
end
```

**Use When:** Simple user interactions with immediate feedback.

---

### 2. **Real-time Form Validation**

```elixir
defmodule MyAppWeb.UserFormLive do
  use MyAppWeb, :live_view
  alias MyApp.Accounts
  alias MyApp.Accounts.User

  def mount(_params, _session, socket) do
    changeset = Accounts.change_user(%User{})
    
    socket = 
      socket
      |> assign(:changeset, changeset)
      |> assign(:checking_email, false)
    
    {:ok, socket}
  end

  def handle_event("validate", %{"user" => user_params}, socket) do
    changeset = 
      %User{}
      |> Accounts.change_user(user_params)
      |> Map.put(:action, :validate)
    
    socket = assign(socket, :changeset, changeset)
    {:noreply, socket}
  end

  def handle_event("check_email", %{"user" => %{"email" => email}}, socket) do
    socket = assign(socket, :checking_email, true)
    
    # Simulate async email check
    send(self(), {:email_check_result, email})
    
    {:noreply, socket}
  end

  def handle_event("save", %{"user" => user_params}, socket) do
    case Accounts.create_user(user_params) do
      {:ok, user} ->
        socket = 
          socket
          |> put_flash(:info, "User created successfully!")
          |> push_navigate(to: ~p"/users/#{user.id}")
        
        {:noreply, socket}
      
      {:error, changeset} ->
        socket = assign(socket, :changeset, changeset)
        {:noreply, socket}
    end
  end

  def handle_info({:email_check_result, email}, socket) do
    available = not Accounts.email_taken?(email)
    
    socket = 
      socket
      |> assign(:checking_email, false)
      |> assign(:email_available, available)
    
    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="user-form">
      <.form 
        for={@changeset} 
        phx-change="validate" 
        phx-submit="save"
        phx-debounce="300"
      >
        <.input 
          field={@changeset[:email]} 
          type="email" 
          label="Email"
          phx-blur="check_email"
        />
        
        <%= if @checking_email do %>
          <div class="checking">Checking email availability...</div>
        <% end %>
        
        <%= if assigns[:email_available] == false do %>
          <div class="error">Email is already taken</div>
        <% end %>
        
        <.input field={@changeset[:name]} type="text" label="Name" />
        <.input field={@changeset[:password]} type="password" label="Password" />
        
        <.button type="submit" disabled={not @changeset.valid?}>
          Create User
        </.button>
      </.form>
    </div>
    """
  end
end
```

**Use When:** Forms requiring real-time validation and feedback.

---

## PubSub and Broadcasting

### 1. **Real-time Chat Implementation**

```elixir
defmodule MyAppWeb.ChatLive do
  use MyAppWeb, :live_view
  alias MyApp.Chat
  alias MyAppWeb.Presence

  def mount(%{"room_id" => room_id}, %{"user_id" => user_id}, socket) do
    if connected?(socket) do
      # Subscribe to room updates
      Phoenix.PubSub.subscribe(MyApp.PubSub, "chat:#{room_id}")
      
      # Track user presence
      {:ok, _} = Presence.track(self(), "chat:#{room_id}", user_id, %{
        joined_at: DateTime.utc_now()
      })
    end

    messages = Chat.list_messages(room_id, limit: 50)
    
    socket = 
      socket
      |> assign(:room_id, room_id)
      |> assign(:user_id, user_id)
      |> assign(:messages, messages)
      |> assign(:message_form, to_form(%{"content" => ""}, as: :message))
      |> assign(:online_users, [])
    
    {:ok, socket}
  end

  def handle_event("send_message", %{"message" => %{"content" => content}}, socket) do
    case Chat.create_message(socket.assigns.room_id, socket.assigns.user_id, content) do
      {:ok, message} ->
        # Broadcast to all room subscribers
        Phoenix.PubSub.broadcast(
          MyApp.PubSub, 
          "chat:#{socket.assigns.room_id}", 
          {:new_message, message}
        )
        
        socket = assign(socket, :message_form, to_form(%{"content" => ""}, as: :message))
        {:noreply, socket}
      
      {:error, _changeset} ->
        {:noreply, put_flash(socket, :error, "Failed to send message")}
    end
  end

  def handle_event("typing", _params, socket) do
    Phoenix.PubSub.broadcast(
      MyApp.PubSub,
      "chat:#{socket.assigns.room_id}",
      {:user_typing, socket.assigns.user_id}
    )
    
    {:noreply, socket}
  end

  def handle_info({:new_message, message}, socket) do
    messages = [message | socket.assigns.messages]
    socket = assign(socket, :messages, messages)
    {:noreply, socket}
  end

  def handle_info({:user_typing, user_id}, socket) do
    # Show typing indicator for other users
    if user_id != socket.assigns.user_id do
      send(self(), {:clear_typing, user_id})
      socket = assign(socket, :typing_user, user_id)
      {:noreply, socket}
    else
      {:noreply, socket}
    end
  end

  def handle_info({:clear_typing, _user_id}, socket) do
    Process.send_after(self(), :stop_typing, 2000)
    {:noreply, socket}
  end

  def handle_info(:stop_typing, socket) do
    socket = assign(socket, :typing_user, nil)
    {:noreply, socket}
  end

  def handle_info(%{event: "presence_diff"}, socket) do
    online_users = Presence.list("chat:#{socket.assigns.room_id}")
    socket = assign(socket, :online_users, Map.keys(online_users))
    {:noreply, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="chat-container">
      <div class="chat-header">
        <h2>Room <%= @room_id %></h2>
        <div class="online-count">
          <%= length(@online_users) %> online
        </div>
      </div>
      
      <div class="messages" id="messages" phx-update="stream">
        <%= for message <- @messages do %>
          <div class="message">
            <strong><%= message.user.name %>:</strong>
            <%= message.content %>
            <span class="timestamp">
              <%= Calendar.strftime(message.inserted_at, "%H:%M") %>
            </span>
          </div>
        <% end %>
      </div>
      
      <%= if @typing_user do %>
        <div class="typing-indicator">
          User is typing...
        </div>
      <% end %>
      
      <.form for={@message_form} phx-submit="send_message" phx-change="typing">
        <.input 
          field={@message_form[:content]} 
          type="text" 
          placeholder="Type your message..."
          autocomplete="off"
        />
        <.button type="submit">Send</.button>
      </.form>
    </div>
    """
  end
end
```

**Use When:** Building real-time collaborative features like chat, comments, or notifications.

---

### 2. **Live Dashboard with Metrics**

```elixir
defmodule MyAppWeb.DashboardLive do
  use MyAppWeb, :live_view
  alias MyApp.Metrics

  def mount(_params, _session, socket) do
    if connected?(socket) do
      # Subscribe to metrics updates
      Phoenix.PubSub.subscribe(MyApp.PubSub, "metrics:updates")
      
      # Schedule periodic updates
      :timer.send_interval(5000, self(), :refresh_metrics)
    end

    metrics = load_metrics()
    
    socket = 
      socket
      |> assign(:metrics, metrics)
      |> assign(:last_updated, DateTime.utc_now())
    
    {:ok, socket}
  end

  def handle_info(:refresh_metrics, socket) do
    metrics = load_metrics()
    
    socket = 
      socket
      |> assign(:metrics, metrics)
      |> assign(:last_updated, DateTime.utc_now())
    
    {:noreply, socket}
  end

  def handle_info({:metric_update, metric_name, value}, socket) do
    metrics = Map.put(socket.assigns.metrics, metric_name, value)
    
    socket = 
      socket
      |> assign(:metrics, metrics)
      |> assign(:last_updated, DateTime.utc_now())
    
    {:noreply, socket}
  end

  defp load_metrics do
    %{
      active_users: Metrics.active_users_count(),
      total_orders: Metrics.total_orders_today(),
      revenue: Metrics.revenue_today(),
      response_time: Metrics.avg_response_time(),
      error_rate: Metrics.error_rate_last_hour()
    }
  end

  def render(assigns) do
    ~H"""
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Live Dashboard</h1>
        <div class="last-updated">
          Last updated: <%= Calendar.strftime(@last_updated, "%H:%M:%S") %>
        </div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <h3>Active Users</h3>
          <div class="metric-value"><%= @metrics.active_users %></div>
        </div>
        
        <div class="metric-card">
          <h3>Orders Today</h3>
          <div class="metric-value"><%= @metrics.total_orders %></div>
        </div>
        
        <div class="metric-card">
          <h3>Revenue Today</h3>
          <div class="metric-value">$<%= @metrics.revenue %></div>
        </div>
        
        <div class="metric-card">
          <h3>Avg Response Time</h3>
          <div class="metric-value"><%= @metrics.response_time %>ms</div>
        </div>
        
        <div class={"metric-card #{if @metrics.error_rate > 5, do: "alert"}"}>
          <h3>Error Rate</h3>
          <div class="metric-value"><%= @metrics.error_rate %>%</div>
        </div>
      </div>
    </div>
    """
  end
end
```

**Use When:** Creating real-time monitoring dashboards or live data displays.

---

## Advanced LiveView Patterns

### 1. **Live Components for Reusability**

```elixir
defmodule MyAppWeb.TodoListComponent do
  use MyAppWeb, :live_component
  alias MyApp.Todos

  def update(%{todos: todos, user_id: user_id}, socket) do
    socket = 
      socket
      |> assign(:todos, todos)
      |> assign(:user_id, user_id)
      |> assign(:editing, nil)
    
    {:ok, socket}
  end

  def handle_event("toggle_todo", %{"id" => id}, socket) do
    todo = Enum.find(socket.assigns.todos, &(&1.id == String.to_integer(id)))
    
    case Todos.update_todo(todo, %{completed: !todo.completed}) do
      {:ok, updated_todo} ->
        todos = 
          socket.assigns.todos
          |> Enum.map(&if &1.id == updated_todo.id, do: updated_todo, else: &1)
        
        socket = assign(socket, :todos, todos)
        {:noreply, socket}
      
      {:error, _changeset} ->
        {:noreply, put_flash(socket, :error, "Failed to update todo")}
    end
  end

  def handle_event("start_edit", %{"id" => id}, socket) do
    socket = assign(socket, :editing, String.to_integer(id))
    {:noreply, socket}
  end

  def handle_event("cancel_edit", _params, socket) do
    socket = assign(socket, :editing, nil)
    {:noreply, socket}
  end

  def handle_event("save_edit", %{"id" => id, "title" => title}, socket) do
    todo = Enum.find(socket.assigns.todos, &(&1.id == String.to_integer(id)))
    
    case Todos.update_todo(todo, %{title: title}) do
      {:ok, updated_todo} ->
        todos = 
          socket.assigns.todos
          |> Enum.map(&if &1.id == updated_todo.id, do: updated_todo, else: &1)
        
        socket = 
          socket
          |> assign(:todos, todos)
          |> assign(:editing, nil)
        
        {:noreply, socket}
      
      {:error, _changeset} ->
        {:noreply, put_flash(socket, :error, "Failed to save todo")}
    end
  end

  def render(assigns) do
    ~H"""
    <div class="todo-list" id={"todo-list-#{@user_id}"}>
      <%= for todo <- @todos do %>
        <div class={"todo-item #{if todo.completed, do: "completed"}"}>
          <input 
            type="checkbox" 
            checked={todo.completed}
            phx-click="toggle_todo"
            phx-value-id={todo.id}
            phx-target={@myself}
          />
          
          <%= if @editing == todo.id do %>
            <input 
              type="text" 
              value={todo.title}
              phx-blur="save_edit"
              phx-key="enter->save_edit,escape->cancel_edit"
              phx-value-id={todo.id}
              phx-target={@myself}
              class="edit-input"
            />
          <% else %>
            <span 
              class="todo-title"
              phx-click="start_edit"
              phx-value-id={todo.id}
              phx-target={@myself}
            >
              <%= todo.title %>
            </span>
          <% end %>
        </div>
      <% end %>
    </div>
    """
  end
end

# Usage in parent LiveView
defmodule MyAppWeb.TodosLive do
  use MyAppWeb, :live_view
  alias MyApp.Todos

  def mount(_params, %{"user_id" => user_id}, socket) do
    todos = Todos.list_user_todos(user_id)
    
    socket = 
      socket
      |> assign(:user_id, user_id)
      |> assign(:todos, todos)
    
    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="todos-page">
      <h1>My Todos</h1>
      
      <.live_component 
        module={MyAppWeb.TodoListComponent}
        id="user-todos"
        todos={@todos}
        user_id={@user_id}
      />
    </div>
    """
  end
end
```

**Use When:** Building reusable UI components with isolated state and behavior.

---

### 2. **Infinite Scroll with Streams**

```elixir
defmodule MyAppWeb.PostsLive do
  use MyAppWeb, :live_view
  alias MyApp.Blog

  def mount(_params, _session, socket) do
    page_size = 20
    posts = Blog.list_posts(page: 1, page_size: page_size)
    
    socket = 
      socket
      |> assign(:page, 1)
      |> assign(:page_size, page_size)
      |> assign(:has_more, length(posts) == page_size)
      |> stream(:posts, posts)
    
    {:ok, socket}
  end

  def handle_event("load_more", _params, socket) do
    next_page = socket.assigns.page + 1
    new_posts = Blog.list_posts(page: next_page, page_size: socket.assigns.page_size)
    
    socket = 
      socket
      |> assign(:page, next_page)
      |> assign(:has_more, length(new_posts) == socket.assigns.page_size)
      |> stream(:posts, new_posts)
    
    {:noreply, socket}
  end

  def handle_event("like_post", %{"id" => post_id}, socket) do
    case Blog.like_post(post_id) do
      {:ok, updated_post} ->
        socket = stream_insert(socket, :posts, updated_post)
        {:noreply, socket}
      
      {:error, _reason} ->
        {:noreply, put_flash(socket, :error, "Failed to like post")}
    end
  end

  def render(assigns) do
    ~H"""
    <div class="posts-container">
      <h1>Blog Posts</h1>
      
      <div 
        id="posts" 
        phx-update="stream"
        phx-viewport-top={@page > 1 && "load_more"}
        phx-viewport-bottom={@has_more && "load_more"}
      >
        <%= for {post_id, post} <- @streams.posts do %>
          <article id={post_id} class="post-card">
            <h2><%= post.title %></h2>
            <p><%= post.excerpt %></p>
            
            <div class="post-actions">
              <button 
                phx-click="like_post" 
                phx-value-id={post.id}
                class="like-button"
              >
                ❤️ <%= post.likes_count %>
              </button>
              
              <span class="post-date">
                <%= Calendar.strftime(post.published_at, "%B %d, %Y") %>
              </span>
            </div>
          </article>
        <% end %>
      </div>
      
      <%= if @has_more do %>
        <div class="load-more">
          <button phx-click="load_more">Load More Posts</button>
        </div>
      <% end %>
    </div>
    """
  end
end
```

**Use When:** Displaying large datasets with efficient loading and updates.

---

## Performance Optimization

### 1. **Temporary Assigns for Large Data**

```elixir
defmodule MyAppWeb.DataTableLive do
  use MyAppWeb, :live_view

  def mount(_params, _session, socket) do
    socket = 
      socket
      |> assign(:page, 1)
      |> assign(:sort_by, :name)
      |> assign(:sort_dir, :asc)
      |> assign(:filter, "")
      |> load_data()
    
    {:ok, socket}
  end

  def handle_event("sort", %{"field" => field}, socket) do
    field_atom = String.to_atom(field)
    
    {sort_by, sort_dir} = 
      if socket.assigns.sort_by == field_atom do
        {field_atom, toggle_sort_dir(socket.assigns.sort_dir)}
      else
        {field_atom, :asc}
      end
    
    socket = 
      socket
      |> assign(:sort_by, sort_by)
      |> assign(:sort_dir, sort_dir)
      |> assign(:page, 1)
      |> load_data()
    
    {:noreply, socket}
  end

  def handle_event("filter", %{"filter" => filter}, socket) do
    socket = 
      socket
      |> assign(:filter, filter)
      |> assign(:page, 1)
      |> load_data()
    
    {:noreply, socket}
  end

  defp load_data(socket) do
    opts = [
      page: socket.assigns.page,
      sort_by: socket.assigns.sort_by,
      sort_dir: socket.assigns.sort_dir,
      filter: socket.assigns.filter
    ]
    
    %{entries: entries, total_count: total_count} = MyApp.Data.paginate(opts)
    
    socket
    |> assign(:total_count, total_count)
    |> assign(:entries, entries)
    |> assign_temporary(:entries, []) # Don't keep in memory after render
  end

  defp toggle_sort_dir(:asc), do: :desc
  defp toggle_sort_dir(:desc), do: :asc

  def render(assigns) do
    ~H"""
    <div class="data-table">
      <div class="table-controls">
        <input 
          type="text" 
          placeholder="Filter..."
          value={@filter}
          phx-change="filter"
          phx-debounce="300"
        />
        
        <div class="total-count">
          Total: <%= @total_count %> entries
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th phx-click="sort" phx-value-field="name">
              Name 
              <%= sort_icon(@sort_by, @sort_dir, :name) %>
            </th>
            <th phx-click="sort" phx-value-field="email">
              Email 
              <%= sort_icon(@sort_by, @sort_dir, :email) %>
            </th>
            <th phx-click="sort" phx-value-field="created_at">
              Created 
              <%= sort_icon(@sort_by, @sort_dir, :created_at) %>
            </th>
          </tr>
        </thead>
        <tbody>
          <%= for entry <- @entries do %>
            <tr>
              <td><%= entry.name %></td>
              <td><%= entry.email %></td>
              <td><%= Calendar.strftime(entry.created_at, "%m/%d/%Y") %></td>
            </tr>
          <% end %>
        </tbody>
      </table>
    </div>
    """
  end

  defp sort_icon(current_sort, current_dir, field) do
    if current_sort == field do
      case current_dir do
        :asc -> "↑"
        :desc -> "↓"
      end
    else
      ""
    end
  end
end
```

**Use When:** Handling large datasets that shouldn't be kept in LiveView memory.

---

## Best Practices Summary

| Pattern | Use Case | Key Benefits |
|---------|----------|-------------|
| **Basic Events** | Simple interactions | Immediate feedback |
| **PubSub** | Multi-user features | Real-time collaboration |
| **Live Components** | Reusable UI | Isolated state management |
| **Streams** | Large datasets | Efficient DOM updates |
| **Temporary Assigns** | Memory optimization | Reduced memory usage |

---

## Summary

- Use **LiveView** for interactive features without writing JavaScript.
- Implement **PubSub** for real-time communication between users.
- Create **Live Components** for reusable, stateful UI elements.
- Use **Streams** for efficient handling of large, changing datasets.
- Apply **temporary assigns** to prevent memory bloat with large data.
- Leverage **Phoenix Presence** for tracking user activity and state.

Phoenix LiveView enables building rich, real-time web applications with the simplicity of server-side rendering and the interactivity of single-page applications.
```yaml
title: elixir genserver patterns and supervision trees [ai generated]
slug: elixir-genserver-patterns-and-supervision-trees
short: Elixir's OTP (Open Telecom Platform) provides powerful patterns for building fault-tolerant systems. GenServers and supervision trees are core components that enable "let it crash" philosophy and self-healing applications. This guide covers essential GenServer patterns and supervision strategies.
createdAt: 2025-08-02T02:13:32.927Z
updatedAt: 2025-08-02T02:13:32.927Z
tags:
  - elixir
  - otp
  - genserver
  - supervision
  - fault-tolerance
  - generated_content
```

%%split%%

# elixir genserver patterns and supervision trees [ai generated]

Elixir's OTP (Open Telecom Platform) provides powerful patterns for building fault-tolerant systems. GenServers and supervision trees are core components that enable "let it crash" philosophy and self-healing applications.

This guide covers essential GenServer patterns and supervision strategies.

---

## Basic GenServer Patterns

### 1. **Simple State Management**

```elixir
defmodule Counter do
  use GenServer

  # Client API
  def start_link(initial_value \\ 0) do
    GenServer.start_link(__MODULE__, initial_value, name: __MODULE__)
  end

  def get_value do
    GenServer.call(__MODULE__, :get_value)
  end

  def increment do
    GenServer.cast(__MODULE__, :increment)
  end

  def increment_by(amount) do
    GenServer.cast(__MODULE__, {:increment_by, amount})
  end

  # Server Callbacks
  def init(initial_value) do
    {:ok, initial_value}
  end

  def handle_call(:get_value, _from, state) do
    {:reply, state, state}
  end

  def handle_cast(:increment, state) do
    {:noreply, state + 1}
  end

  def handle_cast({:increment_by, amount}, state) do
    {:noreply, state + amount}
  end
end
```

**Use When:** Simple stateful operations with synchronous and asynchronous calls.

---

### 2. **Cache with TTL Pattern**

```elixir
defmodule TTLCache do
  use GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def put(key, value, ttl_ms \\ 60_000) do
    GenServer.cast(__MODULE__, {:put, key, value, ttl_ms})
  end

  def get(key) do
    GenServer.call(__MODULE__, {:get, key})
  end

  def delete(key) do
    GenServer.cast(__MODULE__, {:delete, key})
  end

  # Server Implementation
  def init(_opts) do
    schedule_cleanup()
    {:ok, %{}}
  end

  def handle_call({:get, key}, _from, state) do
    case Map.get(state, key) do
      {value, expires_at} ->
        if System.monotonic_time(:millisecond) < expires_at do
          {:reply, {:ok, value}, state}
        else
          new_state = Map.delete(state, key)
          {:reply, :not_found, new_state}
        end
      nil ->
        {:reply, :not_found, state}
    end
  end

  def handle_cast({:put, key, value, ttl_ms}, state) do
    expires_at = System.monotonic_time(:millisecond) + ttl_ms
    new_state = Map.put(state, key, {value, expires_at})
    {:noreply, new_state}
  end

  def handle_cast({:delete, key}, state) do
    new_state = Map.delete(state, key)
    {:noreply, new_state}
  end

  def handle_info(:cleanup, state) do
    now = System.monotonic_time(:millisecond)
    
    new_state = 
      state
      |> Enum.filter(fn {_key, {_value, expires_at}} -> expires_at > now end)
      |> Enum.into(%{})
    
    schedule_cleanup()
    {:noreply, new_state}
  end

  defp schedule_cleanup do
    Process.send_after(self(), :cleanup, 30_000)
  end
end
```

**Use When:** Implementing caches with automatic expiration.

---

### 3. **Worker Pool Pattern**

```elixir
defmodule WorkerPool do
  use GenServer

  def start_link(pool_size \\ 5) do
    GenServer.start_link(__MODULE__, pool_size, name: __MODULE__)
  end

  def execute_task(task_fun) do
    GenServer.call(__MODULE__, {:execute_task, task_fun}, 10_000)
  end

  def get_stats do
    GenServer.call(__MODULE__, :get_stats)
  end

  # Server Implementation
  def init(pool_size) do
    workers = 
      for i <- 1..pool_size do
        {:ok, pid} = Task.Supervisor.start_child(
          TaskSupervisor, 
          fn -> worker_loop() end
        )
        pid
      end

    state = %{
      workers: workers,
      available: workers,
      busy: [],
      queue: :queue.new(),
      completed_tasks: 0
    }

    {:ok, state}
  end

  def handle_call({:execute_task, task_fun}, from, state) do
    case state.available do
      [worker | rest_available] ->
        send(worker, {:execute, task_fun, from})
        
        new_state = %{state | 
          available: rest_available,
          busy: [worker | state.busy]
        }
        
        {:noreply, new_state}

      [] ->
        # No workers available, queue the task
        new_queue = :queue.in({task_fun, from}, state.queue)
        new_state = %{state | queue: new_queue}
        {:noreply, new_state}
    end
  end

  def handle_call(:get_stats, _from, state) do
    stats = %{
      total_workers: length(state.workers),
      available: length(state.available),
      busy: length(state.busy),
      queued: :queue.len(state.queue),
      completed: state.completed_tasks
    }
    
    {:reply, stats, state}
  end

  def handle_info({:task_completed, worker}, state) do
    # Move worker from busy to available
    new_busy = List.delete(state.busy, worker)
    
    # Check if there are queued tasks
    case :queue.out(state.queue) do
      {{:value, {task_fun, from}}, new_queue} ->
        # Execute queued task
        send(worker, {:execute, task_fun, from})
        
        new_state = %{state |
          busy: [worker | new_busy],
          queue: new_queue,
          completed_tasks: state.completed_tasks + 1
        }
        
        {:noreply, new_state}

      {:empty, _} ->
        # No queued tasks, worker becomes available
        new_state = %{state |
          available: [worker | state.available],
          busy: new_busy,
          completed_tasks: state.completed_tasks + 1
        }
        
        {:noreply, new_state}
    end
  end

  defp worker_loop do
    receive do
      {:execute, task_fun, from} ->
        try do
          result = task_fun.()
          GenServer.reply(from, {:ok, result})
        rescue
          error ->
            GenServer.reply(from, {:error, error})
        end
        
        send(WorkerPool, {:task_completed, self()})
        worker_loop()
    end
  end
end
```

**Use When:** Controlling concurrency and managing resource-intensive tasks.

---

## Supervision Strategies

### 1. **Basic Supervisor**

```elixir
defmodule MyApp.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    children = [
      # Permanent workers
      {Counter, 0},
      {TTLCache, []},
      
      # Task supervisor for dynamic tasks
      {Task.Supervisor, name: TaskSupervisor},
      
      # Worker pool
      {WorkerPool, 3}
    ]

    # :one_for_one - restart only the failed child
    # :one_for_all - restart all children if one fails
    # :rest_for_one - restart failed child and all started after it
    Supervisor.init(children, strategy: :one_for_one, max_restarts: 5, max_seconds: 5)
  end
end
```

---

### 2. **Dynamic Supervisor for Runtime Workers**

```elixir
defmodule GameSessionSupervisor do
  use DynamicSupervisor

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  def start_game_session(game_id, players) do
    child_spec = {GameSession, {game_id, players}}
    DynamicSupervisor.start_child(__MODULE__, child_spec)
  end

  def stop_game_session(game_id) do
    case Registry.lookup(GameRegistry, game_id) do
      [{pid, _}] ->
        DynamicSupervisor.terminate_child(__MODULE__, pid)
      [] ->
        {:error, :not_found}
    end
  end

  def list_active_games do
    DynamicSupervisor.which_children(__MODULE__)
    |> Enum.map(fn {_, pid, _, _} -> 
      GenServer.call(pid, :get_game_id) 
    end)
  end

  def init(_init_arg) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end
end

defmodule GameSession do
  use GenServer

  def start_link({game_id, players}) do
    GenServer.start_link(__MODULE__, {game_id, players}, 
      name: {:via, Registry, {GameRegistry, game_id}})
  end

  def init({game_id, players}) do
    state = %{
      game_id: game_id,
      players: players,
      status: :waiting,
      moves: []
    }
    
    {:ok, state}
  end

  def handle_call(:get_game_id, _from, state) do
    {:reply, state.game_id, state}
  end

  # Game logic handlers...
end
```

**Use When:** Managing dynamic processes like user sessions, connections, or game instances.

---

### 3. **Layered Supervision Tree**

```elixir
defmodule MyApp.Application do
  use Application

  def start(_type, _args) do
    children = [
      # Database layer
      {MyApp.Repo, []},
      
      # Core services supervisor
      {MyApp.CoreSupervisor, []},
      
      # Web layer
      {MyApp.Web.Endpoint, []},
      
      # Background jobs
      {MyApp.JobSupervisor, []},
    ]

    opts = [strategy: :one_for_one, name: MyApp.Supervisor]
    Supervisor.start_link(children, opts)
  end
end

defmodule MyApp.CoreSupervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    children = [
      # Registry for process discovery
      {Registry, keys: :unique, name: MyApp.Registry},
      
      # Cache layer
      {MyApp.Cache, []},
      
      # Business logic services
      {MyApp.UserManager, []},
      {MyApp.SessionManager, []},
      
      # Dynamic supervisors
      {MyApp.GameSessionSupervisor, []}
    ]

    Supervisor.init(children, strategy: :rest_for_one)
  end
end

defmodule MyApp.JobSupervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    children = [
      # Background job processors
      {Task.Supervisor, name: MyApp.TaskSupervisor},
      {MyApp.EmailWorker, []},
      {MyApp.ReportGenerator, []},
      {MyApp.DataCleanup, []}
    ]

    # Allow frequent restarts for job workers
    Supervisor.init(children, 
      strategy: :one_for_one, 
      max_restarts: 10, 
      max_seconds: 5
    )
  end
end
```

**Use When:** Building complex applications with multiple layers and concerns.

---

## Advanced Patterns

### 1. **Circuit Breaker GenServer**

```elixir
defmodule CircuitBreaker do
  use GenServer

  @default_failure_threshold 5
  @default_timeout 60_000

  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  def call(server \\ __MODULE__, fun) do
    GenServer.call(server, {:call, fun})
  end

  def get_state(server \\ __MODULE__) do
    GenServer.call(server, :get_state)
  end

  # Server Implementation
  def init(opts) do
    state = %{
      failure_threshold: Keyword.get(opts, :failure_threshold, @default_failure_threshold),
      timeout: Keyword.get(opts, :timeout, @default_timeout),
      failure_count: 0,
      last_failure_time: nil,
      state: :closed  # :closed, :open, :half_open
    }
    
    {:ok, state}
  end

  def handle_call({:call, fun}, _from, state) do
    case state.state do
      :closed ->
        execute_call(fun, state)
      
      :open ->
        if should_attempt_reset?(state) do
          new_state = %{state | state: :half_open}
          execute_call(fun, new_state)
        else
          {:reply, {:error, :circuit_open}, state}
        end
      
      :half_open ->
        execute_call(fun, state)
    end
  end

  def handle_call(:get_state, _from, state) do
    {:reply, 
     %{
       state: state.state,
       failure_count: state.failure_count,
       failure_threshold: state.failure_threshold
     }, 
     state}
  end

  defp execute_call(fun, state) do
    try do
      result = fun.()
      new_state = on_success(state)
      {:reply, {:ok, result}, new_state}
    rescue
      error ->
        new_state = on_failure(state)
        {:reply, {:error, error}, new_state}
    end
  end

  defp on_success(state) do
    %{state | failure_count: 0, state: :closed}
  end

  defp on_failure(state) do
    new_failure_count = state.failure_count + 1
    new_state = %{state | 
      failure_count: new_failure_count,
      last_failure_time: System.monotonic_time(:millisecond)
    }

    if new_failure_count >= state.failure_threshold do
      %{new_state | state: :open}
    else
      new_state
    end
  end

  defp should_attempt_reset?(state) do
    System.monotonic_time(:millisecond) - state.last_failure_time > state.timeout
  end
end
```

**Use When:** Protecting external service calls from cascading failures.

---

### 2. **Registry-based Process Discovery**

```elixir
defmodule UserSessionRegistry do
  def start_link do
    Registry.start_link(keys: :unique, name: __MODULE__)
  end

  def register_session(user_id) do
    Registry.register(__MODULE__, user_id, %{
      started_at: DateTime.utc_now(),
      last_activity: DateTime.utc_now()
    })
  end

  def find_session(user_id) do
    case Registry.lookup(__MODULE__, user_id) do
      [{pid, metadata}] -> {:ok, pid, metadata}
      [] -> {:error, :not_found}
    end
  end

  def list_active_sessions do
    Registry.select(__MODULE__, [{{:"$1", :"$2", :"$3"}, [], [{{:"$1", :"$2", :"$3"}}]}])
  end

  def update_activity(user_id) do
    Registry.update_value(__MODULE__, user_id, fn metadata ->
      %{metadata | last_activity: DateTime.utc_now()}
    end)
  end
end

defmodule UserSession do
  use GenServer

  def start_link(user_id) do
    GenServer.start_link(__MODULE__, user_id, 
      name: {:via, Registry, {UserSessionRegistry, user_id}})
  end

  def send_message(user_id, message) do
    case UserSessionRegistry.find_session(user_id) do
      {:ok, pid, _metadata} ->
        GenServer.cast(pid, {:message, message})
      {:error, :not_found} ->
        {:error, :session_not_found}
    end
  end

  def init(user_id) do
    UserSessionRegistry.register_session(user_id)
    {:ok, %{user_id: user_id, messages: []}}
  end

  def handle_cast({:message, message}, state) do
    UserSessionRegistry.update_activity(state.user_id)
    new_messages = [message | state.messages]
    {:noreply, %{state | messages: new_messages}}
  end
end
```

---

## Best Practices

### 1. **Graceful Shutdown Handling**

```elixir
defmodule GracefulWorker do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    Process.flag(:trap_exit, true)
    {:ok, %{active_tasks: MapSet.new()}}
  end

  def handle_cast({:start_task, task_id, task_fun}, state) do
    task = Task.async(fn ->
      try do
        task_fun.()
      after
        GenServer.cast(__MODULE__, {:task_completed, task_id})
      end
    end)
    
    new_tasks = MapSet.put(state.active_tasks, {task_id, task})
    {:noreply, %{state | active_tasks: new_tasks}}
  end

  def handle_cast({:task_completed, task_id}, state) do
    new_tasks = MapSet.filter(state.active_tasks, fn {id, _task} -> id != task_id end)
    {:noreply, %{state | active_tasks: new_tasks}}
  end

  def terminate(reason, state) do
    IO.puts("Shutting down gracefully... Reason: #{inspect(reason)}")
    
    # Wait for active tasks to complete
    state.active_tasks
    |> Enum.each(fn {_task_id, task} ->
      Task.await(task, 5000)
    end)
    
    IO.puts("All tasks completed. Goodbye!")
    :ok
  end
end
```

---

### 2. **Health Check and Monitoring**

```elixir
defmodule HealthChecker do
  use GenServer

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def get_health do
    GenServer.call(__MODULE__, :get_health)
  end

  def init(opts) do
    services = Keyword.get(opts, :services, [])
    interval = Keyword.get(opts, :check_interval, 30_000)
    
    schedule_health_check(interval)
    
    {:ok, %{
      services: services,
      interval: interval,
      last_check: nil,
      status: %{}
    }}
  end

  def handle_call(:get_health, _from, state) do
    overall_status = if Enum.all?(state.status, fn {_service, status} -> status == :ok end) do
      :healthy
    else
      :unhealthy
    end
    
    health_report = %{
      overall: overall_status,
      last_check: state.last_check,
      services: state.status
    }
    
    {:reply, health_report, state}
  end

  def handle_info(:health_check, state) do
    new_status = 
      state.services
      |> Enum.map(fn {service_name, check_fun} ->
        status = try do
          case check_fun.() do
            :ok -> :ok
            {:ok, _} -> :ok
            _ -> :error
          end
        rescue
          _ -> :error
        end
        
        {service_name, status}
      end)
      |> Enum.into(%{})
    
    schedule_health_check(state.interval)
    
    new_state = %{state | 
      status: new_status,
      last_check: DateTime.utc_now()
    }
    
    {:noreply, new_state}
  end

  defp schedule_health_check(interval) do
    Process.send_after(self(), :health_check, interval)
  end
end
```

---

## Supervision Strategies Comparison

| Strategy | Behavior | Use Case |
|----------|----------|----------|
| `:one_for_one` | Restart only failed child | Independent workers |
| `:one_for_all` | Restart all children | Interdependent services |
| `:rest_for_one` | Restart failed + later children | Dependency chain |
| `:simple_one_for_one` | Dynamic children (deprecated) | Use DynamicSupervisor |

---

## Summary

- Use **GenServer** for stateful processes with clear client/server API.
- Implement **proper supervision trees** to handle failures gracefully.
- Choose the right **supervision strategy** based on process dependencies.
- Use **DynamicSupervisor** for processes created at runtime.
- Implement **circuit breakers** to protect against cascading failures.
- Use **Registry** for efficient process discovery and monitoring.
- Always handle **graceful shutdown** for critical processes.

These patterns enable building robust, fault-tolerant systems that can recover from failures automatically while maintaining system availability.
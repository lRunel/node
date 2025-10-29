const express = require('express');
const app = express();

app.use(express.json());

// In-memory array to store tasks
let tasks = [];
let nextTaskId = 1;

// Logger middleware
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

// Validation middleware
function validateTask(req, res, next) {
  const { title, description, status } = req.body;
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title and description',
      });
    }
    if (
      status &&
      !['pending', 'in-progress', 'completed'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }
  }
  next();
}

// Create Task
app.post('/tasks', validateTask, (req, res) => {
  try {
    const { title, description, status = 'pending' } = req.body;
    const task = {
      id: nextTaskId++,
      title,
      description,
      status,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Get All Tasks (with optional status filter and date sort)
app.get('/tasks', (req, res) => {
  try {
    let result = [...tasks];
    const { status, sort } = req.query;
    if (status) {
      result = result.filter((task) => task.status === status);
    }
    if (sort === 'asc' || sort === 'desc') {
      result.sort((a, b) =>
        sort === 'asc'
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Get Single Task
app.get('/tasks/:id', (req, res) => {
  try {
    const task = tasks.find((t) => t.id === parseInt(req.params.id));
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Update Task
app.put('/tasks/:id', validateTask, (req, res) => {
  try {
    const task = tasks.find((t) => t.id === parseInt(req.params.id));
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }
    const { title, description, status } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) {
      if (!['pending', 'in-progress', 'completed'].includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid status value' });
      }
      task.status = status;
    }
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Delete Task
app.delete('/tasks/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex((t) => t.id === parseInt(req.params.id));
    if (taskIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: 'Task not found' });
    }
    tasks.splice(taskIndex, 1);
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Global error handler (for any unexpected errors)
app.use((err, req, res, next) => {
  res
    .status(500)
    .json({ success: false, message: 'Internal Server Error' });
});

// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Task Manager API running on port ${PORT}`);
});

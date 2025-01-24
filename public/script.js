// DOM Elements
const taskInput = document.getElementById("taskInput");
const addTaskButton = document.getElementById("addTaskButton");
const taskList = document.getElementById("taskList");

const dateTimeModal = document.getElementById("dateTimeModal");
const taskDateInput = document.getElementById("taskDate");
const taskTimeInput = document.getElementById("taskTime");
const modalConfirmButton = document.getElementById("modalConfirmButton");
const modalCancelButton = document.getElementById("modalCancelButton");

let currentTaskName = ""; // Temporarily store the task name

// Populate time dropdown
for (let hour = 0; hour < 24; hour++) {
  for (let minute = 0; minute < 60; minute += 15) {
    const timeOption = document.createElement("option");
    const formattedTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    timeOption.value = formattedTime;
    timeOption.textContent = formattedTime;
    taskTimeInput.appendChild(timeOption);
  }
}

// Function to show the modal
const showModal = () => {
  dateTimeModal.style.display = "block";
};

// Function to hide the modal
const hideModal = () => {
  dateTimeModal.style.display = "none";
};

// Function to add a new task
const addTask = () => {
  const taskName = taskInput.value.trim();
  if (!taskName) return; // Prevent empty tasks

  currentTaskName = taskName; // Store the task name temporarily
  showModal(); // Show the date and time modal
};

// Function to create a task element
const createTaskElement = (task) => {
  const taskItem = document.createElement("li");
  taskItem.classList.add("task-list-item");
  taskItem.dataset.timestamp = task.timestamp; // Store the task's timestamp

  // Task Label (task name)
  const taskLabel = document.createElement("label");
  taskLabel.classList.add("task-list-item-label");

  // Checkbox
  const taskCheckbox = document.createElement("input");
  taskCheckbox.type = "checkbox";
  taskCheckbox.checked = task.completed;
  taskCheckbox.addEventListener("change", () => {
    taskLabel.classList.toggle("completed", taskCheckbox.checked);
    saveTasksToLocalStorage(); // Update the task's completion status
  });

  // Task Name
  const taskNameSpan = document.createElement("span");
  taskNameSpan.textContent = task.name;

  // Date and Time Formatting
  const taskDateTime = document.createElement("span");
  const taskDate = new Date(task.timestamp);
  const formattedDateTime = `${taskDate.getDate().toString().padStart(2, "0")}-${(taskDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${taskDate.getFullYear().toString().slice(-2)} ${taskDate.getHours().toString().padStart(2, "0")}:${taskDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  taskDateTime.textContent = formattedDateTime;
  taskDateTime.classList.add("task-date-time");

  // Delete Button
  const deleteButton = document.createElement("span");
  deleteButton.classList.add("delete-btn");
  deleteButton.title = "Delete Task";
  deleteButton.textContent = "❌";
  deleteButton.addEventListener("click", () => {
    taskList.removeChild(taskItem);
    saveTasksToLocalStorage(); // Save updated tasks to localStorage
  });

  // Assemble Task Item
  taskLabel.appendChild(taskCheckbox);
  taskLabel.appendChild(taskNameSpan);
  taskItem.appendChild(taskLabel);
  taskItem.appendChild(taskDateTime); // Add date/time
  taskItem.appendChild(deleteButton);

  // Check if task time has passed or is close
  checkTaskStatus(taskItem, task);

  return taskItem;
};

// Function to check task status (if passed or close)
const checkTaskStatus = (taskItem, task) => {
  const currentTime = new Date().getTime();
  const taskTime = task.timestamp;

  // If the task time has passed, check the checkbox and strike through
  if (taskTime < currentTime) {
    const taskCheckbox = taskItem.querySelector("input[type='checkbox']");
    taskCheckbox.checked = true;
    const taskLabel = taskItem.querySelector(".task-list-item-label");
    taskLabel.classList.add("completed"); // Add completed class to strike through the text
  }

  // Flash task 5 minutes before and after the due time
  const flashStartTime = taskTime - 5 * 60 * 1000; // 5 minutes before
  const flashEndTime = taskTime + 5 * 60 * 1000; // 5 minutes after

  // Check if it's time to flash
  const taskLabel = taskItem.querySelector(".task-list-item-label");

  if (currentTime >= flashStartTime && currentTime <= flashEndTime) {
    taskLabel.classList.add("flashing");
  } else {
    taskLabel.classList.remove("flashing");
  }
};

// Save tasks to localStorage
const saveTasksToLocalStorage = () => {
  const tasks = Array.from(taskList.children).map((taskItem) => {
    const label = taskItem.querySelector(".task-list-item-label");
    const checkbox = label.querySelector("input[type='checkbox']");
    const taskName = label.querySelector("span").textContent;
    const datetimeMatch = taskName.match(/\(Due: (.+)\)$/); // Extract datetime from text
    return {
      name: taskName.split(" (Due:")[0].trim(), // Extract task name
      datetime: datetimeMatch ? datetimeMatch[1] : "",
      completed: checkbox.checked,
      timestamp: parseInt(taskItem.dataset.timestamp),
    };
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// Confirm button event
modalConfirmButton.addEventListener("click", () => {
  const taskDate = taskDateInput.value;
  const taskTime = taskTimeInput.value;

  if (!taskDate || !taskTime) {
    alert("Please select both a date and a time.");
    return;
  }

  const taskDatetime = `${taskDate} ${taskTime}`;
  const task = { name: currentTaskName, datetime: taskDatetime, completed: false, timestamp: new Date(`${taskDate}T${taskTime}`).getTime() };
  const taskItem = createTaskElement(task);
  taskList.appendChild(taskItem);

  saveTasksToLocalStorage(); // Save updated tasks to localStorage
  taskInput.value = ""; // Clear input field
  hideModal(); // Hide the modal

  sortTasks();
});

// Function to sort tasks
const sortTasks = () => {
  const tasks = Array.from(taskList.children);
  tasks.sort((a, b) => {
    const timestampA = parseInt(a.dataset.timestamp);
    const timestampB = parseInt(b.dataset.timestamp);
    return timestampA - timestampB;
  });

  // Reattach sorted tasks to the list
  tasks.forEach((taskItem) => {
    taskList.appendChild(taskItem); // Reattach tasks in sorted order
  });
};

// Cancel button event
modalCancelButton.addEventListener("click", () => {
  hideModal(); // Hide the modal
});

// Load tasks from localStorage
const loadTasksFromLocalStorage = () => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  savedTasks
    .sort((a, b) => a.timestamp - b.timestamp) // Sort by creation time
    .forEach((task) => {
      const taskItem = createTaskElement(task);
      taskList.appendChild(taskItem);
    });
};

// Event Listeners
addTaskButton.addEventListener("click", addTask);
taskInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") addTask();
});

// Load tasks on page load
loadTasksFromLocalStorage();

// Function to refresh the task list without reloading the page
const refreshTasks = () => {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = ""; // Clear the current list

  // Reload tasks from localStorage and re-render them
  const savedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  savedTasks.forEach((task) => {
    const taskItem = createTaskElement(task);
    taskList.appendChild(taskItem);
  });
};

// Set interval to refresh task list every second
setInterval(refreshTasks, 1000); // Refresh every 1000 ms (1 second)


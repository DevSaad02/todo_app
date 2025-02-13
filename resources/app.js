  // call function when the page loads
  document.addEventListener("DOMContentLoaded", function () {
    fetchItems(); // Load items on page load
    enableEditing();
  });

  // Get all the items request
  function fetchItems() {
    fetch("code.php?action=fetch") // Send identifier
      .then(response => response.json())
      .then(data => {
        let list = document.getElementById("list");
        list.innerHTML = ""; // Clear existing items

        data.forEach(item => {
          let listItem = document.createElement("li");
          listItem.setAttribute("draggable", true);
          listItem.setAttribute("color", "1");
          listItem.classList.add("colorBlue");
          listItem.setAttribute("rel", "1");
          listItem.setAttribute("id", item.id);
          // Check if item is marked as done
          let doneStyle = item.is_done == 1 ? "text-decoration: line-through; opacity: 0.5;" : "";
          let itemColor = item.list_color || "#73b8bf";
          listItem.innerHTML = `
        <span id="${item.id}listitem" class="editable" data-id="${item.id}" title="Double-click to edit..." style="opacity: 1; ${doneStyle} background-color: ${itemColor}">
            ${item.description}
        </span>
        <div class="draggertab tab"></div>
        <div class="colortab tab"></div>
        <input type="color" class="color-picker" data-id="${item.id}" value="${item.list_color || "#73b8bf"}" style="display:none;">
        <div class="deletetab tab" style="display: block;">x</div>
        <div class="sure-text tab" style="display: none;">sure?</div>
        <div class="donetab tab"></div>
    `;

          list.appendChild(listItem);
        });

        // Reattach event listeners after dynamically adding elements
        enableEditing();

      })
      .catch(error => console.error("Error fetching items:", error));
  }

  // Add new item request
  $(document).ready(function () {
    $("#add-new").submit(function (event) {
      event.preventDefault(); // Prevent default form submission

      let formData = $(this).serialize(); // Serialize form fields automatically

      $.ajax({
        url: "code.php",
        type: "POST",
        data: formData,
        success: function (response) {
          $("#add-new")[0].reset(); // Clear input fields
          fetchItems(); // Reload list after adding new item
        },
        error: function (xhr, status, error) {
          // console.error("Error:", error);
        }
      });
    });
  });

  // Enable editing for list items
  function enableEditing() {
    document.querySelectorAll(".editable").forEach(span => {
      span.addEventListener("dblclick", function () {
        let itemId = this.getAttribute("data-id");
        let oldText = this.innerText.trim();

        // Create edit container
        let editContainer = document.createElement("div");
        editContainer.style.display = "flex";
        editContainer.style.alignItems = "center";
        editContainer.style.gap = "5px";

        // Create input field
        let input = document.createElement("input");
        input.type = "text";
        input.value = oldText;
        input.classList.add("edit-input");
        input.style.width = this.offsetWidth + "px";
        input.style.height = this.offsetHeight + "px";

        // Create Save button
        let saveButton = document.createElement("button");
        saveButton.innerText = "✔️";
        saveButton.classList.add("save-button");
        saveButton.style.border = "none";
        saveButton.style.background = "#28a745";
        saveButton.style.color = "white";
        saveButton.style.padding = "5px 8px";
        saveButton.style.cursor = "pointer";
        saveButton.style.borderRadius = "4px";

        // Create Cancel button
        let cancelButton = document.createElement("button");
        cancelButton.innerText = "❌";
        cancelButton.classList.add("cancel-button");
        cancelButton.style.border = "none";
        cancelButton.style.background = "#dc3545";
        cancelButton.style.color = "white";
        cancelButton.style.padding = "5px 8px";
        cancelButton.style.cursor = "pointer";
        cancelButton.style.borderRadius = "4px";

        // Append input, save, and cancel buttons
        editContainer.appendChild(input);
        editContainer.appendChild(saveButton);
        editContainer.appendChild(cancelButton);

        // Replace span with edit container
        this.replaceWith(editContainer);
        input.focus();

        // Save changes on button click
        saveButton.addEventListener("click", function () {
          saveEdit(itemId, input.value, span, editContainer);
        });

        // Save changes on Enter key
        input.addEventListener("keypress", function (event) {
          if (event.key === "Enter") {
            saveEdit(itemId, input.value, span, editContainer);
          }
        });

        // Cancel editing
        cancelButton.addEventListener("click", function () {
          editContainer.replaceWith(span);
        });
      });
    });
  }

// Save edited item request
function saveEdit(id, newText, span, editContainer) {
  let oldText = span.innerText.trim();

  if (newText === oldText) {
    editContainer.replaceWith(span);
    return;
  }

  // Disable buttons while saving
  let saveButton = editContainer.querySelector(".save-button");
  let cancelButton = editContainer.querySelector(".cancel-button");
  saveButton.disabled = true;
  cancelButton.disabled = true;

  // Show a loading indicator
  saveButton.innerText = "⏳";

  fetch("code.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      action: "update",
      id: id,
      newText: newText
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === "success") {
        span.innerText = newText;
        editContainer.replaceWith(span);
      } else {
        console.error("Error updating item:", data.message);
        alert("Failed to update item. Try again.");
        editContainer.replaceWith(span);
      }
    })
    .catch(error => {
      console.error("Error:", error);
      alert("An error occurred while updating.");
      editContainer.replaceWith(span);
    })
    .finally(() => {
      saveButton.innerText = "✔️";
      saveButton.disabled = false;
      cancelButton.disabled = false;
    });
}

  // Handle done button click
  document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (event) {
      if (event.target.classList.contains("donetab")) {
        let itemId = event.target.closest("li").getAttribute("id");

        // Call PHP to update the database
        fetch("code.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `action=mark_done&id=${itemId}`
        })
          .then(response => response.json())
          .then(data => {
            if (data.status === "success") {

              // Apply the done styling (like faded text)
              let itemText = document.querySelector(`[id='${itemId}'] span`);
              itemText.style.textDecoration = "line-through";
              itemText.style.opacity = "0.5";
            } else {
              console.error("Error updating item:", data.error);
            }
          })
          .catch(error => console.error("Fetch error:", error));
      }
    });
  });

  // Handle dynamically added color buttons using event delegation
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("colortab")) {
      let itemId = event.target.closest("li").getAttribute("id");
      let colorPicker = document.querySelector(`input.color-picker[data-id='${itemId}']`);

      if (colorPicker) {
        colorPicker.click(); // Simulate click on the color picker
      }
    }
  });

  // Handle color selection
  document.addEventListener("input", function (event) {
    if (event.target.classList.contains("color-picker")) {
      let itemId = event.target.getAttribute("data-id");
      let selectedColor = event.target.value;

      // Find the corresponding list item
      let listItem = event.target.closest("li");
      if (listItem) {
        let contentBox = listItem.querySelector(".editable"); // Ensure it targets the correct div/span
        if (contentBox) {
          contentBox.style.backgroundColor = selectedColor;
        } else {
          console.error("Could not find the correct element to apply color.");
        }
      }
      // Save the selected color to the database
      saveColorToDB(itemId, selectedColor);
    }
  });

  // Function to send the selected color to the backend
  function saveColorToDB(itemId, color) {
    fetch("code.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `action=update_color&id=${itemId}&color=${encodeURIComponent(color)}`
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success") {
          console.log(`Color updated successfully for item ${itemId}`);
        } else {
          console.error("Error updating color:", data.message);
        }
      })
      .catch(error => console.error("Fetch error:", error));
  }

  // Handle delete button click
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("deletetab")) {
      let deleteButton = event.target;
      let sureText = deleteButton.nextElementSibling; // Find "Sure" text next to delete button
      let listItem = deleteButton.closest("li"); // Find the list item

      if (sureText && sureText.classList.contains("sure-text")) {
        if (sureText.style.display === "none" || sureText.style.display === "") {
          // First click: Show "Sure" text
          sureText.style.display = "inline";
        } else {
          // Second click: Send request to delete from database
          let itemId = listItem.getAttribute("id");
          fetch("code.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `action=delete&id=${itemId}`
          })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                listItem.remove(); // Remove from UI if delete is successful
              } else {
                console.error("Failed to delete item:", data.error);
              }
            })
            .catch(error => console.error("Error deleting item:", error));
        }
      }
    }
  });

// Drag and drop functionality
  document.addEventListener("DOMContentLoaded", function () {
    const list = document.getElementById("list");

    list.addEventListener("dragstart", function (e) {
        let target = e.target;

        // Allow dragging only if the drag was started on the .draggertab or the <li> itself
        if (target.classList.contains("draggertab")) {
            target = target.closest("li"); // Get the parent <li>
        }

        if (target && target.tagName === "LI") {
            target.classList.add("dragging");
            setTimeout(() => target.style.opacity = "0.5", 0); // Reduce opacity while dragging
        } else {
            console.warn("⚠️ Drag start ignored, invalid element:", e.target.tagName);
            e.preventDefault(); // Prevent dragging on anything else
        }
    });

    list.addEventListener("dragover", function (e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        const draggedItem = document.querySelector(".dragging");

        if (!draggedItem) {
            console.warn("⚠️ No dragging element found during dragover!");
            return;
        }

        if (afterElement == null) {
            list.appendChild(draggedItem);
        } else {
            list.insertBefore(draggedItem, afterElement);
        }
    });

    list.addEventListener("drop", function (e) {
        e.preventDefault();
        const draggedItem = document.querySelector(".dragging");

        if (!draggedItem) {
            console.warn("⚠️ No dragged item found during drop!");
            return;
        }

        draggedItem.classList.remove("dragging");
        draggedItem.style.opacity = "1"; // Restore opacity

        // Get new order of items
        const items = [...list.children];
        const newOrder = items.map((item, index) => ({
            id: item.getAttribute("id"),
            position: index + 1
        }));

        // Send updated order to server
        fetch("code.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "update_positions", order: newOrder })
        }).then(response => response.json())
          .then(data => console.log("Order updated:", data))
          .catch(error => console.error("Error updating order:", error));
    });

    // Get the closest element below the cursor
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
});

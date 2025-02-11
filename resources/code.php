<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include "../dbconfig.php";
// Fetch all items when action = "fetch"
if (isset($_GET["action"]) && $_GET["action"] === "fetch") {
    $result = $conn->query("SELECT * FROM todo_list ORDER BY item_position");

    $items = [];
    while ($row = $result->fetch_assoc()) {
        $items[] = $row;
    }

    echo json_encode($items);
    exit();
    // Close database connection
    $conn->close();
}



if (isset($_POST["new-list-item-text"])) {

    $description = trim($_POST["new-list-item-text"]);
    if (!empty($description)) {
        // Get the max position from the existing records
        $query = "SELECT MAX(item_position) AS max_position FROM todo_list";
        $result = $conn->query($query);
        $row = $result->fetch_assoc();
        $new_position = ($row["max_position"] ?? 0) + 1; // Default to 1 if table is empty

        // Use a prepared statement to insert a new item with the calculated position
        $stmt = $conn->prepare("INSERT INTO todo_list (description, item_position) VALUES (?, ?)");
        $stmt->bind_param("si", $description, $new_position);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Item added successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to insert item"]);
        }

        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Description cannot be empty"]);
    }
    $conn->close();
}


if (isset($_POST["action"]) && $_POST["action"] === "update" && isset($_POST["id"]) && isset($_POST["newText"])) {
    // Update an existing item
    $id = intval($_POST["id"]);
    $newText = trim($_POST["newText"]);

    if (!empty($newText)) {
        $stmt = $conn->prepare("UPDATE todo_list SET description = ? WHERE id = ?");
        $stmt->bind_param("si", $newText, $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Item updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to update item"]);
        }
        $stmt->close();
    } else {
        echo json_encode(["status" => "error", "message" => "Description cannot be empty"]);
    }
    exit();
}

if (isset($_POST["action"]) && $_POST["action"] === "mark_done" && isset($_POST["id"])) {
    $id = intval($_POST["id"]);

    $stmt = $conn->prepare("UPDATE todo_list SET is_done = 1 WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Item marked as done"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update"]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

if (isset($_POST["action"]) && $_POST["action"] == "update_color" && isset($_POST["id"]) && isset($_POST["color"])) {
    $id = intval($_POST["id"]);
    $color = trim($_POST["color"]);

    $stmt = $conn->prepare("UPDATE todo_list SET list_color = ? WHERE id = ?");
    $stmt->bind_param("si", $color, $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Color updated successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Database update failed"]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

if (isset($_POST["action"]) && $_POST["action"] == "delete" && isset($_POST["id"])) {
    $id = intval($_POST["id"]);

    // Start transaction
    $conn->begin_transaction();

    try {
        // Get the position of the item being deleted
        $stmt = $conn->prepare("SELECT item_position FROM todo_list WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $stmt->bind_result($deleted_position);
        $stmt->fetch();
        $stmt->close();

        if (!isset($deleted_position)) {
            throw new Exception("Item not found");
        }

        // Delete the item
        $stmt = $conn->prepare("DELETE FROM todo_list WHERE id = ?");
        $stmt->bind_param("i", $id);
        if (!$stmt->execute()) {
            throw new Exception("Error deleting task");
        }
        $stmt->close();

        // Shift positions down for items that had a higher position than the deleted item
        $stmt = $conn->prepare("UPDATE todo_list SET item_position = item_position - 1 WHERE item_position > ?");
        $stmt->bind_param("i", $deleted_position);
        if (!$stmt->execute()) {
            throw new Exception("Error updating positions");
        }
        $stmt->close();

        $conn->commit(); // Commit transaction

        echo json_encode(["success" => "success", "message" => "Task deleted and positions updated"]);
    } catch (Exception $e) {
        $conn->rollback(); // Rollback on failure
        echo json_encode(["success" => "error", "message" => $e->getMessage()]);
    }

    $conn->close();
    exit;
}


$data = json_decode(file_get_contents("php://input"), true);


if (isset($data["action"]) && $data["action"] === "update_positions" && isset($data["order"])) {

    $conn->begin_transaction(); // Start transaction

    try {
        $stmt = $conn->prepare("UPDATE todo_list SET item_position = ? WHERE id = ?");

        foreach ($data["order"] as $item) {
            $stmt->bind_param("ii", $item["position"], $item["id"]);

            if (!$stmt->execute()) {
                throw new Exception($stmt->error);
            }
        }

        $conn->commit(); // Commit transaction
        $stmt->close(); // Close statement

        echo json_encode(["success" => true, "message" => "Positions updated"]);
    } catch (Exception $e) {
        $conn->rollback(); // Rollback transaction on error
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
}

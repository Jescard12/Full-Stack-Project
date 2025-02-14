import { useLoaderData, Form, redirect } from "react-router";
import { getDB } from "~/db/getDB";
import type { ActionFunction } from "react-router";

// Loader function to fetch data for both creating and editing timesheets
export async function loader({ params }: { params: { timesheetId?: string } }) {
  const db = await getDB();

  // If we're editing, fetch the timesheet data
  if (params.timesheetId) {
    const timesheet = await db.get(
      "SELECT * FROM timesheets WHERE id = ?",
      params.timesheetId
    );
    return { timesheet };
  }

  // If we're creating a new timesheet, fetch employees list
  const employees = await db.all('SELECT id, full_name FROM employees');
  return { employees };
}

// Action function to handle both creating, updating, and deleting timesheets
export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");  // Used for delete intent

  const db = await getDB();
  const employee_id = formData.get("employee_id");
  const start_time = formData.get("start_time");
  const end_time = formData.get("end_time");

  // Handle delete request for editing timesheet
  if (intent === "delete") {
    await db.run("DELETE FROM timesheets WHERE id = ?", params.timesheetId);
    return redirect("/timesheets");
  }

  // Handle update or create request
  if (params.timesheetId) {
    // Update existing timesheet
    await db.run(
      "UPDATE timesheets SET start_time = ?, end_time = ? WHERE id = ?",
      [start_time, end_time, params.timesheetId]
    );
  } else {
    // Create a new timesheet
    await db.run(
      'INSERT INTO timesheets (employee_id, start_time, end_time) VALUES (?, ?, ?)',
      [employee_id, start_time, end_time]
    );
  }

  return redirect("/timesheets");
}

export default function TimesheetPage() {
  const { timesheet, employees } = useLoaderData();
  const isEditing = Boolean(timesheet);

  return (
    <div>
      <h1>{isEditing ? "Edit Timesheet" : "Create New Timesheet"}</h1>
      <Form method="post">
        {isEditing && (
          <div>
            <h2>Employee: {timesheet.employee_id}</h2>
          </div>
        )}

        {!isEditing && (
          <div>
            <label htmlFor="employee_id">Employee</label>
            <select name="employee_id" id="employee_id" required>
              <option value="">Select an Employee</option>
              {employees.map((employee: any) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label htmlFor="start_time">Start Time</label>
          <input
            type="datetime-local"
            name="start_time"
            id="start_time"
            required
            defaultValue={isEditing ? timesheet.start_time : ""}
          />
        </div>
        <div>
          <label htmlFor="end_time">End Time</label>
          <input
            type="datetime-local"
            name="end_time"
            id="end_time"
            required
            defaultValue={isEditing ? timesheet.end_time : ""}
          />
        </div>
        <button type="submit">{isEditing ? "Save Changes" : "Create Timesheet"}</button>
      </Form>

      {isEditing && (
        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <button type="submit">Delete Timesheet</button>
        </Form>
      )}

      <hr />
      <ul>
        <li><a href="/timesheets">Timesheets</a></li>
        <li><a href="/employees">Employees</a></li>
      </ul>
    </div>
  );
}

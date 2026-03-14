import { api } from "../app/api.js";

export async function runRemindersNow() {
  const { data } = await api.post("/reminders/run-now");
  return data.result;
}
